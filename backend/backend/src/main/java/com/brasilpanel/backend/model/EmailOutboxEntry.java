package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Uma intenção de envio de e-mail, aguardando o drain do
 * {@code EmailOutboxScheduler}.
 *
 * <p><b>Guarda a intenção, não o conteúdo.</b> O código de verificação continua
 * vivendo apenas em {@link UserEntity#getVerificationCode()} e é lido no momento do
 * envio. Duplicá-lo aqui espalharia um segredo por uma segunda tabela sem
 * necessidade, e ainda deixaria a fila entregar um código já substituído caso o
 * usuário peça reenvio antes do drain rodar.
 */
@Entity
@Table(name = "email_outbox")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOutboxEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** 320 = tamanho máximo de um endereço de e-mail (64 local + @ + 255 domínio). */
    @Column(nullable = false, length = 320)
    private String recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false, length = 40)
    private EmailType emailType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EmailOutboxStatus status = EmailOutboxStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    /** Antes deste instante o drain ignora a entrada — é o backoff entre tentativas. */
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime nextAttemptAt = LocalDateTime.now();

    /**
     * Motivo da última falha, truncado. Só para diagnóstico no banco: a mensagem de
     * uma falha de SMTP pode citar host e credencial, e nunca é devolvida ao cliente.
     */
    @Column(length = 500)
    private String lastError;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    /** Quando chegou a um estado terminal — base do expurgo diário. */
    private LocalDateTime completedAt;

    // ── Transições ───────────────────────────────────────────────────────────

    public void markSent() {
        this.status = EmailOutboxStatus.SENT;
        this.attempts += 1;
        this.lastError = null;
        this.completedAt = LocalDateTime.now();
    }

    public void markObsolete(String reason) {
        this.status = EmailOutboxStatus.OBSOLETE;
        this.lastError = truncate(reason);
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Registra uma falha e agenda a próxima tentativa, ou encerra em FAILED quando
     * as tentativas acabam.
     *
     * @param backoff espera até a próxima tentativa
     * @param maxAttempts teto de tentativas antes de desistir
     */
    public void markFailure(String reason, java.time.Duration backoff, int maxAttempts) {
        this.attempts += 1;
        this.lastError = truncate(reason);

        if (this.attempts >= maxAttempts) {
            this.status = EmailOutboxStatus.FAILED;
            this.completedAt = LocalDateTime.now();
        } else {
            this.status = EmailOutboxStatus.PENDING;
            this.nextAttemptAt = LocalDateTime.now().plus(backoff);
        }
    }

    private static String truncate(String value) {
        if (value == null) return null;
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}
