package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.PibSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PibSnapshotRepository extends JpaRepository<PibSnapshot, Long> {

    /** Snapshot do ano mais recente (para o PIB atual) */
    Optional<PibSnapshot> findTopByOrderByYearDesc();

    /** Snapshot de um ano específico */
    Optional<PibSnapshot> findByYear(Integer year);

    /** Série completa de uma moeda, em ordem cronológica (para o gráfico). */
    List<PibSnapshot> findByCurrencyOrderByYearAsc(String currency);
}
