package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.coinMarketCap.CmcGlobalDTO;
import com.brasilpanel.backend.dto.api.coinMarketCap.CmcMarketDTO;
import com.brasilpanel.backend.service.api.coinMarketCap.CoinMarketCapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Fonte CoinMarketCap — exposta em paralelo ao /api/coingecko, nunca no lugar dele.
 * As duas ficam explícitas no painel para que dê para comparar as cotações.
 */
@RestController
@RequestMapping("/api/coinmarketcap")
@RequiredArgsConstructor
@Tag(name = "Crypto (CoinMarketCap)", description = "Criptomoedas pela CoinMarketCap")
public class CryptoCoinMarketCapController {

    private final CoinMarketCapService coinMarketCapService;

    @Operation(summary = "Ranking de criptomoedas",
               description = "Top moedas por market cap em BRL, servidas do último snapshot salvo. "
                           + "Lista vazia significa fonte não configurada.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com a CoinMarketCap")
    @GetMapping
    public ResponseEntity<List<CmcMarketDTO>> getAllCryptos() {
        return ResponseEntity.ok(coinMarketCapService.returnAllCryptos());
    }

    @Operation(summary = "Panorama do mercado",
               description = "Market cap total, dominância do BTC e volume das moedas acompanhadas. "
                           + "Derivado do snapshot — não consome créditos da API.")
    @ApiResponse(responseCode = "200", description = "Panorama retornado com sucesso")
    @ApiResponse(responseCode = "502", description = "Nenhum dado disponível")
    @GetMapping("/global")
    public ResponseEntity<CmcGlobalDTO> getGlobalStats() {
        return ResponseEntity.ok(coinMarketCapService.returnGlobalStats());
    }

    @Operation(summary = "Criptomoeda por símbolo ou nome",
               description = "Resolve por símbolo, slug ou nome (ex: btc, bitcoin) dentro do "
                           + "ranking acompanhado. Não consome créditos: moeda fora do "
                           + "snapshot é 404, nunca uma consulta à API.")
    @ApiResponse(responseCode = "200", description = "Moeda encontrada")
    @ApiResponse(responseCode = "400", description = "Termo de busca inválido")
    @ApiResponse(responseCode = "404", description = "Moeda fora do ranking acompanhado")
    @GetMapping("/{term}")
    public ResponseEntity<CmcMarketDTO> getCryptoByTerm(@PathVariable String term) {
        return ResponseEntity.ok(coinMarketCapService.returnCryptoByTerm(term));
    }
}