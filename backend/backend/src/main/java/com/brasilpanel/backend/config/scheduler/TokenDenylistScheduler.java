package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.auth.TokenDenylistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Limpa a denylist de tokens.
 *
 * <p>Depois que um token expira por conta própria, a linha que o revoga não muda
 * mais nada: a validação de {@code exp} já o recusa. Sem esta faxina a tabela
 * cresceria para sempre, guardando indefinidamente o registro de cada logout.
 *
 * <p>Roda de madrugada, no mesmo horário dos outros expurgos, para não competir
 * com o uso. Atrasar a limpeza não tem consequência de segurança — só de tamanho
 * de tabela —, então não há motivo para rodar com frequência.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenDenylistScheduler {

    private final TokenDenylistService tokenDenylist;

    @Scheduled(cron = "0 45 3 * * *", zone = "America/Sao_Paulo")
    public void expurgarExpirados() {
        try {
            int removidos = tokenDenylist.prune();
            if (removidos > 0) {
                log.info("[Denylist] Expurgo concluído: {} tokens expirados removidos.", removidos);
            }
        } catch (Exception e) {
            // Uma rodada que estoura não pode cancelar o agendamento das seguintes.
            log.error("[Denylist] Expurgo falhou; a próxima rodada segue agendada.", e);
        }
    }
}
