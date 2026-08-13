package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Perfil profissional e acadêmico do usuário (1:1 com {@link UserEntity}).
 *
 * <p>Substitui o antigo par endereço + dados bancários do onboarding. Todos os
 * campos são opcionais: o usuário pode pular o onboarding e completar depois nas
 * configurações — daí as colunas de referência serem anuláveis.
 *
 * <p>O vínculo com o usuário é a coluna {@code user_id} (FK com {@code ON DELETE
 * CASCADE} no banco: apagar a conta remove o perfil). Não há {@code @OneToOne}
 * JPA para manter {@link UserEntity} intocada.
 */
@Entity
@Table(name = "user_profiles",
       uniqueConstraints = @UniqueConstraint(name = "uk_user_profile_user", columnNames = "user_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** FK para {@code users.id}. Único: um perfil por usuário. */
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    // ── Profissão ─────────────────────────────────────────────────────────
    @Column(name = "profession_area_id")
    private Long professionAreaId;

    @Column(name = "profession_subarea_id")
    private Long professionSubareaId;

    @Column(name = "profession_level_id")
    private Long professionLevelId;

    /** Cargo/título livre — ex: "Analista de dados". Opcional. */
    @Column(name = "profession_title", length = 120)
    private String professionTitle;

    // ── Educação ──────────────────────────────────────────────────────────
    @Column(name = "education_area_id")
    private Long educationAreaId;

    @Column(name = "education_subarea_id")
    private Long educationSubareaId;

    @Column(name = "education_level_id")
    private Long educationLevelId;

    /** Instituição de ensino — ex: "UFBA". Opcional. */
    @Column(name = "institution", length = 120)
    private String institution;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
