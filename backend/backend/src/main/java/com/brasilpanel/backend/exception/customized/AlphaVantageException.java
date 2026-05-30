package com.brasilpanel.backend.exception.customized;

public class AlphaVantageException extends RuntimeException {
    private final int status;
    public AlphaVantageException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
