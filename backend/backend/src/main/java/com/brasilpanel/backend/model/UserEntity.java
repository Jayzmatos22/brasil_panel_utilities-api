package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;


@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // Perfil do usuário — armazenado como string no banco para legibilidade
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    // ── Verificação de e-mail ─────────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(length = 6)
    private String verificationCode;

    private LocalDateTime verificationCodeExpiresAt;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    // Permite ao AdminSeeder / serviço de promoção alterar o role
    public void setRole(Role role) {
        this.role = role;
    }

    // ── Setters de verificação ────────────────────────────────────────────
    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public void setVerificationCode(String code) {
        this.verificationCode = code;
    }

    public void setVerificationCodeExpiresAt(LocalDateTime expiresAt) {
        this.verificationCodeExpiresAt = expiresAt;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }
}
