package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.LbmaFixingSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface LbmaFixingRepository extends JpaRepository<LbmaFixingSnapshot, Long> {

    /** Fixing mais recente (para leitura DB-first). */
    Optional<LbmaFixingSnapshot> findTopByOrderByReferenceTsDesc();

    /** Fixing por timestamp exato (para evitar duplicatas). */
    boolean existsByReferenceTs(Instant referenceTs);
}