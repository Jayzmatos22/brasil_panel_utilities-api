package com.brasilpanel.backend.service.api.frankFurter;

import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryItemDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryRawDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterRateDTO;
import com.brasilpanel.backend.exception.customized.FrankfurterNotFoundException;
import com.brasilpanel.backend.exception.customized.FrankfurterRateException;
import com.brasilpanel.backend.validators.api.FrankfurterValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FrankFurterService {
    private final RestClient restClient;
    private final FrankfurterValidator frankfurterValidator;

    @Cacheable("frank-furter")
    public FrankfurterRateDTO returnFrankFurterRate(String from, String to, double amount){
        String url = "https://api.frankfurter.dev/v1/latest?from=" + from + "&to=" + to + "&amount=" + amount;
        frankfurterValidator.validSearchFrankfurter(from, to, amount);
        try {
            FrankfurterRateDTO data = restClient.get()
                    .uri(url)
                    .header("Accept", "application/json")
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .onStatus(status -> status.value() == 404,
                            (request, response) -> {
                                throw new FrankfurterRateException("Moeda inválida: " + from + " ou " + to, 400);
                            })

                    .body(FrankfurterRateDTO.class);
            if (data == null){
                throw new FrankfurterRateException("Dados da API vazios.", 502);
            }
            return data;
        } catch (FrankfurterRateException e){
            throw e;
        } catch (Exception e){
            throw new FrankfurterRateException("Erro ao buscar câmbio de moedas " + e.getMessage(), 502);
        }
    }


    @Cacheable("frank-furter-history")
    public FrankfurterHistoryDTO returnRateHistory(String from, String to, String startDate, String endDate){
        String url = "https://api.frankfurter.dev/v1/" + startDate + ".." + endDate + "?from=" + from + "&to=" + to;
        try {
            frankfurterValidator.validDateRange(startDate, endDate);
            FrankfurterHistoryRawDTO raw = restClient.get()
                    .uri(url)
                    .retrieve()
                    .onStatus(status -> status.value() == 404,
                            (req, res) -> {
                                throw new FrankfurterRateException("Moeda ou data inválida: " + from + " → " + to, 400);
                            })
                    .body(FrankfurterHistoryRawDTO.class);

            if (raw == null){
                throw new FrankfurterRateException("Dados cambiais vazios: " + from, 502);
            }

            List<FrankfurterHistoryItemDTO> data = raw.rates().entrySet().stream()
                    .map(e -> new FrankfurterHistoryItemDTO(e.getKey(), e.getValue().get(to)
                    ))
                    .sorted(Comparator.comparing(FrankfurterHistoryItemDTO::date))
                    .toList();

            return new FrankfurterHistoryDTO(from, to, data);

        } catch (FrankfurterRateException e) {
            throw e;
        } catch (Exception e) {
            throw new FrankfurterRateException("Erro ao buscar histórico : " + e.getMessage(), 502);
        }
    }


    @Cacheable("frank-furter-last-30-days")
    public FrankfurterHistoryDTO returnLast30Days(String from, String to) {
        String endDate = LocalDate.now().toString();
        String startDate = LocalDate.now().minusDays(30).toString();
        return returnRateHistory(from, to, startDate, endDate);
    }

}
