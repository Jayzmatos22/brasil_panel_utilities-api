package com.brasilpanel.backend.exception.customized;

public class BrasilApiNotFoundException extends RuntimeException {
    public BrasilApiNotFoundException(String message) {
        super(message);
    }
}
