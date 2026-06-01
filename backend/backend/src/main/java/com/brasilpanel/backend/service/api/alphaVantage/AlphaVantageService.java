package com.brasilpanel.backend.service.api.alphaVantage;

import com.brasilpanel.backend.dto.api.alphaVantage.GlobalQuoteWrapper;
import com.brasilpanel.backend.dto.api.alphaVantage.StockQuoteDTO;
import com.brasilpanel.backend.exception.customized.AlphaVantageException;
import com.brasilpanel.backend.model.StockSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;


@Slf4j
@Service
@RequiredArgsConstructor
public class AlphaVantageService {
    private final RestClient restClient;
    private final ObjectMapper mapper;
    private final SnapshotService snapshotService;

    @Value("${alpha-vantage.keys}")
    private List<String> apiKeys;

    private static final DateTimeFormatter ALPHA_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Janela de frescor do DB-first de ações. Ações não têm scheduler e o free tier
    // do Alpha Vantage tem limite diário (~25 req/dia), então só re-buscamos um símbolo
    // na API após esta janela; entre uma busca e outra, servimos do banco.
    private static final Duration STOCK_FRESHNESS = Duration.ofHours(4);

    private final AtomicInteger currentIndex = new AtomicInteger(0);

    private String getNextApiKey() {
        int index = currentIndex.getAndUpdate(i -> (i + 1) % apiKeys.size());
        return apiKeys.get(index);
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() <= 8) return "****";
        return apiKey.substring(0, 4) + "********" + apiKey.substring(apiKey.length() - 4);
    }


    @Cacheable(value = "stocks", key = "#symbol")
    public StockQuoteDTO getStockQuote(String symbol) {
        String sym = symbol.trim().toUpperCase();

        // DB-first: serve do banco se o snapshot for recente (dentro da janela de frescor)
        Optional<StockSnapshot> latest = snapshotService.getLatestStock(sym);
        if (latest.isPresent() && isFresh(latest.get())) {
            return toDTO(latest.get());
        }

        String apiKey = getNextApiKey();
        String url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="
                + sym
                + "&apikey=" + apiKey;

        log.info("Buscando cotação | símbolo: {} | chave: {}", sym, maskApiKey(apiKey));

        try {
            String response = restClient.get()
                    .uri(url)
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0")
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(String.class);

            JsonNode root = mapper.readTree(response);

            // Limite diário atingido
            if (root.has("Information") || root.has("Note")) {
                String message = root.has("Information")
                        ? root.get("Information").asText()
                        : root.get("Note").asText();
                log.warn("Limite AlphaVantage atingido: {}", message);
                throw new AlphaVantageException("Limite de requisições atingido na AlphaVantage", 429);
            }

            // Símbolo inválido
            if (root.has("Error Message")) {
                log.warn("Símbolo inválido: {}", symbol);
                throw new AlphaVantageException("Ação não encontrada: " + symbol, 404);
            }

            JsonNode quoteNode = root.get("Global Quote");
            if (quoteNode == null || quoteNode.isEmpty()) {
                throw new AlphaVantageException("Nenhuma cotação encontrada para: " + symbol, 404);
            }

            StockQuoteDTO stockQuote = mapper.treeToValue(quoteNode, StockQuoteDTO.class);
            if (stockQuote.symbol() == null || stockQuote.symbol().isBlank()) {
                throw new AlphaVantageException("Cotação inválida para: " + symbol, 404);
            }

            log.info("Cotação obtida: {}", stockQuote.symbol());
            snapshotService.saveStock(stockQuote);
            return stockQuote;

        } catch (AlphaVantageException e) {
            // Fallback: API indisponível ou limite estourado → serve o último snapshot do banco
            if (latest.isPresent()) {
                log.warn("AlphaVantage falhou ({}); servindo último snapshot do banco para {}", e.getMessage(), sym);
                return toDTO(latest.get());
            }
            throw e;
        } catch (Exception e) {
            log.error("Erro na comunicação com AlphaVantage usando {}", maskApiKey(apiKey), e);
            if (latest.isPresent()) {
                log.warn("Servindo último snapshot do banco para {} após erro de comunicação", sym);
                return toDTO(latest.get());
            }
            throw new AlphaVantageException("Erro na comunicação com AlphaVantage", 502);
        }
    }

    // ── Frescor e reconstrução DB → DTO ────────────────────────────────────

    private boolean isFresh(StockSnapshot s) {
        return s.getFetchedAt() != null
                && s.getFetchedAt().isAfter(LocalDateTime.now().minus(STOCK_FRESHNESS));
    }

    private StockQuoteDTO toDTO(StockSnapshot s) {
        return new StockQuoteDTO(
                s.getSymbol(),
                bd(s.getOpen()),
                bd(s.getHigh()),
                bd(s.getLow()),
                bd(s.getPrice()),
                s.getVolume(),
                s.getTradingDay().format(ALPHA_DATE),
                bd(s.getPreviousClose()),
                bd(s.getChange()),
                s.getChangePercent() != null ? s.getChangePercent().toPlainString() + "%" : null
        );
    }

    private static Double bd(BigDecimal v) {
        return v != null ? v.doubleValue() : null;
    }
}