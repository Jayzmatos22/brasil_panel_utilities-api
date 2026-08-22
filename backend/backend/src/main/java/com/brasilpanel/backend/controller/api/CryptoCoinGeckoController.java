package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoByNameDTO;
import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.service.api.coinGecko.CoinGeckoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
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

    /**
     * Formato de um id/símbolo da CoinGecko: letras, dígitos e hífen (ex: bitcoin, usd-coin, btc).
     *
     * <p>Moeda fora do top 100 acompanhado cai no fallback que consulta a API — então,
     * sem este filtro, nomes inventados em laço batem no free tier da CoinGecko e a
     * fonte morre para todos os usuários. O padrão também barra {@code &} e {@code ?},
     * que iriam crus para a query string da chamada externa.
     */
    private static final String COIN_PATTERN = "^[A-Za-z0-9-]{2,40}$";

    private final CoinGeckoService coinGeckoService;

    @Operation(summary = "Top 100 criptomoedas", description = "Retorna as 100 maiores cryptos por market cap em BRL")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com CoinGecko")
    @GetMapping
    public ResponseEntity<List<CryptoCoinGeckoMarketDTO>> getAll100Cryptos() {
        return ResponseEntity.ok(coinGeckoService.returnAllCryptos());
    }


    @Operation(summary = "Criptomoeda por nome", description = "Retorna a criptomoeda pelo nome e seu valor em BRL")
    @ApiResponse(responseCode = "200", description = "Objeto com nome da moeda e preço BRL com sucesso")
    @ApiResponse(responseCode = "400", description = "Nome da moeda com formato inválido")
    @ApiResponse(responseCode = "404", description = "Moeda não encontrada na fonte")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com CoinGecko")
    @GetMapping("/{name}")
    public ResponseEntity<CryptoCoinGeckoByNameDTO> getCryptoByName(
            @PathVariable
            @Pattern(regexp = COIN_PATTERN,
                     message = "Nome da criptomoeda inválido — use letras, números ou hífen")
            String name) {
        return ResponseEntity.ok(coinGeckoService.returnCryptoByName(name));
    }
}
