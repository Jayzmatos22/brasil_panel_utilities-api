package com.brasilpanel.backend.exception.customized;

public class CoinMarketCapException extends RuntimeException {
    public CoinMarketCapException(String message) {
        super(message);
    }
}