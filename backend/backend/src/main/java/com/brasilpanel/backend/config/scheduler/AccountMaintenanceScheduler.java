package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.auth.UnverifiedAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Faxina das contas: apaga cadastros que nunca foram verificados.
 *
 * <p>De madrugada, no mesmo horário dos outros expurgos, para não competir com o uso.
 * Atrasar não tem consequência — o prazo é de dias, não de minutos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountMaintenanceScheduler {

    private final UnverifiedAccountService unverifiedAccounts;

    @Value("${app.accounts.unverified-retention-days:7}")
    private int retencaoNaoVerificados;

    @Scheduled(cron = "0 50 3 * * *", zone = "America/Sao_Paulo")
    public void expurgarNaoVerificados() {
        try {
            int removidos = unverifiedAccounts.purge(retencaoNaoVerificados);
            if (removidos > 0) {
                log.info("[Contas] Expurgo concluído: {} cadastros não verificados removidos.", removidos);
            }
        } catch (Exception e) {
            // Uma rodada que estoura não pode cancelar o agendamento das seguintes.
            log.error("[Contas] Expurgo falhou; a próxima rodada segue agendada.", e);
        }
    }
}
