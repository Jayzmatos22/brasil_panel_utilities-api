package com.brasilpanel.backend.service.email;

import com.brasilpanel.backend.model.EmailOutboxEntry;
import com.brasilpanel.backend.model.EmailOutboxStatus;
import com.brasilpanel.backend.model.EmailType;
import com.brasilpanel.backend.repository.email.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Fila de envio de e-mail: enfileira na requisição, envia no scheduler.
 *
 * <p>O cadastro grava uma linha e responde na hora — o handshake SMTP sai do caminho
 * crítico, e uma falha de envio deixa de derrubar o cadastro com 500. O
 * {@code EmailOutboxScheduler} drena, com retry e backoff.
 *
 * <p><b>Por que banco e não fila em memória.</b> No Render o serviço hiberna após
 * ~15 min de inatividade no plano free, e todo redeploy reinicia o processo. Uma fila
 * em memória (um {@code @Async} com executor próprio) perderia o que estivesse pendente
 * nos dois casos — justamente nos momentos de menor tráfego, que é quando o cadastro de
 * um visitante isolado acontece. Em tabela, a fila sobrevive.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailOutboxService {

    /**
     * Teto de entradas por rodada. Existe para o drain não puxar a fila inteira depois
     * de uma indisponibilidade longa do SMTP — o lote é enviado em sequência e cada
     * envio segura a thread do scheduler.
     */
    private static final Limit LOTE = Limit.of(20);

    private final EmailOutboxRepository outboxRepository;
    private final EmailOutboxDispatcher dispatcher;

    // ── Produção ─────────────────────────────────────────────────────────────

    /**
     * Enfileira o envio do código de verificação.
     *
     * <p>Não recebe o código de propósito: ele é lido de {@code users} na hora do envio,
     * então um reenvio pedido antes do drain rodar faz sair o código vigente.
     */
    @Transactional
    public void enqueueVerificationCode(String recipient) {
        outboxRepository.save(EmailOutboxEntry.builder()
                .recipient(recipient)
                .emailType(EmailType.VERIFICATION_CODE)
                .status(EmailOutboxStatus.PENDING)
                .nextAttemptAt(LocalDateTime.now())
                .build());

        log.debug("[Outbox] Envio enfileirado para '{}'.", recipient);
    }

    // ── Consumo ──────────────────────────────────────────────────────────────

    /**
     * Envia o lote pendente da vez. Cada entrada roda em transação própria, no
     * {@link EmailOutboxDispatcher}: uma falha registra o erro e agenda a próxima
     * tentativa, sem abortar as demais do lote.
     *
     * @return quantas entradas foram enviadas com sucesso
     */
    public int drain() {
        List<EmailOutboxEntry> pendentes = outboxRepository
                .findByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
                        EmailOutboxStatus.PENDING, LocalDateTime.now(), LOTE);

        if (pendentes.isEmpty()) {
            return 0;
        }

        int enviados = 0;
        for (EmailOutboxEntry entrada : pendentes) {
            if (dispatcher.processar(entrada.getId())) {
                enviados++;
            }
        }

        log.info("[Outbox] Lote processado: {} de {} enviados.", enviados, pendentes.size());
        return enviados;
    }

    // ── Expurgo ──────────────────────────────────────────────────────────────

    /**
     * Remove entradas concluídas. As FAILED sobrevivem mais tempo que as SENT porque
     * são elas que se investiga depois de um incidente.
     */
    @Transactional
    public int prune(int diasEnviadas, int diasFalhas) {
        LocalDateTime agora = LocalDateTime.now();

        int enviadas = outboxRepository.deleteCompletedBefore(
                List.of(EmailOutboxStatus.SENT, EmailOutboxStatus.OBSOLETE),
                agora.minusDays(diasEnviadas));

        int falhas = outboxRepository.deleteCompletedBefore(
                List.of(EmailOutboxStatus.FAILED),
                agora.minusDays(diasFalhas));

        return enviadas + falhas;
    }

    /** Quantas entradas aguardam envio agora. */
    public long pendentes() {
        return outboxRepository.countByStatus(EmailOutboxStatus.PENDING);
    }
}
