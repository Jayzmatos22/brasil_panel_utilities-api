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

    // ── Perfil profissional (onboarding) ──────────────────────────────────
    // Todos opcionais: a etapa pode ser pulada, e quem se cadastrou antes da
    // V3 não tem nada preenchido.

    @Column(length = 120)
    private String profession;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private ProfessionalArea area;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private EducationLevel educationLevel;

    @Column(length = 160)
    private String institution;

    // Marca a passagem pelo onboarding — preenchido ou pulado. Null distingue
    // "ainda não viu a etapa" de "viu e não quis responder"; sem isso, quem pula
    // reveria a tela para sempre.
    private LocalDateTime onboardingCompletedAt;

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

    public void setName(String name) {
        this.name = name;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // ── Setters de perfil ─────────────────────────────────────────────────
    public void setProfession(String profession) {
        this.profession = profession;
    }

    public void setArea(ProfessionalArea area) {
        this.area = area;
    }

    public void setEducationLevel(EducationLevel educationLevel) {
        this.educationLevel = educationLevel;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public void setOnboardingCompletedAt(LocalDateTime onboardingCompletedAt) {
        this.onboardingCompletedAt = onboardingCompletedAt;
    }
}
