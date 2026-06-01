package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.StockSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockSnapshotRepository extends JpaRepository<StockSnapshot, Long> {

    /** Último snapshot de um ticker */
    Optional<StockSnapshot> findTopBySymbolOrderByTradingDayDesc(String symbol);

    /** Snapshot de um ticker em um pregão específico */
    Optional<StockSnapshot> findBySymbolAndTradingDay(String symbol, LocalDate tradingDay);

    /** Histórico de um ticker, do mais recente ao mais antigo */
    List<StockSnapshot> findBySymbolOrderByTradingDayDesc(String symbol);

    boolean existsBySymbolAndTradingDay(String symbol, LocalDate tradingDay);
}
