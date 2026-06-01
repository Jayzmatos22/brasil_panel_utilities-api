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
import org.springframework.core.annotation.Order;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

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

    @Transactional
    void seedBanks() {
        if (bankRepository.count() > 0) {
            log.debug("StaticDataSeeder: bancos já existem, pulando.");
            return;
        }
        try {
            List<BankDTO> data = restClient.get()
                    .uri("https://brasilapi.com.br/api/banks/v1")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<BankDTO>>() {});

            if (data == null || data.isEmpty()) {
                log.warn("StaticDataSeeder: BrasilAPI retornou lista de bancos vazia.");
                return;
            }

            List<Bank> banks = data.stream()
                    .filter(b -> b.code() != null && b.code() > 0)
                    .filter(b -> b.name() != null && !b.name().isBlank())
                    .map(b -> Bank.builder()
                            .code(b.code())
                            .name(b.name())
                            .fullName(b.fullName())
                            .ispb(b.ispb())
                            .build())
                    .toList();

            bankRepository.saveAll(banks);
            log.info("StaticDataSeeder: {} bancos carregados.", banks.size());

        } catch (Exception e) {
            log.warn("StaticDataSeeder: falha ao carregar bancos — {}", e.getMessage());
        }
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
