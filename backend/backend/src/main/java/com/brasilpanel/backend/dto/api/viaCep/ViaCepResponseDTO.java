package com.brasilpanel.backend.dto.api.viaCep;

public record ViaCepResponseDTO(
        String cep,
        String logradouro,
        String complemento,
        String bairro,
        String localidade,
        String uf,
        String estado,
        String ddd
) {}
