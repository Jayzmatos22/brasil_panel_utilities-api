package com.brasilpanel.backend.service.api.ipea;


import com.brasilpanel.backend.dto.api.ipea.IpeaItemDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaResponseDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.exception.customized.IpeaException;
import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.service.financial.FinancialDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

/**
 * Serve séries do IPEA priorizando o banco local.
 * DB-first: cache → FinancialDataPoint (source "IPEA") → API externa (fallback + persiste).
 */
@Service
@RequiredArgsConstructor
public class IpeaService {
    private final RestClient restClient;
    private final FinancialDataService financialDataService;
    private static final String SOURCE = "IPEA";
    private static final ZoneOffset BRT = ZoneOffset.of("-03:00");
    private static final String BASE_URL =
            "http://ipeadata.gov.br/api/odata4/Metadados('{codigo}')/Valores";

    // Emprego
    private static final String DESOCUPACAO = "PNADC12_NDESOCM12";
    private static final String OCUPACAO = "PNADC12_NOCUP12";

    // Renda
    private static final String SALARIO_MINIMO_REAL = "GAC12_SALMINRE12";
    private static final String SALARIO_MINIMO_PPC = "GAC12_SALMINDOL12";
    private static final String RENDA_PER_CAPITA = "PNADS_RENDAMEDIA";

    // Desigualdade
    private static final String GINI = "PNADS_GINI";
    private static final String POBREZA = "PNADS_PERCPOBRE300";

    // Macro
    private static final String PIB = "WEO_PIBWEOBRA";
    private static final String INVESTIMENTO = "WEO_INVESTWEOBRA";
    private static final String DESEMPREGO_FMI = "WEO_DESEMWEOBRA";
    private static final String SELIC = "PAN12_TJOVER12";
    private static final String RESERVAS = "BM12_RES12";
    private static final String ARRECADACAO = "SRF12_TOTGER12";

    // Preços
    private static final String INPC = "PRECOS12_INPC12";
    private static final String IGPM = "IGP12_IGPM12";

    // População
    private static final String POPULACAO = "PNADC12_POP12";
    private static final String PROJECAO_TOTAL = "DEPIS_POPP";
    private static final String PROJECAO_HOMENS = "DEPIS_POPHP";
    private static final String PROJECAO_MULHERES = "DEPIS_POPMP";


    @Cacheable("ipea-emprego")
    public List<IpeaSerieDTO> getEmprego() {
        return List.of(
                serie(DESOCUPACAO, "Taxa de desocupação (%)"),
                serie(OCUPACAO, "Nível de ocupação (%)")
        );
    }


    @Cacheable("ipea-renda")
    public List<IpeaSerieDTO> getRenda() {
        return List.of(
                serie(SALARIO_MINIMO_REAL, "Salário mínimo real (R$)"),
                serie(SALARIO_MINIMO_PPC, "Salário mínimo PPC (USD)"),
                serie(RENDA_PER_CAPITA, "Renda domiciliar per capita (R$)")
        );
    }


    @Cacheable("ipea-desigualdade")
    public List<IpeaSerieDTO> getDesigualdade() {
        return List.of(
                serie(GINI, "Coeficiente de Gini"),
                serie(POBREZA, "Taxa de pobreza % (PPC$3/dia)")
        );
    }


    @Cacheable("ipea-macro")
    public List<IpeaSerieDTO> getMacro() {
        return List.of(
                serie(PIB, "PIB (US$ bilhões)"),
                serie(INVESTIMENTO, "Investimento (% PIB)"),
                serie(DESEMPREGO_FMI, "Taxa de desemprego FMI (%)"),
                serie(SELIC, "Taxa Selic/Overnight (% a.a.)"),
                serie(RESERVAS, "Reservas internacionais (US$ milhões)"),
                serie(ARRECADACAO, "Arrecadação federal (R$ milhões)")
        );
    }


    @Cacheable("ipea-precos")
    public List<IpeaSerieDTO> getPrecos() {
        return List.of(
                serie(INPC, "INPC - índice"),
                serie(IGPM, "IGP-M - índice")
        );
    }


    @Cacheable("ipea-populacao")
    public List<IpeaSerieDTO> getPopulacao() {
        return List.of(
                serie(POPULACAO, "População total (mil pessoas)"),
                serie(PROJECAO_TOTAL, "Projeção população total"),
                serie(PROJECAO_HOMENS, "Projeção população homens"),
                serie(PROJECAO_MULHERES, "Projeção população mulheres")
        );
    }

    private static final List<String> ALL_CODES = List.of(
            DESOCUPACAO, OCUPACAO,
            SALARIO_MINIMO_REAL, SALARIO_MINIMO_PPC, RENDA_PER_CAPITA,
            GINI, POBREZA,
            PIB, INVESTIMENTO, DESEMPREGO_FMI, SELIC, RESERVAS, ARRECADACAO,
            INPC, IGPM,
            POPULACAO, PROJECAO_TOTAL, PROJECAO_HOMENS, PROJECAO_MULHERES
    );

    /**
     * Força a busca de todas as séries na API e persiste os pontos novos
     * (idempotente — datas já existentes são ignoradas), ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco. Falhas por série não abortam as demais.
     */
    public void refreshAll() {
        for (String codigo : ALL_CODES) {
            try {
                persist(codigo, fetchSerie(codigo));
            } catch (Exception e) {
                // segue para a próxima série mesmo que uma falhe na API
            }
        }
    }

    // ── DB-first ──────────────────────────────────────────────────────────

    /** Monta uma série DB-first: lê do banco; se vazio, busca na API e persiste. */
    private IpeaSerieDTO serie(String codigo, String nome) {
        return new IpeaSerieDTO(codigo, nome, loadSerie(codigo));
    }

    private List<IpeaItemDTO> loadSerie(String codigo) {
        List<FinancialDataPoint> points = financialDataService.getAllPoints(codigo, SOURCE);

        if (!points.isEmpty()) {
            return points.stream()
                    .sorted(Comparator.comparing(FinancialDataPoint::getReferenceDate).reversed())
                    .map(p -> new IpeaItemDTO(
                            p.getReferenceDate().atStartOfDay().atOffset(BRT),
                            p.getValue().doubleValue()))
                    .toList();
        }

        // Cold path: banco vazio → busca na API e persiste para as próximas leituras.
        List<IpeaItemDTO> fresh = fetchSerie(codigo);
        persist(codigo, fresh);
        return fresh;
    }

    private void persist(String codigo, List<IpeaItemDTO> dados) {
        for (IpeaItemDTO item : dados) {
            if (item.data() == null || item.valor() == null) continue;
            financialDataService.savePoint(codigo, SOURCE, item.data().toLocalDate(), item.valor(), null);
        }
    }

    // Requisição feita à API baseada no código.
    // As requisições abaixo reutilizam essa função, só o código de série muda.
    private List<IpeaItemDTO> fetchSerie(String codigo) {
        try {
            String url = BASE_URL.replace("{codigo}", codigo);
            IpeaResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(IpeaResponseDTO.class);

            if (response == null || response.value() == null) {
                throw new IpeaException("Série não encontrada: " + codigo, 404);
            }

            return response.value().stream()
                    .sorted(Comparator.comparing(IpeaItemDTO::data).reversed())
                    .toList();

        } catch (IpeaException e) {
            throw e;
        } catch (Exception e) {
            throw new IpeaException("Erro ao buscar série: " + codigo, 502);
        }
    }

}
