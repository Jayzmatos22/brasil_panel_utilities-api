package com.brasilpanel.backend.exception.customized;

public class IbgeException extends RuntimeException {
    private final int status;

    public IbgeException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
