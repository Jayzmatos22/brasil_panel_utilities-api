package com.brasilpanel.backend.service.api.metalsDev;


import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.dto.api.metalsDev.MetalsResponseDTO;
import com.brasilpanel.backend.exception.customized.MetalsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Slf4j
@RequiredArgsConstructor
public class MetalsDevService {
    private final RestClient restClient;

    @Value("${metals.api-key}")
    private String apiKey;

    @Cacheable("metals")
    public MetalsDataDTO getMetals() {
        String url = "https://api.metals.dev/v1/latest?api_key=" + apiKey
                + "&currency=BRL&unit=toz";
        try {
            MetalsResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(MetalsResponseDTO.class);

            if (response == null || response.metals() == null) {
                throw new MetalsException("Nenhuma metal encontrado", 502);
            }

            if (!"success".equals(response.status())) {
                throw new MetalsException("Erro na API de metais", 502);
            }

            return new MetalsDataDTO(
                    response.metals().gold(),
                    response.metals().silver(),
                    response.metals().platinum(),
                    response.metals().palladium(),
                    response.metals().copper(),
                    response.metals().aluminum(),
                    response.metals().nickel(),
                    response.metals().zinc(),
                    response.timestamps().metal()
            );

        } catch (MetalsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao buscar metais: {}", e.getMessage());
            throw new MetalsException("Erro na comunicação com a API de metais", 502);
        }
    }
}
