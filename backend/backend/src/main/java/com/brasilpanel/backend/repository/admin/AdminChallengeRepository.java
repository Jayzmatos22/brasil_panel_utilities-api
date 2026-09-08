package com.brasilpanel.backend.repository.admin;

import com.brasilpanel.backend.model.AdminChallenge;
import com.brasilpanel.backend.model.AdminChallengePurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminChallengeRepository extends JpaRepository<AdminChallenge, UUID> {

    /**
     * O desafio vigente do usuário para esta finalidade — o mais recente ainda não
     * consumido. Ordenar por data importa: emitir um desafio novo invalida o anterior
     * (ver {@code AdminTwoFactorService}), e sem a ordenação a conferência poderia cair
     * num desafio velho que ainda não expirou.
     */
    Optional<AdminChallenge> findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            UUID userId, AdminChallengePurpose purpose);

    /**
     * Consome os desafios abertos da finalidade. Chamado antes de emitir um novo: dois
     * códigos válidos ao mesmo tempo dobram a superfície de acerto e confundem quem
     * recebeu dois e-mails.
     */
    @Modifying
    @Query("""
            UPDATE AdminChallenge c
               SET c.consumedAt = :agora
             WHERE c.userId = :userId
               AND c.purpose = :purpose
               AND c.consumedAt IS NULL
            """)
    int invalidateOpen(@Param("userId") UUID userId,
                       @Param("purpose") AdminChallengePurpose purpose,
                       @Param("agora") LocalDateTime agora);

    // Sem faxina agendada de propósito: um desafio nasce só em login ou troca de
    // senha de admin — algumas linhas por semana. Um scheduler para isso seria código
    // sem uso real, e código sem uso é código sem teste.
}
