package com.brasilpanel.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Um token que foi revogado antes de expirar — na prática, um logout.
 *
 * <p>A chave é o próprio {@code jti}, e não um id gerado: revogar duas vezes o
 * mesmo token é o mesmo fato, não dois. Deixar o banco recusar a duplicata pela
 * chave primária evita ter de consultar antes de gravar.
 */
@Entity
@Table(name = "revoked_token")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RevokedToken {

    /** O {@code jti} do JWT. UUID em texto = 36 caracteres; 64 dá folga. */
    @Id
    @Column(length = 64, nullable = false)
    private String jti;

    /** O {@code exp} do token. Depois deste instante a linha pode ser expurgada. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at", nullable = false)
    private LocalDateTime revokedAt;
}
