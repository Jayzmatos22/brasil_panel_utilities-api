package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Desafio por e-mail para uma ação sensível: um código de 6 dígitos que expira, conta
 * tentativas e morre ao ser consumido.
 *
 * <p>Um desafio não consumido não autoriza nada — o login de admin não emite JWT, a troca
 * de senha não toca em {@code users.password} e a recuperação não redefine coisa alguma.
 * A finalidade ({@link AuthChallengePurpose}) é o que separa os fluxos: um código emitido
 * para recuperar a senha não serve para confirmar um login.
 */
@Entity
@Table(name = "auth_challenge")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuthChallengePurpose purpose;

    @Column(nullable = false, length = 6)
    private String code;

    /** Hash BCrypt da senha nova. Só em {@link AuthChallengePurpose#PASSWORD_CHANGE}. */
    @Column(name = "pending_password_hash", length = 100)
    private String pendingPasswordHash;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    // ── Estado ───────────────────────────────────────────────────────────────

    public boolean isConsumed() {
        return consumedAt != null;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

    /** Vale para conferir um código: nem consumido, nem expirado. */
    public boolean isUsable() {
        return !isConsumed() && !isExpired();
    }

    public void registerFailedAttempt() {
        this.attempts += 1;
    }

    /**
     * Marca como consumido. Irreversível de propósito: um código confirmado não pode
     * valer duas vezes, ou quem interceptar o e-mail reusa o mesmo código.
     */
    public void consume() {
        this.consumedAt = LocalDateTime.now();
    }
}
