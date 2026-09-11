package com.brasilpanel.backend.repository.user;

import com.brasilpanel.backend.model.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmail(String email);

    /** Para o painel de admin filtrar por situação da conta. */
    Page<UserEntity> findByVerified(boolean verified, Pageable pageable);

    /**
     * Apaga cadastros que nunca foram verificados e já passaram do prazo.
     *
     * <p>Consulta em lote, e não {@code deleteBy...} derivado: o derivado carrega
     * cada entidade para apagar uma a uma. As tabelas dependentes
     * ({@code user_profile}, {@code auth_challenge}) têm {@code on delete cascade}
     * no banco, então uma instrução só resolve tudo.
     */
    @Modifying
    @Query("delete from UserEntity u where u.verified = false and u.createdAt < :limite")
    int deleteNaoVerificadosCriadosAntesDe(@Param("limite") LocalDateTime limite);
}
