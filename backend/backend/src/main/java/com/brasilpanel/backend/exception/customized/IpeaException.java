package com.brasilpanel.backend.exception.customized;

public class IpeaException extends RuntimeException {
    private final int status;

    public IpeaException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus(){
        return status;
    }
}
