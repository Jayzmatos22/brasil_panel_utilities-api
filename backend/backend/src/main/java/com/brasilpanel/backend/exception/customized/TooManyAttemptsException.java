package com.brasilpanel.backend.exception.customized;

/** Excesso de tentativas de login para o mesmo e-mail dentro da janela configurada. */
public class TooManyAttemptsException extends RuntimeException {

    public TooManyAttemptsException(String message) {
        super(message);
    }
}