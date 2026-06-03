package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.PibEstadualSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PibEstadualSnapshotRepository extends JpaRepository<PibEstadualSnapshot, Long> {

    /** Ano mais recente disponível no banco. */
    Optional<PibEstadualSnapshot> findTopByOrderByYearDesc();

    /** Todas as UFs de um ano, ordenadas pelo maior PIB. */
    List<PibEstadualSnapshot> findByYearOrderByValueDesc(Integer year);

    /** Upsert por (ano, UF). */
    Optional<PibEstadualSnapshot> findByYearAndUfCode(Integer year, Integer ufCode);
}