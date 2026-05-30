package com.brasilpanel.backend.service.api.ibge;


import com.brasilpanel.backend.dto.api.ibge.EstadoDTO;
import com.brasilpanel.backend.dto.api.ibge.MunicipioDTO;
import com.brasilpanel.backend.exception.customized.IbgeException;
import com.brasilpanel.backend.exception.customized.ViaCepException;
import com.brasilpanel.backend.validators.api.IbgeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IbgeService {
    private final RestClient restClient;
    private final IbgeValidator ibgeValidator;



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


    @Cacheable("ibge-cities")
    public List<MunicipioDTO> getMunicipiosByEstado(String state, String filtro) {
        // Verifica id ou estado em sigla, lança exception ou passa.
        String url = ibgeValidator.resolveStateUri(state);

        List<MunicipioDTO> data = restClient.get()
                .uri(url)
                .retrieve()
                .body(new ParameterizedTypeReference<List<MunicipioDTO>>() {});

        if (data == null || data.isEmpty()) {
            throw new IbgeException("Nenhum município encontrado: " + state, 404);
        }

        if (filtro != null && !filtro.isBlank()) {
            return data.stream()
                    .filter(m -> m.nome().toLowerCase().contains(filtro.toLowerCase().trim()))
                    .toList();
        }

        return data;
    }

}
