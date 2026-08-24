package com.brasilpanel.backend.service.email;

import com.brasilpanel.backend.model.EmailOutboxEntry;
import com.brasilpanel.backend.model.EmailOutboxStatus;
import com.brasilpanel.backend.model.EmailType;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.email.EmailOutboxRepository;
import com.brasilpanel.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Envia UMA entrada da fila, em transação própria.
 *
 * <p>Bean separado do {@link EmailOutboxService} de propósito, e não por gosto de
 * dividir: {@code @Transactional} só vale quando a chamada atravessa o proxy do Spring.
 * Se o laço do drain chamasse um método deste mesmo objeto, a anotação seria ignorada
 * em silêncio e o lote inteiro rodaria fora de transação.
 *
 * <p>Uma transação por entrada, e não por lote: uma falha no meio do lote não pode
 * desfazer o registro de sucesso das anteriores — o e-mail delas já saiu de verdade, e
 * reenviar é pior que não registrar.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailOutboxDispatcher {

    private final EmailOutboxRepository outboxRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.mail.outbox.max-attempts:5}")
    private int maxAttempts;

    /** Base do backoff exponencial: 1min, 2min, 4min, 8min... */
    @Value("${app.mail.outbox.retry-backoff:PT1M}")
    private Duration retryBackoff;

    /**
     * @return {@code true} se o e-mail saiu; {@code false} em falha, ou quando a entrada
     *         deixou de ser aplicável
     */
    @Transactional
    public boolean processar(UUID id) {
        EmailOutboxEntry entrada = outboxRepository.findById(id).orElse(null);

        // Reconferido dentro da transação: entre a leitura do lote e este ponto a
        // entrada pode ter mudado de estado.
        if (entrada == null || entrada.getStatus() != EmailOutboxStatus.PENDING) {
            return false;
        }

        try {
            boolean enviou = despachar(entrada);
            outboxRepository.save(entrada);
            return enviou;

        } catch (Exception e) {
            // A mensagem de uma falha de SMTP pode citar host e credencial: fica no
            // banco e no log do servidor, nunca numa resposta ao cliente.
            log.warn("[Outbox] Falha ao enviar para '{}' (tentativa {}): {}",
                    entrada.getRecipient(), entrada.getAttempts() + 1, e.getMessage());

            entrada.markFailure(e.getMessage(), backoffPara(entrada.getAttempts()), maxAttempts);
            outboxRepository.save(entrada);

            if (entrada.getStatus() == EmailOutboxStatus.FAILED) {
                log.error("[Outbox] Desistindo do envio para '{}' após {} tentativas.",
                        entrada.getRecipient(), entrada.getAttempts());
            }
            return false;
        }
    }

    private boolean despachar(EmailOutboxEntry entrada) {
        if (entrada.getEmailType() != EmailType.VERIFICATION_CODE) {
            entrada.markObsolete("Tipo de e-mail sem tratamento: " + entrada.getEmailType());
            return false;
        }

        // O código vem de users, não da fila: ver javadoc de EmailOutboxEntry.
        Optional<UserEntity> usuario = userRepository.findByEmail(entrada.getRecipient());

        if (usuario.isEmpty()) {
            entrada.markObsolete("Conta não existe mais");
            return false;
        }
        if (usuario.get().isVerified() || usuario.get().getVerificationCode() == null) {
            entrada.markObsolete("Conta já verificada");
            return false;
        }

        emailService.sendVerificationCode(entrada.getRecipient(), usuario.get().getVerificationCode());
        entrada.markSent();
        return true;
    }

    /** Backoff exponencial a partir do número de tentativas já feitas, com teto. */
    private Duration backoffPara(int tentativasFeitas) {
        return retryBackoff.multipliedBy(1L << Math.min(tentativasFeitas, 6));
    }
}
