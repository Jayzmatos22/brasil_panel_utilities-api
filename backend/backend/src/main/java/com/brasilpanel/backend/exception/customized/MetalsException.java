package com.brasilpanel.backend.exception.customized;

public class MetalsException extends RuntimeException {
    private final int status;

    public MetalsException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
