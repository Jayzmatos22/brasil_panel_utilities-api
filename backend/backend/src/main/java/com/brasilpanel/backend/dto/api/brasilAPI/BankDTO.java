package com.brasilpanel.backend.dto.api.brasilAPI;

// BrasilAPI
public record BankDTO(
        // Retorno de uma lista de bancos com esses campos
        // Lista grande
        String ispb,
        String name,
        Integer code,
        String fullName
) {}
