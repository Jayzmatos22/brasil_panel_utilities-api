package com.brasilpanel.backend.service.api.sidra;

import com.brasilpanel.backend.dto.api.ibge.PibEstadualDTO;
import com.brasilpanel.backend.exception.customized.IbgeException;
import com.brasilpanel.backend.model.PibEstadualSnapshot;
import com.brasilpanel.backend.service.financial.DbFirst;
import com.brasilpanel.backend.service.financial.SnapshotFreshness;
import com.brasilpanel.backend.service.financial.SnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Serve o PIB por Unidade da Federação (IBGE/SIDRA, tabela 5938 / variável 37 — PIB a preços
 * correntes em mil reais, nível n3 = UF). DB-first: cache → snapshot → SIDRA (fallback + persiste).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SidraService {

    private final RestClient restClient;
    private final SnapshotService snapshotService;

    // tabela 5938, nível n3 (UFs), variável 37 (PIB preços correntes), último período.
    private static final String PIB_UF_URL =
            "https://apisidra.ibge.gov.br/values/t/5938/n3/all/v/37/p/last";
    // SIDRA entrega o PIB em mil reais; convertemos para reais absolutos.
    private static final BigDecimal MIL = BigDecimal.valueOf(1000);
    // Ver getPibPorEstado: sem scheduler, esta janela é o que realimenta o banco.
    static final Duration JANELA_PIB_UF = Duration.ofDays(7);

    /**
     * PIB por estado do ano mais recente, do maior para o menor, servido do banco
     * enquanto valer.
     *
     * <p><b>Esta fonte não tem scheduler.</b> Quem realimenta o banco é justamente o
     * caminho "vencido → busca" daqui, então a janela não é só economia: sem ela o
     * primeiro snapshot seria servido para sempre e o painel nunca veria um ano novo.
     *
     * <p>A janela é por duração e não por calendário porque o IBGE publica o PIB
     * estadual com cerca de dois anos de defasagem, sem data fixa — deduzir "o último
     * ano publicado" exigiria codificar essa defasagem e erraria a cada revisão de
     * cronograma. Sete dias é conservador para dado anual.
     *
     * <p>Se a busca falhar e houver snapshot, devolve o antigo com log de aviso, em
     * vez de derrubar a resposta.
     */
    @Cacheable("sidra-pib-estados")
    public List<PibEstadualDTO> getPibPorEstado() {
        List<PibEstadualSnapshot> stored = snapshotService.getLatestPibEstadualYear()
                .map(snapshotService::getPibEstadualByYear)
                .orElseGet(List::of);
        LocalDateTime buscadoEm = stored.isEmpty() ? null : stored.getFirst().getFetchedAt();

        return DbFirst.serve(
                "PIB estadual (SIDRA)",
                stored.isEmpty()
                        ? Optional.empty()
                        : Optional.of(stored.stream().map(this::toDTO).toList()),
                SnapshotFreshness.isStale(buscadoEm, JANELA_PIB_UF),
                buscadoEm != null ? buscadoEm.toLocalDate() : null,
                this::refreshPibPorEstado);
    }

    /** Busca o PIB por UF no SIDRA (1 requisição), persiste cada UF e devolve a lista. */
    public List<PibEstadualDTO> refreshPibPorEstado() {
        List<PibEstadualDTO> dados = fetchPibPorEstado();
        for (PibEstadualDTO dto : dados) {
            snapshotService.savePibEstadual(dto.year(), dto.ufCode(), dto.uf(), dto.value());
        }
        return dados;
    }

    private List<PibEstadualDTO> fetchPibPorEstado() {
        try {
            List<Map<String, Object>> response = restClient.get()
                    .uri(PIB_UF_URL)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (response == null || response.size() < 2) {
                throw new IbgeException("SIDRA retornou dados de PIB estadual vazios", 502);
            }

            List<PibEstadualDTO> dados = new ArrayList<>();
            // O primeiro item é o cabeçalho descritivo — começamos do segundo.
            for (Map<String, Object> row : response.subList(1, response.size())) {
                String rawValue = (String) row.get("V");
                if (rawValue == null || !rawValue.matches("-?\\d+(\\.\\d+)?")) continue; // "-", "...", "X"

                Integer ufCode = parseInt(row.get("D1C"));
                Integer year = parseInt(row.get("D3N"));
                if (ufCode == null || year == null) continue;

                BigDecimal reais = new BigDecimal(rawValue).multiply(MIL);
                dados.add(new PibEstadualDTO(year, ufCode, (String) row.get("D1N"), reais));
            }

            if (dados.isEmpty()) {
                throw new IbgeException("Nenhum PIB estadual válido no retorno do SIDRA", 502);
            }

            dados.sort((a, b) -> b.value().compareTo(a.value()));
            return dados;

        } catch (IbgeException e) {
            throw e;
        } catch (Exception e) {
            throw new IbgeException("Erro ao buscar PIB estadual no SIDRA: " + e.getMessage(), 502);
        }
    }

    private Integer parseInt(Object o) {
        try {
            return o == null ? null : Integer.parseInt(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private PibEstadualDTO toDTO(PibEstadualSnapshot s) {
        return new PibEstadualDTO(s.getYear(), s.getUfCode(), s.getUf(), s.getValue());
    }
}