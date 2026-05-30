package com.brasilpanel.backend.validators;

import com.brasilpanel.backend.validators.api.ViaCepValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CepValidatorTest {

    private ViaCepValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ViaCepValidator();
    }

    @Test
    void deveRetornarTrueParaCepValido() {
        assertTrue(validator.isValid("05875230", null));
    }

    @Test
    void deveRetornarTrueParaCepComTraco() {
        assertTrue(validator.isValid("05875-230", null));
    }

    @Test
    void deveRetornarFalseParaCepCurto() {
        assertFalse(validator.isValid("0581", null));
    }

    @Test
    void deveRetornarFalseParaCepNulo() {
        assertFalse(validator.isValid(null, null));
    }

    @Test
    void deveRetornarFalseParaCepVazio() {
        assertFalse(validator.isValid("", null));
    }
}
