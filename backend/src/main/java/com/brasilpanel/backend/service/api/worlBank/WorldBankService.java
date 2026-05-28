package com.brasilpanel.backend.service.api.worlBank;

import com.brasilpanel.backend.dto.api.worldbank.PibBrasilDTO;
import com.brasilpanel.backend.exception.customized.WorldBankException;
import com.brasilpanel.backend.validators.api.WorldBankValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorldBankService {
    private final RestClient restClient;
    private final WorldBankValidator worldBankValidator;
    private static final String DATE = "date";
    private static final String VALUE = "value";
    private static final String USD = "USD";

    // PIB atual: World Bank publica revisões anuais — 24h garante frescor sem
    // sobrecarregar a API para dado que muda uma vez por ano.
    @Cacheable("worldbank-pib-current")
    public PibBrasilDTO getCurrentPib() {
        return fetchPib("https://api.worldbank.org/v2/country/BR/indicator/NY.GDP.MKTP.CD?format=json&mrv=1");
    }

    // PIB histórico: dado de anos passados nunca muda. Ano corrente pode ser
    // revisado, mas 24h é conservador e suficientemente preciso.
    @Cacheable(value = "worldbank-pib-year", key = "#year")
    public PibBrasilDTO getPibByYear(int year) {
        worldBankValidator.validYear(year);
        return fetchPib("https://api.worldbank.org/v2/country/BR/indicator/NY.GDP.MKTP.CD?format=json&date=" + year);
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
                (Double) entry.get(VALUE),
                USD
        );
    }
}
