package com.brasilpanel.backend.repository.email;

import com.brasilpanel.backend.model.EmailOutboxEntry;
import com.brasilpanel.backend.model.EmailOutboxStatus;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutboxEntry, UUID> {

    /**
     * Lote da vez: pendentes cujo horário de tentativa já passou, mais antigas primeiro.
     *
     * <p>O {@link Limit} existe para o drain não puxar a fila inteira de uma vez depois
     * de uma indisponibilidade longa do SMTP — o lote é enviado em sequência e cada
     * envio segura a thread do scheduler.
     */
    List<EmailOutboxEntry> findByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            EmailOutboxStatus status, LocalDateTime limite, Limit lote);

    /** Quantas entradas ainda aguardam envio — usado no log do drain e em teste. */
    long countByStatus(EmailOutboxStatus status);

    /**
     * Expurgo das entradas já concluídas. As FAILED são preservadas por mais tempo
     * que as SENT em quem chama, porque são elas que se investiga depois.
     */
    @Modifying
    @Query("""
            DELETE FROM EmailOutboxEntry e
             WHERE e.status IN :status
               AND e.completedAt < :limite
            """)
    int deleteCompletedBefore(@Param("status") List<EmailOutboxStatus> status,
                              @Param("limite") LocalDateTime limite);
}
