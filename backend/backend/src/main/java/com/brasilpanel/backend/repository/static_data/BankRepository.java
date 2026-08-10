package com.brasilpanel.backend.repository.static_data;

import com.brasilpanel.backend.model.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BankRepository extends JpaRepository<Bank, Long> {

    Optional<Bank> findByCode(Integer code);

    Optional<Bank> findByIspb(String ispb);

    /** Sincronização mais recente — base do re-sync no startup. Vazio se a tabela estiver vazia. */
    @Query("select max(b.syncedAt) from Bank b")
    Optional<LocalDateTime> findLastSyncedAt();

    List<Bank> findAllByOrderByCodeAsc();

    List<Bank> findByNameContainingIgnoreCaseOrderByCodeAsc(String name);

    boolean existsByCode(Integer code);
}
