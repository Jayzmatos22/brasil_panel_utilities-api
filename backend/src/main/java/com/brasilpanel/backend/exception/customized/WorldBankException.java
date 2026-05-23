package com.brasilpanel.backend.exception.customized;

public class WorldBankException extends RuntimeException {
    private final int status;

    public WorldBankException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
