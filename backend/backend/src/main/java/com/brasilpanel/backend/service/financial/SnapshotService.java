package com.brasilpanel.backend.service.financial;

import com.brasilpanel.backend.dto.api.alphaVantage.StockHistoryPointDTO;
import com.brasilpanel.backend.dto.api.alphaVantage.StockQuoteDTO;
import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.dto.api.metalsDev.LbmaFixingDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalHistoryPointDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.model.CryptoSnapshot;
import com.brasilpanel.backend.model.LbmaFixingSnapshot;
import com.brasilpanel.backend.model.MetalHistorySnapshot;
import com.brasilpanel.backend.model.MetalSnapshot;
import com.brasilpanel.backend.model.PibEstadualSnapshot;
import com.brasilpanel.backend.model.PibSnapshot;
import com.brasilpanel.backend.model.StockSnapshot;
import com.brasilpanel.backend.repository.snapshot.CryptoSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.LbmaFixingRepository;
import com.brasilpanel.backend.repository.snapshot.MetalHistoryRepository;
import com.brasilpanel.backend.repository.snapshot.MetalSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.PibEstadualSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.PibSnapshotRepository;
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
import java.util.Optional;

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
    private final MetalHistoryRepository metalHistoryRepository;
    private final LbmaFixingRepository lbmaFixingRepository;
    private final CryptoSnapshotRepository cryptoRepository;
    private final PibSnapshotRepository pibRepository;
    private final PibEstadualSnapshotRepository pibEstadualRepository;

    // ── Ações ─────────────────────────────────────────────────────────────

    /**
     * Persiste (upsert) cotação de uma ação retornada pelo Alpha Vantage.
     * Se já existe snapshot do mesmo símbolo + pregão, atualiza os valores intraday
     * e o fetchedAt — necessário para o controle de frescor do DB-first de ações.
     */
    @Transactional
    public void saveStock(StockQuoteDTO dto) {
        try {
            LocalDate tradingDay = LocalDate.parse(dto.latestTradingDay(), ALPHA_DATE);

            Long existingId = stockRepository.findBySymbolAndTradingDay(dto.symbol(), tradingDay)
                    .map(StockSnapshot::getId)
                    .orElse(null);

            StockSnapshot snapshot = StockSnapshot.builder()
                    .id(existingId)               // null → insert; preenchido → update (merge)
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
            log.debug("Stock snapshot salvo ({}): {} pregão={}",
                    existingId == null ? "insert" : "update", dto.symbol(), tradingDay);

        } catch (Exception e) {
            log.warn("Falha ao persistir stock snapshot {}: {}", dto.symbol(), e.getMessage());
        }
    }

    /** Último snapshot de uma ação (para leitura DB-first por símbolo). */
    @Transactional(readOnly = true)
    public Optional<StockSnapshot> getLatestStock(String symbol) {
        return stockRepository.findTopBySymbolOrderByTradingDayDesc(symbol);
    }

    /**
     * Persiste (upsert em lote) a série diária de uma ação (TIME_SERIES_DAILY).
     * Os pontos devem vir ordenados por data crescente — change/changePercent são
     * calculados a partir do fechamento do pregão anterior na própria série.
     */
    @Transactional
    public void saveStockHistory(String symbol, List<StockHistoryPointDTO> points) {
        try {
            var existingIds = stockRepository.findBySymbolOrderByTradingDayDesc(symbol).stream()
                    .collect(java.util.stream.Collectors.toMap(
                            StockSnapshot::getTradingDay, StockSnapshot::getId, (a, b) -> a));

            BigDecimal prevClose = null;
            List<StockSnapshot> batch = new java.util.ArrayList<>(points.size());

            for (StockHistoryPointDTO p : points) {
                LocalDate tradingDay = LocalDate.parse(p.date(), ALPHA_DATE);
                BigDecimal close = BigDecimal.valueOf(p.close());
                BigDecimal change = prevClose != null ? close.subtract(prevClose) : null;
                BigDecimal changePercent = (prevClose != null && prevClose.signum() != 0)
                        ? change.multiply(BigDecimal.valueOf(100))
                                .divide(prevClose, 4, java.math.RoundingMode.HALF_UP)
                        : null;

                batch.add(StockSnapshot.builder()
                        .id(existingIds.get(tradingDay))   // null → insert; preenchido → update
                        .symbol(symbol)
                        .tradingDay(tradingDay)
                        .open(BigDecimal.valueOf(p.open()))
                        .high(BigDecimal.valueOf(p.high()))
                        .low(BigDecimal.valueOf(p.low()))
                        .price(close)
                        .previousClose(prevClose)
                        .change(change)
                        .changePercent(changePercent)
                        .volume(p.volume())
                        .build());

                prevClose = close;
            }

            stockRepository.saveAll(batch);
            log.debug("Stock history salvo: {} pregões de {}", batch.size(), symbol);

        } catch (Exception e) {
            log.warn("Falha ao persistir stock history {}: {}", symbol, e.getMessage());
        }
    }

    /** Série diária completa de uma ação, do mais recente ao mais antigo. */
    @Transactional(readOnly = true)
    public List<StockSnapshot> getStockSeries(String symbol) {
        return stockRepository.findBySymbolOrderByTradingDayDesc(symbol);
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

    /** Snapshot de metais mais recente salvo no banco (para leitura DB-first). */
    @Transactional(readOnly = true)
    public Optional<MetalSnapshot> getLatestMetals() {
        return metalRepository.findTopByOrderByReferenceTsDesc();
    }

    // ── Histórico de metais (Metals Dev /v1/timeseries) ─────────────────────

    /**
     * Persiste (upsert em lote) a série diária de metais.
     * Chave natural = priceDate; se o dia já existe, atualiza os valores e o fetchedAt.
     */
    @Transactional
    public void saveMetalHistory(List<MetalHistoryPointDTO> points, String currency, String unit) {
        try {
            if (points.isEmpty()) return;

            LocalDate start = LocalDate.parse(points.get(0).date(), ALPHA_DATE);
            LocalDate end = LocalDate.parse(points.get(points.size() - 1).date(), ALPHA_DATE);

            var existingIds = metalHistoryRepository
                    .findByPriceDateBetweenOrderByPriceDateAsc(start, end).stream()
                    .collect(java.util.stream.Collectors.toMap(
                            MetalHistorySnapshot::getPriceDate, MetalHistorySnapshot::getId, (a, b) -> a));

            List<MetalHistorySnapshot> batch = new java.util.ArrayList<>(points.size());
            for (MetalHistoryPointDTO p : points) {
                LocalDate day = LocalDate.parse(p.date(), ALPHA_DATE);
                batch.add(MetalHistorySnapshot.builder()
                        .id(existingIds.get(day))     // null → insert; preenchido → update
                        .priceDate(day)
                        .currency(currency)
                        .unit(unit)
                        .gold(toBD(p.gold()))
                        .silver(toBD(p.silver()))
                        .platinum(toBD(p.platinum()))
                        .palladium(toBD(p.palladium()))
                        .copper(toBD(p.copper()))
                        .aluminum(toBD(p.aluminum()))
                        .nickel(toBD(p.nickel()))
                        .zinc(toBD(p.zinc()))
                        .build());
            }

            metalHistoryRepository.saveAll(batch);
            log.debug("Metal history salvo: {} dias ({} a {})", batch.size(), start, end);

        } catch (Exception e) {
            log.warn("Falha ao persistir metal history: {}", e.getMessage());
        }
    }

    /** Série histórica de metais num intervalo, em ordem crescente de data. */
    @Transactional(readOnly = true)
    public List<MetalHistorySnapshot> getMetalHistorySeries(LocalDate start, LocalDate end) {
        return metalHistoryRepository.findByPriceDateBetweenOrderByPriceDateAsc(start, end);
    }

    /** Ponto mais recente da série histórica (para o controle de frescor do DB-first). */
    @Transactional(readOnly = true)
    public Optional<MetalHistorySnapshot> getLatestMetalHistory() {
        return metalHistoryRepository.findTopByOrderByPriceDateDesc();
    }

    // ── Fixing LBMA (Metals Dev /v1/metal/authority?authority=lbma) ─────────

    /**
     * Persiste fixing oficial LBMA. Idempotente: usa o timestamp da API como chave única,
     * então re-fetches do mesmo fixing (AM/PM) não duplicam registros.
     */
    @Transactional
    public void saveLbmaFixing(LbmaFixingDTO dto, Instant referenceTs) {
        try {
            if (lbmaFixingRepository.existsByReferenceTs(referenceTs)) {
                log.debug("Fixing LBMA já existe: {}", referenceTs);
                return;
            }

            LbmaFixingSnapshot snapshot = LbmaFixingSnapshot.builder()
                    .referenceTs(referenceTs)
                    .currency(dto.currency())
                    .goldAm(toBD(dto.goldAm()))
                    .goldPm(toBD(dto.goldPm()))
                    .silver(toBD(dto.silver()))
                    .platinumAm(toBD(dto.platinumAm()))
                    .platinumPm(toBD(dto.platinumPm()))
                    .palladiumAm(toBD(dto.palladiumAm()))
                    .palladiumPm(toBD(dto.palladiumPm()))
                    .build();

            lbmaFixingRepository.save(snapshot);
            log.debug("Fixing LBMA salvo: ts={}", referenceTs);

        } catch (Exception e) {
            log.warn("Falha ao persistir fixing LBMA: {}", e.getMessage());
        }
    }

    /** Fixing LBMA mais recente salvo no banco (para leitura DB-first). */
    @Transactional(readOnly = true)
    public Optional<LbmaFixingSnapshot> getLatestLbmaFixing() {
        return lbmaFixingRepository.findTopByOrderByReferenceTsDesc();
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

    /**
     * Último batch de criptomoedas salvo (todas as moedas do fetch mais recente),
     * ordenado por market cap desc — mesma ordem da API. Vazio se não houver snapshot.
     */
    @Transactional(readOnly = true)
    public List<CryptoSnapshot> getLatestCryptoBatch() {
        return cryptoRepository.findTopByOrderByFetchedAtDesc()
                .map(s -> cryptoRepository.findByFetchedAtOrderByMarketCapDesc(s.getFetchedAt()))
                .orElseGet(List::of);
    }

    /** Último snapshot de uma moeda específica (para leitura DB-first por nome). */
    @Transactional(readOnly = true)
    public Optional<CryptoSnapshot> getLatestCrypto(String coinId) {
        return Optional.ofNullable(cryptoRepository.findTopByCoinIdOrderByFetchedAtDesc(coinId));
    }

    // ── PIB (World Bank) ──────────────────────────────────────────────────

    /**
     * Persiste (upsert) o PIB de um ano. Se o ano já existe, atualiza valor e
     * fetchedAt — o ano corrente pode ser revisado pelo World Bank.
     */
    @Transactional
    public void savePib(int year, double value, String currency) {
        try {
            Long existingId = pibRepository.findByYear(year)
                    .map(PibSnapshot::getId)
                    .orElse(null);

            PibSnapshot snapshot = PibSnapshot.builder()
                    .id(existingId)               // null → insert; preenchido → update (merge)
                    .year(year)
                    .value(BigDecimal.valueOf(value))
                    .currency(currency)
                    .build();

            pibRepository.save(snapshot);
            log.debug("PIB snapshot salvo ({}): ano={} valor={}",
                    existingId == null ? "insert" : "update", year, value);

        } catch (Exception e) {
            log.warn("Falha ao persistir PIB snapshot do ano {}: {}", year, e.getMessage());
        }
    }

    /** PIB do ano mais recente salvo (para leitura DB-first do PIB atual). */
    @Transactional(readOnly = true)
    public Optional<PibSnapshot> getLatestPib() {
        return pibRepository.findTopByOrderByYearDesc();
    }

    /** PIB de um ano específico salvo no banco (para leitura DB-first). */
    @Transactional(readOnly = true)
    public Optional<PibSnapshot> getPibByYear(int year) {
        return pibRepository.findByYear(year);
    }

    /** Série histórica completa do PIB de uma moeda, em ordem cronológica (para o gráfico). */
    @Transactional(readOnly = true)
    public List<PibSnapshot> getPibSeries(String currency) {
        return pibRepository.findByCurrencyOrderByYearAsc(currency);
    }

    // ── PIB estadual (IBGE/SIDRA) ─────────────────────────────────────────

    /** Persiste (upsert) o PIB de uma UF num ano. */
    @Transactional
    public void savePibEstadual(int year, int ufCode, String uf, BigDecimal value) {
        try {
            Long existingId = pibEstadualRepository.findByYearAndUfCode(year, ufCode)
                    .map(PibEstadualSnapshot::getId)
                    .orElse(null);

            PibEstadualSnapshot snapshot = PibEstadualSnapshot.builder()
                    .id(existingId)               // null → insert; preenchido → update (merge)
                    .year(year)
                    .ufCode(ufCode)
                    .uf(uf)
                    .value(value)
                    .build();

            pibEstadualRepository.save(snapshot);
        } catch (Exception e) {
            log.warn("Falha ao persistir PIB estadual {}/{}: {}", year, ufCode, e.getMessage());
        }
    }

    /** Ano mais recente do PIB estadual salvo (para o controle DB-first). */
    @Transactional(readOnly = true)
    public Optional<Integer> getLatestPibEstadualYear() {
        return pibEstadualRepository.findTopByOrderByYearDesc().map(PibEstadualSnapshot::getYear);
    }

    /** PIB de todas as UFs de um ano, do maior para o menor. */
    @Transactional(readOnly = true)
    public List<PibEstadualSnapshot> getPibEstadualByYear(int year) {
        return pibEstadualRepository.findByYearOrderByValueDesc(year);
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
