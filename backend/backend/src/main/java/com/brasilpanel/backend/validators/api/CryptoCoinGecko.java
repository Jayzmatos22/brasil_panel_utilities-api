package com.brasilpanel.backend.validators.api;

import org.springframework.stereotype.Component;

@Component
public class CryptoCoinGecko {

    public boolean validNameCoin(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome da criptomoeda é obrigatório");
        }
        String cleanName = name.trim().toLowerCase();
        if (cleanName.length() < 2) {
            throw new IllegalArgumentException("Nome da criptomoeda muito curto");
        }
        return true;
    }
}
