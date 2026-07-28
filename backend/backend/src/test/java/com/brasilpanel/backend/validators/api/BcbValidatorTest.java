package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.MinimumWageException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BcbValidatorTest {

    private final BcbValidator validator = new BcbValidator();

    @ParameterizedTest
    @ValueSource(ints = {1, 12, 20})
    @DisplayName("aceita intervalos entre 1 e 20 meses, inclusive nos limites")
    void acceptsIntervalsWithinBounds(int meses) {
        assertThatCode(() -> validator.validIntervalFilterMonth(meses))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 21, 100})
    @DisplayName("rejeita intervalos fora da faixa")
    void rejectsIntervalsOutOfBounds(int meses) {
        assertThatThrownBy(() -> validator.validIntervalFilterMonth(meses))
                .isInstanceOf(MinimumWageException.class)
                .hasMessageContaining("entre 1 e 20");
    }
}