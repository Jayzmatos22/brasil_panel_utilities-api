package com.brasilpanel.backend.service.api.ibge;


import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.exception.customized.IbgeException;
import com.brasilpanel.backend.exception.customized.ViaCepException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IbgeService {
    private final RestClient restClient;



    @Cacheable("ibge-states")
    public List<EstadoDTO> returnAllBrazilianStates(){
        List<EstadoDTO> estados = restClient.get()
                .uri("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
                .retrieve()
                .body(new ParameterizedTypeReference<List<EstadoDTO>>() {});
        if (estados == null || estados.isEmpty()) {
            throw new IbgeException("Erro, dados vazios na API", 502);
        }
        return estados;
    }
}
