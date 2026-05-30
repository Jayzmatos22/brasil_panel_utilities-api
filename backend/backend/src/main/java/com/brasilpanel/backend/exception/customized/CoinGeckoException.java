package com.brasilpanel.backend.exception.customized;

public class CoinGeckoException extends RuntimeException {
    public CoinGeckoException(String message) {
        super(message);
    }
}
