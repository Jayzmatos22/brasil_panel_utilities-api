package com.brasilpanel.backend.validators.api;

import org.springframework.stereotype.Component;

@Component
public class CryptoCoinMarketCap {

    /**
     * Valida o termo de busca antes de qualquer consulta.
     * Barra aqui o que não faz sentido pesquisar — uma busca inválida que chegasse
     * à API gastaria crédito à toa.
     */
    public boolean validTerm(String term) {
        if (term == null || term.isBlank()) {
            throw new IllegalArgumentException("Símbolo ou nome da criptomoeda é obrigatório");
        }
        String clean = term.trim();
        if (clean.length() < 2) {
            throw new IllegalArgumentException("Termo de busca muito curto");
        }
        if (clean.length() > 40) {
            throw new IllegalArgumentException("Termo de busca muito longo");
        }
        return true;
    }
}