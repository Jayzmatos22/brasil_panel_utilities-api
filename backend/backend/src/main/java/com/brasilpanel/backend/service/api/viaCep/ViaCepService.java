package com.brasilpanel.backend.service.api.viaCep;

import com.brasilpanel.backend.dto.api.viaCep.ViaCepResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class ViaCepService {

    private final RestClient restClient;

    // CEP → endereço é praticamente imutável (CORREIOS atualiza raramente).
    // Chave normalizada (apenas dígitos) evita duplicatas: "01310-100" = "01310100".
    @Cacheable(value = "viacep", key = "#cep.replaceAll('[^0-9]', '')")
    public ViaCepResponseDTO getAdressByCep(String cep) {
        String cleanCep = cep.replaceAll("\\D", "");

        if (cleanCep.length() != 8) {
            throw new IllegalArgumentException("CEP deve ter 8 dígitos");
        }

        return restClient.get()
                .uri("https://viacep.com.br/ws/{cep}/json/", cleanCep)
                .retrieve()
                .body(ViaCepResponseDTO.class);
    }
}
