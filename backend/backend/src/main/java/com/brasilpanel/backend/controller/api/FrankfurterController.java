package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryRawDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterRateDTO;
import com.brasilpanel.backend.service.api.frankFurter.FrankFurterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Câmbio (taxas de referência do BCE via Frankfurter).
 *
 * <p>{@code @Validated} na classe não é decorativo: sem ele o Spring ignora
 * {@code @Pattern} em {@code @RequestParam} — a anotação fica no código dando a impressão
 * de proteger, e nada é verificado.
 */
@Validated
@RequestMapping("/api/frankfurter")
@RestController
@RequiredArgsConstructor
public class FrankfurterController {

    /** Código ISO 4217. A mesma regra vale no serviço — ver {@code FrankfurterValidator}. */
    private static final String MOEDA_PATTERN = "^[A-Za-z]{3}$";
    private static final String MOEDA_MESSAGE = "Moeda deve ter 3 letras (ex.: USD, BRL)";

    /** Datas do histórico entram no CAMINHO da URL da fonte, não na query. */
    private static final String DATA_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";
    private static final String DATA_MESSAGE = "Data deve estar no formato YYYY-MM-DD";
    private final FrankFurterService frankFurterService;


    @Operation(summary = "Moedas suportadas", description = "Lista as moedas suportadas pela fonte de câmbio (código → nome)")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com Frankfurter")
    @GetMapping("/currencies")
    public ResponseEntity<Map<String, String>> getSupportedCurrencies() {
        return ResponseEntity.ok(frankFurterService.returnSupportedCurrencies());
    }


    @Operation(summary = "Taxa de câmbio entre moedas", description = "Retorna a taxa de câmbio atual entre duas moedas com valor convertido")
    @ApiResponse(responseCode = "200", description = "Taxa retornada com sucesso")
    @ApiResponse(responseCode = "400", description = "Moeda inválida")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com Frankfurter")
    @GetMapping
    public ResponseEntity<FrankfurterRateDTO> returnRateByCoins(
            @RequestParam @Pattern(regexp = MOEDA_PATTERN, message = MOEDA_MESSAGE) String from,
            @RequestParam @Pattern(regexp = MOEDA_PATTERN, message = MOEDA_MESSAGE) String to,
            @RequestParam @Positive(message = "Valor deve ser maior que zero") double amount) {
        return ResponseEntity.ok(frankFurterService.returnFrankFurterRate(from, to, amount));
    }


    @Operation(summary = "Histórico por período", description = "Retorna o histórico de câmbio entre duas moedas em um período definido")
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso")
    @ApiResponse(responseCode = "400", description = "Moeda ou data inválida")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com Frankfurter")
    @GetMapping("/history")
    public ResponseEntity<FrankfurterHistoryDTO> getHistory(
            @RequestParam @Pattern(regexp = MOEDA_PATTERN, message = MOEDA_MESSAGE) String from,
            @RequestParam @Pattern(regexp = MOEDA_PATTERN, message = MOEDA_MESSAGE) String to,
            @RequestParam @Pattern(regexp = DATA_PATTERN, message = DATA_MESSAGE) String startDate,
            @RequestParam @Pattern(regexp = DATA_PATTERN, message = DATA_MESSAGE) String endDate
    ) {
        return ResponseEntity.ok(frankFurterService.returnRateHistory(from, to, startDate, endDate));
    }


    @Operation(summary = "Histórico últimos 30 dias", description = "Retorna o histórico de câmbio dos últimos 30 dias entre duas moedas")
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso")
    @ApiResponse(responseCode = "400", description = "Moeda inválida")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com Frankfurter")
    @GetMapping("/last-30-days")
    public ResponseEntity<FrankfurterHistoryDTO> getLast30Days(
            @RequestParam @Pattern(regexp = MOEDA_PATTERN, message = MOEDA_MESSAGE) String from,
            @RequestParam @Pattern(regexp = MOEDA_PATTERN, message = MOEDA_MESSAGE) String to
    ) {
        return ResponseEntity.ok(frankFurterService.returnLast30Days(from, to));
    }


}
