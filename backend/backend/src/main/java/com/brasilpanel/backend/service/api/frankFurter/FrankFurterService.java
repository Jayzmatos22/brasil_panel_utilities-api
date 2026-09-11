package com.brasilpanel.backend.service.api.frankFurter;

import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryItemDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryRawDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterRateDTO;
import com.brasilpanel.backend.exception.customized.FrankfurterNotFoundException;
import com.brasilpanel.backend.exception.customized.FrankfurterRateException;
import com.brasilpanel.backend.validators.api.FrankfurterValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FrankFurterService {
    private final RestClient restClient;
    private final FrankfurterValidator frankfurterValidator;

    /**
     * Lista as moedas suportadas pela fonte (Frankfurter / taxas de referência do BCE).
     * Retorna um mapa código → nome (ex: {"USD":"United States Dollar"}).
     * O front usa essa lista para montar o select e nunca oferecer moeda que dá 404.
     */
    @Cacheable("frank-furter-currencies")
    public Map<String, String> returnSupportedCurrencies() {
        try {
            Map<String, String> data = restClient.get()
                    .uri("https://api.frankfurter.dev/v1/currencies")
                    .header("Accept", "application/json")
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, String>>() {});
            if (data == null || data.isEmpty()) {
                throw new FrankfurterRateException("Lista de moedas indisponível", 502);
            }
            return data;
        } catch (FrankfurterRateException e) {
            throw e;
        } catch (Exception e) {
            // O detalhe fica no log do servidor; o cliente recebe mensagem genérica:
            // e.getMessage() de uma falha de transporte traz a URL da fonte, e de um
            // 5xx traz o corpo de erro dela.
            log.error("Falha ao buscar as moedas suportadas na Frankfurter", e);
            throw new FrankfurterRateException("Não foi possível obter a lista de moedas.", 502);
        }
    }

    @Cacheable("frank-furter")
    public FrankfurterRateDTO returnFrankFurterRate(String from, String to, double amount){
        // Valida ANTES de montar qualquer coisa. A ordem estava invertida: a URL era
        // construída com os valores crus e só depois o validador rodava.
        frankfurterValidator.validSearchFrankfurter(from, to, amount);
        String origem = from.toUpperCase(Locale.ROOT);
        String destino = to.toUpperCase(Locale.ROOT);
        try {
            FrankfurterRateDTO data = restClient.get()
                    // Template com variáveis em vez de concatenação: o RestClient
                    // codifica cada uma, então nada do que o usuário mandar consegue
                    // abrir um parâmetro novo na query da fonte.
                    .uri("https://api.frankfurter.dev/v1/latest?from={from}&to={to}&amount={amount}",
                         origem, destino, amount)
                    .header("Accept", "application/json")
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .onStatus(status -> status.value() == 404,
                            (request, response) -> {
                                throw new FrankfurterRateException("Moeda não suportada pela fonte de câmbio: " + origem + " ou " + destino, 400);
                            })

                    .body(FrankfurterRateDTO.class);
            if (data == null){
                throw new FrankfurterRateException("Dados da API vazios.", 502);
            }
            return data;
        } catch (FrankfurterRateException e){
            throw e;
        } catch (Exception e){
            // O detalhe fica no log do servidor; o cliente recebe mensagem genérica:
            // e.getMessage() de uma falha de transporte traz a URL da fonte, e de um
            // 5xx traz o corpo de erro dela.
            log.error("Falha ao buscar o câmbio {} para {} na Frankfurter", origem, destino, e);
            throw new FrankfurterRateException("Não foi possível obter a cotação.", 502);
        }
    }


    @Cacheable("frank-furter-history")
    public FrankfurterHistoryDTO returnRateHistory(String from, String to, String startDate, String endDate){
        // O par de moedas NÃO era validado aqui — só as datas. from e to iam crus e de
        // tamanho livre para a query da fonte; era o buraco maior das quatro rotas.
        frankfurterValidator.validCurrencyPair(from, to);
        frankfurterValidator.validDateRange(startDate, endDate);

        String origem = from.toUpperCase(Locale.ROOT);
        String destino = to.toUpperCase(Locale.ROOT);
        try {
            FrankfurterHistoryRawDTO raw = restClient.get()
                    .uri("https://api.frankfurter.dev/v1/{inicio}..{fim}?from={from}&to={to}",
                         startDate, endDate, origem, destino)
                    .retrieve()
                    .onStatus(status -> status.value() == 404,
                            (req, res) -> {
                                throw new FrankfurterRateException("Moeda não suportada pela fonte de câmbio ou data inválida: " + origem + " → " + destino, 400);
                            })
                    .body(FrankfurterHistoryRawDTO.class);

            if (raw == null){
                throw new FrankfurterRateException("Dados cambiais vazios: " + origem, 502);
            }

            List<FrankfurterHistoryItemDTO> data = raw.rates().entrySet().stream()
                    .map(e -> new FrankfurterHistoryItemDTO(e.getKey(), e.getValue().get(destino)
                    ))
                    .sorted(Comparator.comparing(FrankfurterHistoryItemDTO::date))
                    .toList();

            return new FrankfurterHistoryDTO(origem, destino, data);

        } catch (FrankfurterRateException e) {
            throw e;
        } catch (Exception e) {
            // O detalhe fica no log do servidor; o cliente recebe mensagem genérica:
            // e.getMessage() de uma falha de transporte traz a URL da fonte, e de um
            // 5xx traz o corpo de erro dela.
            log.error("Falha ao buscar o histórico de câmbio na Frankfurter", e);
            throw new FrankfurterRateException("Não foi possível obter o histórico de câmbio.", 502);
        }
    }


    @Cacheable("frank-furter-last-30-days")
    public FrankfurterHistoryDTO returnLast30Days(String from, String to) {
        String endDate = LocalDate.now().toString();
        String startDate = LocalDate.now().minusDays(30).toString();
        return returnRateHistory(from, to, startDate, endDate);
    }

}
