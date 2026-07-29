package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.CmcCryptoSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CmcCryptoSnapshotRepository extends JpaRepository<CmcCryptoSnapshot, Long> {

    /** Snapshot mais recente de todo o banco — usado para descobrir o último batch */
    Optional<CmcCryptoSnapshot> findTopByOrderByFetchedAtDesc();

    /** Batch de um fetch específico, na mesma ordem do ranking da CoinMarketCap */
    List<CmcCryptoSnapshot> findByFetchedAtOrderByCmcRankAsc(LocalDateTime fetchedAt);

    /**
     * Resolve uma moeda pelo termo digitado, casando por símbolo, slug OU nome
     * (case-insensitive). Ex: "btc", "BTC" e "bitcoin" resolvem o mesmo snapshot.
     * Retorna o mais recente.
     */
    @Query("""
            SELECT c FROM CmcCryptoSnapshot c
            WHERE LOWER(c.symbol) = :term
               OR LOWER(c.slug)   = :term
               OR LOWER(c.name)   = :term
            ORDER BY c.fetchedAt DESC
            LIMIT 1
            """)
    Optional<CmcCryptoSnapshot> findLatestByTerm(@Param("term") String term);

    /**
     * Apaga snapshots anteriores ao corte, num único statement.
     * Ver a justificativa em {@code CryptoSnapshotRepository#deleteOlderThan}.
     *
     * @return quantas linhas foram removidas
     */
    @Modifying
    @Query("DELETE FROM CmcCryptoSnapshot c WHERE c.fetchedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}