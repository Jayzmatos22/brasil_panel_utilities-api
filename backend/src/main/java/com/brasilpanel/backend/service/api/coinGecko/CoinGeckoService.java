package com.brasilpanel.backend.service.api.coinGecko;

import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoByNameDTO;
import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.exception.customized.CoinGeckoException;
import com.brasilpanel.backend.exception.customized.CryptoCoinGeckoException;
import com.brasilpanel.backend.validators.api.CryptoCoinGecko;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CoinGeckoService {
    private final RestClient restClient;
    private final CryptoCoinGecko cryptoCoinGecko;
    private static final String BRL_COIN_PRICE = "brl";


    @Cacheable("crypto-list")
    public List<CryptoCoinGeckoMarketDTO> returnAllCryptos(){
        try {
            List<CryptoCoinGeckoMarketDTO> data = restClient.get()
                    .uri("https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=100&page=1")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<CryptoCoinGeckoMarketDTO>>() {
                    });
            if (data == null){
                throw new CryptoCoinGeckoException("Nenhuma criptomoeda encontrada");
            }

            return data;

        } catch (CryptoCoinGeckoException e){
            throw e;
        } catch (Exception e){
            throw new CryptoCoinGeckoException("Nenhuma moeda cripto encontrada: "+ e.getMessage());
        }
    }


    @Cacheable("crypto-list")
    public CryptoCoinGeckoByNameDTO returnCryptoByName(String cryptoName){
        cryptoCoinGecko.validNameCoin(cryptoName);
        String url = "https://api.coingecko.com/api/v3/simple/price?ids=" + cryptoName + "&vs_currencies=brl";
        try {
            Map<String, Map<String, Double>> data = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Map<String, Double>>>() {});

            if (data == null || !data.containsKey(cryptoName)) {
                throw new CoinGeckoException("Crypto '" + cryptoName + "' não encontrada");
            }
            // Preço BRL
            Double price = data.get(cryptoName).get(BRL_COIN_PRICE);
            return new CryptoCoinGeckoByNameDTO(cryptoName, price);

        } catch (CoinGeckoException e) {
            throw e;
        } catch (Exception e) {
            throw new CoinGeckoException("Erro ao buscar crypto: " + e.getMessage());
        }
    }

}
