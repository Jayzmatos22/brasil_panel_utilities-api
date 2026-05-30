package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.alphaVantage.GlobalQuoteWrapper;
import com.brasilpanel.backend.dto.api.alphaVantage.StockQuoteDTO;
import com.brasilpanel.backend.service.api.alphaVantage.AlphaVantageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("/api/quote")
@RestController
public class AlphaVantageController {
    private final AlphaVantageService alphaVantageService;

    @Operation(summary = "Cotação de ação", description = "Retorna a cotação atual de uma ação pelo símbolo. Ex: PETR4.SA, VALE3.SA")
    @ApiResponse(responseCode = "200", description = "Cotação retornada com sucesso")
    @ApiResponse(responseCode = "404", description = "Ação não encontrada")
    @ApiResponse(responseCode = "429", description = "Limite de requisições da AlphaVantage atingido")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API")
    @GetMapping("/{symbol}")
    public ResponseEntity<StockQuoteDTO> getQuote(
            @PathVariable String symbol) {
        return ResponseEntity.ok(alphaVantageService.getStockQuote(symbol));
    }
}
