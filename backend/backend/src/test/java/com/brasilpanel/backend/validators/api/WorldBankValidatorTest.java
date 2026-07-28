package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.WorldBankException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WorldBankValidatorTest {

    private final WorldBankValidator validator = new WorldBankValidator();

    @ParameterizedTest
    @ValueSource(ints = {1960, 1999, 2020})
    @DisplayName("aceita anos dentro da série disponível")
    void acceptsYearsWithinRange(int ano) {
        assertThatCode(() -> validator.validYear(ano)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(ints = {1959, 1900, 0, -5})
    @DisplayName("rejeita anos anteriores ao início da série")
    void rejectsYearsBeforeSeriesStart(int ano) {
        // O World Bank não publica PIB anterior a 1960.
        assertThatThrownBy(() -> validator.validYear(ano))
                .isInstanceOf(WorldBankException.class)
                .hasMessageContaining("1960");
    }

    @Test
    @DisplayName("rejeita ano futuro")
    void rejectsFutureYear() {
        int proximoAno = LocalDate.now().getYear() + 1;

        assertThatThrownBy(() -> validator.validYear(proximoAno))
                .isInstanceOf(WorldBankException.class)
                .hasMessageContaining("futuro");
    }

    @Test
    @DisplayName("aceita o ano corrente")
    void acceptsCurrentYear() {
        // Limite superior é inclusivo: o dado do ano corrente existe, ainda que provisório.
        assertThatCode(() -> validator.validYear(LocalDate.now().getYear()))
                .doesNotThrowAnyException();
    }
}