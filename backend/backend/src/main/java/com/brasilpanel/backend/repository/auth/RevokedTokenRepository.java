package com.brasilpanel.backend.repository.auth;

import com.brasilpanel.backend.model.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {

    /**
     * Remove o que já expirou por conta própria.
     *
     * <p>Depois do {@code exp} a linha não muda mais nada: a validação de validade
     * já recusa o token. Manter a tabela só com o intervalo de um dia de logouts.
     */
    @Modifying
    @Query("delete from RevokedToken r where r.expiresAt < :limite")
    int deleteExpiradosAntesDe(@Param("limite") LocalDateTime limite);
}
