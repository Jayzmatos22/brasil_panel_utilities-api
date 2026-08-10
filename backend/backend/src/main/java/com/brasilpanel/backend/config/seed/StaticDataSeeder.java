package com.brasilpanel.backend.config.seed;

import com.brasilpanel.backend.dto.api.brasilAPI.BankDTO;
import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.model.Bank;
import com.brasilpanel.backend.model.IbgeState;
import com.brasilpanel.backend.repository.static_data.BankRepository;
import com.brasilpanel.backend.repository.static_data.IbgeStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Carrega bancos (BrasilAPI) e estados (IBGE) no startup se as tabelas estiverem vazias.
 * Municípios são carregados sob demanda pelo StaticDataService.
 *
 * @Order(2) — roda depois do FinancialSeriesSeeder (Order padrão = lowest precedence)
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
@Profile("!test")   // faz chamadas a BrasilAPI e IBGE — não deve rodar em teste
public class StaticDataSeeder implements ApplicationRunner {

    private final RestClient restClient;
    private final BankRepository bankRepository;
    private final IbgeStateRepository stateRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedBanks();
        seedStates();
    }

    // ── Bancos ────────────────────────────────────────────────────────────

    /** Depois disso a lista local é considerada obsoleta e recarregada da BrasilAPI. */
    private static final Duration BANK_MAX_AGE = Duration.ofDays(30);

    /** Limites das colunas de `banks` — ver V1__baseline.sql. */
    private static final int NAME_MAX_LENGTH = 120;
    private static final int FULL_NAME_MAX_LENGTH = 200;

    @Transactional
    void seedBanks() {
        if (!banksAreStale()) {
            log.debug("StaticDataSeeder: bancos atualizados, pulando.");
            return;
        }
        try {
            List<BankDTO> data = restClient.get()
                    .uri("https://brasilapi.com.br/api/banks/v1")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<BankDTO>>() {});

            if (data == null || data.isEmpty()) {
                // Erro, não aviso: sem bancos a página /dashboard/brasil/bancos
                // fica vazia, e isso precisa aparecer no log de produção.
                log.error("StaticDataSeeder: BrasilAPI retornou lista de bancos vazia.");
                return;
            }

            List<Bank> banks = data.stream()
                    // Instituições sem COMPE existem no SFN, mas a página de bancos
                    // é consultada por código. O ISPB agora é NOT NULL na tabela.
                    .filter(b -> b.code() != null && b.code() > 0)
                    .filter(b -> b.name() != null && !b.name().isBlank())
                    .filter(b -> b.ispb() != null && !b.ispb().isBlank())
                    .map(b -> Bank.builder()
                            .code(b.code())
                            .name(truncate(b.name(), NAME_MAX_LENGTH, "name", b.code()))
                            .fullName(truncate(b.fullName(), FULL_NAME_MAX_LENGTH, "fullName", b.code()))
                            .ispb(b.ispb().trim())
                            .build())
                    .toList();

            // Recarga completa: sem isto um re-sync colidiria com o unique de
            // code/ispb das linhas já gravadas.
            bankRepository.deleteAllInBatch();
            bankRepository.saveAll(banks);
            log.info("StaticDataSeeder: {} bancos carregados.", banks.size());

        } catch (Exception e) {
            log.error("StaticDataSeeder: falha ao carregar bancos — {}", e.getMessage(), e);
        }
    }

    /**
     * Antes bastava a tabela estar vazia: uma vez semeada, ela nunca mais era
     * atualizada e instituições novas na BrasilAPI jamais entravam — o campo
     * {@code syncedAt} era gravado e nunca lido.
     */
    private boolean banksAreStale() {
        return bankRepository.findLastSyncedAt()
                .map(last -> last.isBefore(LocalDateTime.now().minus(BANK_MAX_AGE)))
                .orElse(true);
    }

    /**
     * O {@code saveAll} é um lote único: um só valor acima do limite da coluna
     * derrubava a gravação inteira e deixava a tabela vazia. Truncar (e registrar)
     * mantém a carga íntegra.
     */
    private String truncate(String value, int maxLength, String field, Integer code) {
        if (value == null || value.length() <= maxLength) return value;
        log.warn("StaticDataSeeder: '{}' do banco {} truncado em {} caracteres.", field, code, maxLength);
        return value.substring(0, maxLength);
    }

    // ── Estados ───────────────────────────────────────────────────────────

    @Transactional
    void seedStates() {
        if (stateRepository.count() > 0) {
            log.debug("StaticDataSeeder: estados já existem, pulando.");
            return;
        }
        try {
            List<EstadoDTO> data = restClient.get()
                    .uri("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<EstadoDTO>>() {});

            if (data == null || data.isEmpty()) {
                log.warn("StaticDataSeeder: IBGE retornou lista de estados vazia.");
                return;
            }

            List<IbgeState> states = data.stream()
                    .map(e -> IbgeState.builder()
                            .id(e.id())
                            .sigla(e.sigla())
                            .nome(e.nome())
                            .regiaoId(e.regiao().id())
                            .regiaoSigla(e.regiao().sigla())
                            .regiaoNome(e.regiao().nome())
                            .build())
                    .toList();

            stateRepository.saveAll(states);
            log.info("StaticDataSeeder: {} estados carregados.", states.size());

        } catch (Exception e) {
            log.warn("StaticDataSeeder: falha ao carregar estados — {}", e.getMessage());
        }
    }
}
