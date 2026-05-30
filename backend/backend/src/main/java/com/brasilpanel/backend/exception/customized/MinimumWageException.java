package com.brasilpanel.backend.exception.customized;

public class MinimumWageException extends RuntimeException {
    private final int status;

    public MinimumWageException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
