package com.brasilpanel.backend.service.financial;

import com.brasilpanel.backend.dto.api.alphaVantage.StockQuoteDTO;
import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.model.CryptoSnapshot;
import com.brasilpanel.backend.model.MetalSnapshot;
import com.brasilpanel.backend.model.StockSnapshot;
import com.brasilpanel.backend.repository.snapshot.CryptoSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.MetalSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.StockSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Persiste snapshots de ações, metais e criptomoedas.
 * Todas as operações são fail-safe: erros de persistência não afetam a resposta ao usuário.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {

    private static final DateTimeFormatter ALPHA_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final StockSnapshotRepository stockRepository;
    private final MetalSnapshotRepository metalRepository;
    private final CryptoSnapshotRepository cryptoRepository;

    // ── Ações ─────────────────────────────────────────────────────────────

    /**
     * Persiste cotação de uma ação retornada pelo Alpha Vantage.
     * Idempotente: ignora se já existe um snapshot para símbolo + pregão.
     */
    @Transactional
    public void saveStock(StockQuoteDTO dto) {
        try {
            LocalDate tradingDay = LocalDate.parse(dto.latestTradingDay(), ALPHA_DATE);

            if (stockRepository.existsBySymbolAndTradingDay(dto.symbol(), tradingDay)) {
                log.debug("Stock snapshot já existe: {} {}", dto.symbol(), tradingDay);
                return;
            }

            StockSnapshot snapshot = StockSnapshot.builder()
                    .symbol(dto.symbol())
                    .tradingDay(tradingDay)
                    .open(toBD(dto.open()))
                    .high(toBD(dto.high()))
                    .low(toBD(dto.low()))
                    .price(toBD(dto.price()))
                    .previousClose(toBD(dto.previousClose()))
                    .change(toBD(dto.change()))
                    .changePercent(parsePercent(dto.changePercent()))
                    .volume(dto.volume())
                    .build();

            stockRepository.save(snapshot);
            log.debug("Stock snapshot salvo: {} pregão={}", dto.symbol(), tradingDay);

        } catch (Exception e) {
            log.warn("Falha ao persistir stock snapshot {}: {}", dto.symbol(), e.getMessage());
        }
    }

    // ── Metais ────────────────────────────────────────────────────────────

    /**
     * Persiste snapshot de metais retornado pelo Metals Dev.
     * Idempotente: usa o timestamp da API como chave única.
     *
     * @param dto        dados dos metais
     * @param currency   moeda dos preços (ex: "BRL", "USD")
     * @param referenceTs timestamp de referência da API
     */
    @Transactional
    public void saveMetals(MetalsDataDTO dto, String currency, Instant referenceTs) {
        try {
            if (metalRepository.existsByReferenceTs(referenceTs)) {
                log.debug("Metal snapshot já existe: {}", referenceTs);
                return;
            }

            MetalSnapshot snapshot = MetalSnapshot.builder()
                    .referenceTs(referenceTs)
                    .currency(currency)
                    .gold(toBD(dto.gold()))
                    .silver(toBD(dto.silver()))
                    .platinum(toBD(dto.platinum()))
                    .palladium(toBD(dto.palladium()))
                    .copper(toBD(dto.copper()))
                    .aluminum(toBD(dto.aluminum()))
                    .nickel(toBD(dto.nickel()))
                    .zinc(toBD(dto.zinc()))
                    .build();

            metalRepository.save(snapshot);
            log.debug("Metal snapshot salvo: ts={}", referenceTs);

        } catch (Exception e) {
            log.warn("Falha ao persistir metal snapshot: {}", e.getMessage());
        }
    }

    // ── Criptomoedas ──────────────────────────────────────────────────────

    /**
     * Persiste lista de criptomoedas retornada pelo CoinGecko.
     * Cada item da lista vira um registro separado com o mesmo fetchedAt.
     *
     * @param list     lista de moedas
     * @param currency moeda de referência dos preços (ex: "brl", "usd")
     */
    @Transactional
    public void saveCryptoList(List<CryptoCoinGeckoMarketDTO> list, String currency) {
        try {
            LocalDateTime fetchedAt = LocalDateTime.now();

            List<CryptoSnapshot> snapshots = list.stream()
                    .map(dto -> CryptoSnapshot.builder()
                            .coinId(dto.id())
                            .symbol(dto.symbol())
                            .name(dto.name())
                            .imageUrl(dto.imageUrl())
                            .currentPrice(toBD(dto.currentPrice()))
                            .marketCap(dto.marketCap() != null ? BigDecimal.valueOf(dto.marketCap()) : null)
                            .priceChange24h(toBD(dto.priceChange24h()))
                            .currency(currency)
                            .fetchedAt(fetchedAt)
                            .build())
                    .toList();

            cryptoRepository.saveAll(snapshots);
            log.debug("Crypto snapshots salvos: {} moedas, ts={}", snapshots.size(), fetchedAt);

        } catch (Exception e) {
            log.warn("Falha ao persistir crypto snapshots: {}", e.getMessage());
        }
    }

    // ── Utilitários ───────────────────────────────────────────────────────

    private BigDecimal toBD(Double value) {
        return value != null ? BigDecimal.valueOf(value) : null;
    }

    /** Converte "1.2500%" → BigDecimal(1.2500) */
    private BigDecimal parsePercent(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return new BigDecimal(raw.replace("%", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
