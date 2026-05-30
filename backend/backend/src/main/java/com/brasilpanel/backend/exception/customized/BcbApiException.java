package com.brasilpanel.backend.exception.customized;


// Chama RuntimeException e é captada em global
public class BcbApiException extends RuntimeException {
    public BcbApiException(String message) {
        super(message);
    }
}
