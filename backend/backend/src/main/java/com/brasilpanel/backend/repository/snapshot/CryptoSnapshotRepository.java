package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.CryptoSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CryptoSnapshotRepository extends JpaRepository<CryptoSnapshot, Long> {

    /** Snapshots mais recentes de todas as moedas (último batch) */
    List<CryptoSnapshot> findByFetchedAtOrderByCoinIdAsc(LocalDateTime fetchedAt);

    /** Snapshot mais recente de todo o banco — usado para descobrir o último batch */
    Optional<CryptoSnapshot> findTopByOrderByFetchedAtDesc();

    /** Batch de um fetch específico, ordenado por market cap desc (como a API do CoinGecko) */
    List<CryptoSnapshot> findByFetchedAtOrderByMarketCapDesc(LocalDateTime fetchedAt);

    /** Último snapshot de uma moeda específica */
    CryptoSnapshot findTopByCoinIdOrderByFetchedAtDesc(String coinId);

    /** Histórico de uma moeda, do mais recente ao mais antigo */
    List<CryptoSnapshot> findByCoinIdOrderByFetchedAtDesc(String coinId);

    /**
     * Resolve uma moeda pelo termo digitado, casando por coinId, símbolo OU nome
     * (case-insensitive). Ex: "usdc", "USDC" e "usd-coin" resolvem o mesmo snapshot.
     * Retorna o mais recente.
     */
    @Query("""
            SELECT c FROM CryptoSnapshot c
            WHERE LOWER(c.coinId) = :term
               OR LOWER(c.symbol) = :term
               OR LOWER(c.name)   = :term
            ORDER BY c.fetchedAt DESC
            LIMIT 1
            """)
    Optional<CryptoSnapshot> findLatestByTerm(@Param("term") String term);
}
