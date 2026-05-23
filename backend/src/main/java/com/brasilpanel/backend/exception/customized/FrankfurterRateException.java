package com.brasilpanel.backend.exception.customized;

public class FrankfurterRateException extends RuntimeException {
    private final int status;

    public FrankfurterRateException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
