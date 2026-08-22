package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.alphaVantage.GlobalQuoteWrapper;
import com.brasilpanel.backend.dto.api.alphaVantage.StockHistoryDTO;
import com.brasilpanel.backend.dto.api.alphaVantage.StockQuoteDTO;
import com.brasilpanel.backend.service.api.alphaVantage.AlphaVantageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("/api/quote")
@RestController
public class AlphaVantageController {

    /**
     * Formato de um ticker: letras, dígitos, ponto e hífen, até 12 caracteres.
     *
     * <p>Sem este filtro qualquer string vira uma chamada à AlphaVantage — e o free
     * tier é de ~25 requisições por DIA (ver AlphaVantageService), então 25 símbolos
     * inventados num laço esgotam a cota inteira, bem dentro do teto de 120/min do
     * rate limiter. A validação acontece antes do serviço, então entrada inválida
     * custa 400 e nenhuma requisição externa.
     */
    private static final String SYMBOL_PATTERN = "^[A-Za-z0-9.-]{1,12}$";
    private static final String SYMBOL_MESSAGE =
            "Símbolo inválido — use letras, números, ponto ou hífen (até 12 caracteres)";

    private final AlphaVantageService alphaVantageService;

    @Operation(summary = "Cotação de ação", description = "Retorna a cotação atual de uma ação pelo símbolo. Ex: PETR4.SA, VALE3.SA")
    @ApiResponse(responseCode = "200", description = "Cotação retornada com sucesso")
    @ApiResponse(responseCode = "400", description = "Símbolo com formato inválido")
    @ApiResponse(responseCode = "404", description = "Ação não encontrada")
    @ApiResponse(responseCode = "429", description = "Limite de requisições da AlphaVantage atingido")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API")
    @GetMapping("/{symbol}")
    public ResponseEntity<StockQuoteDTO> getQuote(
            @PathVariable @Pattern(regexp = SYMBOL_PATTERN, message = SYMBOL_MESSAGE) String symbol) {
        return ResponseEntity.ok(alphaVantageService.getStockQuote(symbol));
    }

    @Operation(summary = "Histórico de ação", description = "Retorna a série diária (~100 pregões) de uma ação. Ex: PETR4.SA, AAPL")
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso")
    @ApiResponse(responseCode = "400", description = "Símbolo com formato inválido")
    @ApiResponse(responseCode = "404", description = "Ação não encontrada")
    @ApiResponse(responseCode = "429", description = "Limite de requisições da AlphaVantage atingido")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a API")
    @GetMapping("/{symbol}/history")
    public ResponseEntity<StockHistoryDTO> getHistory(
            @PathVariable @Pattern(regexp = SYMBOL_PATTERN, message = SYMBOL_MESSAGE) String symbol) {
        return ResponseEntity.ok(alphaVantageService.getStockHistory(symbol));
    }
}
