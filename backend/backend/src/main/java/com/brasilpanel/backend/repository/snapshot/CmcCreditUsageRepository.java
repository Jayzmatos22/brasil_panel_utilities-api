package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.CmcCreditUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CmcCreditUsageRepository extends JpaRepository<CmcCreditUsage, Long> {

    Optional<CmcCreditUsage> findByYearMonth(String yearMonth);

    /**
     * Incremento atômico no banco. Ler-somar-gravar em Java perderia contagem quando
     * o scheduler e uma busca de usuário caem no mesmo instante — e créditos perdidos
     * de vista são exatamente o que estoura a cota.
     *
     * @return quantas linhas foram atualizadas (0 = mês ainda não existe)
     */
    @Modifying
    @Query("""
            UPDATE CmcCreditUsage c
               SET c.creditsUsed = c.creditsUsed + :credits,
                   c.updatedAt   = CURRENT_TIMESTAMP
             WHERE c.yearMonth = :yearMonth
            """)
    int addCredits(@Param("yearMonth") String yearMonth, @Param("credits") int credits);
}