package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterHistoryRawDTO;
import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterRateDTO;
import com.brasilpanel.backend.service.api.frankFurter.FrankFurterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RequestMapping("/api/frankfurter")
@RestController
@RequiredArgsConstructor
public class FrankfurterController {
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
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam double amount) {
        return ResponseEntity.ok(frankFurterService.returnFrankFurterRate(from, to, amount));
    }


    @Operation(summary = "Histórico por período", description = "Retorna o histórico de câmbio entre duas moedas em um período definido")
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso")
    @ApiResponse(responseCode = "400", description = "Moeda ou data inválida")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com Frankfurter")
    @GetMapping("/history")
    public ResponseEntity<FrankfurterHistoryDTO> getHistory(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        return ResponseEntity.ok(frankFurterService.returnRateHistory(from, to, startDate, endDate));
    }


    @Operation(summary = "Histórico últimos 30 dias", description = "Retorna o histórico de câmbio dos últimos 30 dias entre duas moedas")
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso")
    @ApiResponse(responseCode = "400", description = "Moeda inválida")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com Frankfurter")
    @GetMapping("/last-30-days")
    public ResponseEntity<FrankfurterHistoryDTO> getLast30Days(
            @RequestParam String from,
            @RequestParam String to
    ) {
        return ResponseEntity.ok(frankFurterService.returnLast30Days(from, to));
    }


}
