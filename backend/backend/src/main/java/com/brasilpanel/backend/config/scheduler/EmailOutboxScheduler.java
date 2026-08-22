package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.email.EmailOutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Drena a fila de e-mail e expurga o que já foi concluído.
 *
 * <p><b>Por que 10 segundos.</b> É o atraso máximo que o usuário espera pelo código de
 * verificação, então não pode ser o cron de minutos usado pelos outros schedulers. Na
 * prática o atraso é invisível: entre submeter o cadastro e abrir a caixa de entrada o
 * usuário gasta mais que isso, e a própria entrega do SMTP leva alguns segundos. Com a
 * fila vazia — o caso normal — a rodada é uma consulta indexada que não devolve nada.
 */
@Component
@Profile("!test")   // dispara a cada 10s — rodaria DURANTE os testes, ao contrário
                    // dos demais schedulers, que usam cron em horário fixo. Além do
                    // ruído, tornava a cobertura não-determinística: em execução
                    // lenta a rodada acontecia e contava, em execução rápida não.
                    // A lógica é coberta diretamente por EmailOutboxSchedulerTest.
@RequiredArgsConstructor
@Slf4j
public class EmailOutboxScheduler {

    private final EmailOutboxService outboxService;

    @Value("${app.mail.outbox.retention.sent-days:3}")
    private int retencaoEnviadas;

    @Value("${app.mail.outbox.retention.failed-days:30}")
    private int retencaoFalhas;

    /**
     * fixedDelay, não fixedRate: conta a partir do FIM da rodada anterior. Com um SMTP
     * lento, fixedRate empilharia rodadas sobrepostas disputando as mesmas entradas.
     */
    @Scheduled(fixedDelayString = "${app.mail.outbox.drain-interval-ms:10000}",
               initialDelayString = "${app.mail.outbox.drain-interval-ms:10000}")
    public void drenarFila() {
        try {
            outboxService.drain();
        } catch (Exception e) {
            // Uma rodada que estoura não pode matar o agendamento: sem este catch o
            // Spring cancela as execuções seguintes e a fila para para sempre.
            log.error("[Outbox] Rodada de drain falhou; a próxima segue agendada.", e);
        }
    }

    /** Expurgo de madrugada, no mesmo horário dos demais, para não competir com o uso. */
    @Scheduled(cron = "0 40 3 * * *", zone = "America/Sao_Paulo")
    public void expurgarConcluidas() {
        int removidas = outboxService.prune(retencaoEnviadas, retencaoFalhas);
        if (removidas > 0) {
            log.info("[Outbox] Expurgo concluído: {} entradas removidas.", removidas);
        }
    }
}
