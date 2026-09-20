package com.brasilpanel.backend.service.email;

import com.brasilpanel.backend.config.async.AsyncConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Drena a fila assim que algo entra nela.
 *
 * <p><b>Por que isto existe.</b> Antes, a fila era varrida a cada 10 segundos para
 * que o código de verificação não demorasse. O efeito colateral era uma consulta ao
 * banco a cada 10 segundos, 24 horas por dia — e o Neon cobra por tempo com o banco
 * acordado, suspendendo só depois de 5 minutos ocioso. Com a varredura em 10
 * segundos, ele nunca dormia.
 *
 * <p>Com o evento, o caminho normal deixa de depender da varredura: enfileirou,
 * envia. A varredura periódica continua existindo, mas rara, e só como rede de
 * segurança para retentativas e para o que um evento perdido tenha deixado para trás.
 *
 * <p><b>AFTER_COMMIT, não antes.</b> Drenar dentro da transação que gravou a entrada
 * leria um estado que ainda pode sofrer rollback — o e-mail sairia anunciando um
 * cadastro que não existe.
 *
 * <p><b>Assíncrono</b> para o usuário não esperar o handshake SMTP na resposta do
 * cadastro. Ver {@link AsyncConfig} para o dimensionamento do pool.
 */
@Component
@Profile("!test")   // mesma razão do EmailOutboxScheduler: dispararia durante os testes
@RequiredArgsConstructor
@Slf4j
public class EmailOutboxDrainListener {

    private final EmailOutboxService outboxService;

    @Async(AsyncConfig.EMAIL_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoEnfileirar(EmailEnqueuedEvent evento) {
        try {
            outboxService.drain();
        } catch (Exception e) {
            // A rede de segurança é a varredura periódica: falhar aqui atrasa o
            // envio, não o perde.
            log.warn("[Outbox] Drain por evento falhou; a varredura periódica assume.", e);
        }
    }
}
