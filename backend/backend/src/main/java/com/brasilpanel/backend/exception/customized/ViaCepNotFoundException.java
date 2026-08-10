package com.brasilpanel.backend.exception.customized;

/**
 * CEP bem formado, mas inexistente na base dos Correios.
 *
 * <p>Separada da {@link ViaCepException} porque o desfecho é diferente: aqui a
 * API respondeu normalmente e a resposta é "não existe" (404), não uma falha de
 * comunicação (502).
 */
public class ViaCepNotFoundException extends RuntimeException {
    public ViaCepNotFoundException(String message) {
        super(message);
    }
}