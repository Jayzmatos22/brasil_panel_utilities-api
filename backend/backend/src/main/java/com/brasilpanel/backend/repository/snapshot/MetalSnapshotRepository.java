package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.MetalSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface MetalSnapshotRepository extends JpaRepository<MetalSnapshot, Long> {

    /** Snapshot mais recente */
    Optional<MetalSnapshot> findTopByOrderByReferenceTsDesc();

    /** Snapshot por timestamp exato (para evitar duplicatas) */
    boolean existsByReferenceTs(Instant referenceTs);
}
