package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.CryptoSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CryptoSnapshotRepository extends JpaRepository<CryptoSnapshot, Long> {

    /** Snapshots mais recentes de todas as moedas (último batch) */
    List<CryptoSnapshot> findByFetchedAtOrderByCoinIdAsc(LocalDateTime fetchedAt);

    /** Último snapshot de uma moeda específica */
    CryptoSnapshot findTopByCoinIdOrderByFetchedAtDesc(String coinId);

    /** Histórico de uma moeda, do mais recente ao mais antigo */
    List<CryptoSnapshot> findByCoinIdOrderByFetchedAtDesc(String coinId);
}
