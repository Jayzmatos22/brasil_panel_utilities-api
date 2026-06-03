package com.brasilpanel.backend.service.api.worlBank;

import com.brasilpanel.backend.dto.api.worldbank.PibBrasilDTO;
import com.brasilpanel.backend.exception.customized.WorldBankException;
import com.brasilpanel.backend.model.PibSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.brasilpanel.backend.validators.api.WorldBankValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Serve o PIB do Brasil (World Bank, NY.GDP.MKTP.CN — moeda local, R$) priorizando o banco local.
 * DB-first: cache → PibSnapshot → API externa (fallback + persiste).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorldBankService {
    private final RestClient restClient;
    private final WorldBankValidator worldBankValidator;
    private final SnapshotService snapshotService;
    private static final String SOURCE = "WORLD_BANK";
    private static final String DATE = "date";
    private static final String VALUE = "value";
    // NY.GDP.MKTP.CN = PIB a preços correntes em moeda local (R$).
    private static final String INDICATOR = "NY.GDP.MKTP.CN";
    private static final String CURRENCY = "BRL";
    // Quantos anos buscar na série histórica (1 requisição via mrv).
    private static final int SERIES_YEARS = 35;

    // PIB atual: World Bank publica revisões anuais — 24h garante frescor sem
    // sobrecarregar a API para dado que muda uma vez por ano.
    @Cacheable("worldbank-pib-current")
    public PibBrasilDTO getCurrentPib() {
        return snapshotService.getLatestPib()
                .filter(s -> CURRENCY.equals(s.getCurrency())) // snapshot em moeda antiga → re-busca em R$
                .map(this::toDTO)
                .orElseGet(this::refreshCurrentPib);
    }

    // PIB histórico: dado de anos passados nunca muda. Ano corrente pode ser
    // revisado, mas 24h é conservador e suficientemente preciso.
    @Cacheable(value = "worldbank-pib-year", key = "#year")
    public PibBrasilDTO getPibByYear(int year) {
        worldBankValidator.validYear(year);
        return snapshotService.getPibByYear(year)
                .filter(s -> CURRENCY.equals(s.getCurrency())) // snapshot em moeda antiga → re-busca em R$
                .map(this::toDTO)
                .orElseGet(() -> fetchAndPersist(
                        "https://api.worldbank.org/v2/country/BR/indicator/" + INDICATOR + "?format=json&date=" + year));
    }

    // Série histórica do PIB para o gráfico. DB-first: se já há série suficiente no
    // banco, serve do banco; senão busca os últimos SERIES_YEARS anos em 1 requisição.
    @Cacheable("worldbank-pib-series")
    public List<PibBrasilDTO> getPibSeries() {
        List<PibSnapshot> stored = snapshotService.getPibSeries(CURRENCY);
        if (stored.size() >= 10) {
            return stored.stream().map(this::toDTO).toList();
        }
        return refreshPibSeries();
    }

    /** Busca a série histórica do PIB na API (1 requisição via mrv), persiste cada ano e devolve. */
    public List<PibBrasilDTO> refreshPibSeries() {
        List<PibBrasilDTO> series = fetchPibSeries(
                "https://api.worldbank.org/v2/country/BR/indicator/" + INDICATOR + "?format=json&mrv=" + SERIES_YEARS);
        for (PibBrasilDTO dto : series) {
            try {
                snapshotService.savePib(Integer.parseInt(dto.year()), dto.value(), dto.currency());
            } catch (NumberFormatException e) {
                log.warn("Ano do PIB não numérico, não persistido: {}", dto.year());
            }
        }
        return series;
    }

    /**
     * Busca o PIB mais recente na API e persiste (upsert por ano), ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco — anos anteriores nunca mudam,
     * só o ano corrente pode ser revisado.
     */
    public PibBrasilDTO refreshCurrentPib() {
        return fetchAndPersist(
                "https://api.worldbank.org/v2/country/BR/indicator/" + INDICATOR + "?format=json&mrv=1");
    }

    /** Busca na API do World Bank, persiste o snapshot e devolve o DTO. */
    private PibBrasilDTO fetchAndPersist(String url) {
        PibBrasilDTO dto = fetchPib(url);
        try {
            snapshotService.savePib(Integer.parseInt(dto.year()), dto.value(), dto.currency());
        } catch (NumberFormatException e) {
            log.warn("Ano do PIB não numérico, não persistido: {}", dto.year());
        }
        return dto;
    }

    private PibBrasilDTO fetchPib(String url) {
        List<Object> response = restClient.get()
                .uri(url)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Object>>() {});

        List<Map<String, Object>> data = (List<Map<String, Object>>) response.get(1);

        if (data == null || data.isEmpty()) {
            throw new WorldBankException("Dados do PIB indisponíveis", 502);
        }

        Map<String, Object> entry = data.getFirst();
        if (entry.get(VALUE) == null) {
            throw new WorldBankException("Dados do PIB não disponíveis para o ano: " + entry.get(DATE), 404);
        }

        return new PibBrasilDTO(
                (String) entry.get(DATE),
                ((Number) entry.get(VALUE)).doubleValue(),
                CURRENCY
        );
    }

    /** Busca a série completa na API do World Bank, ignora anos sem valor e devolve em ordem cronológica. */
    private List<PibBrasilDTO> fetchPibSeries(String url) {
        List<Object> response = restClient.get()
                .uri(url)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Object>>() {});

        List<Map<String, Object>> data = (List<Map<String, Object>>) response.get(1);

        if (data == null || data.isEmpty()) {
            throw new WorldBankException("Dados do PIB indisponíveis", 502);
        }

        List<PibBrasilDTO> series = new ArrayList<>(data.size());
        for (Map<String, Object> entry : data) {
            if (entry.get(VALUE) == null) continue; // ano sem dado publicado
            series.add(new PibBrasilDTO(
                    (String) entry.get(DATE),
                    ((Number) entry.get(VALUE)).doubleValue(),
                    CURRENCY));
        }
        series.sort(Comparator.comparing(PibBrasilDTO::year));
        return series;
    }

    private PibBrasilDTO toDTO(PibSnapshot snapshot) {
        return new PibBrasilDTO(
                String.valueOf(snapshot.getYear()),
                snapshot.getValue().doubleValue(),
                snapshot.getCurrency() != null ? snapshot.getCurrency() : CURRENCY
        );
    }
}
