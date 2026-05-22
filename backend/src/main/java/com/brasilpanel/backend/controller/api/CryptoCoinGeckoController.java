package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoByNameDTO;
import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.service.api.coinGecko.CoinGeckoService;
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

@RestController
@RequestMapping("/api/coingecko")
@RequiredArgsConstructor
@Tag(name = "Crypto", description = "Endpoints de criptomoedas")
public class CryptoCoinGeckoController {
    private final CoinGeckoService coinGeckoService;

    @Operation(summary = "Top 100 criptomoedas", description = "Retorna as 100 maiores cryptos por market cap em BRL")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com CoinGecko")
    @GetMapping
    public ResponseEntity<List<CryptoCoinGeckoMarketDTO>> getAllCryptos() {
        return ResponseEntity.ok(coinGeckoService.returnAllCryptos());
    }


    @Operation(summary = "Criptomoeda por nome", description = "Retorna a criptomoeda pelo nome e seu valor em BRL")
    @ApiResponse(responseCode = "200", description = "Objeto com nome da moeda e preço BRL com sucesso")
    @ApiResponse(responseCode = "404", description = "Nome da moeda inválido")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com CoinGecko")
    @GetMapping("/{name}")
    public ResponseEntity<CryptoCoinGeckoByNameDTO> getAllCryptos(@PathVariable String name) {
        return ResponseEntity.ok(coinGeckoService.returnCryptoByName(name));
    }
}
