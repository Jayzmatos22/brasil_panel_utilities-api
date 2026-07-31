package com.brasilpanel.backend.exception.customized;

/**
 * Moeda que não está no batch acompanhado da CoinMarketCap.
 *
 * <p>Separada da {@link CoinMarketCapException} (502) porque não é falha de
 * integração: é o cliente pedindo algo que a fonte não serve. Vira 404.
 */
public class CoinMarketCapNotFoundException extends RuntimeException {
    public CoinMarketCapNotFoundException(String message) {
        super(message);
    }
}