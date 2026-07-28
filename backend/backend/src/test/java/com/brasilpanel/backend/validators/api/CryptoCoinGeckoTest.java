package com.brasilpanel.backend.validators.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CryptoCoinGeckoTest {

    private final CryptoCoinGecko validator = new CryptoCoinGecko();

    @ParameterizedTest
    @ValueSource(strings = {"btc", "bitcoin", "usd-coin"})
    @DisplayName("aceita nomes com dois caracteres ou mais")
    void acceptsNamesWithTwoOrMoreCharacters(String nome) {
        assertThat(validator.validNameCoin(nome)).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t"})
    @DisplayName("rejeita nome ausente ou em branco")
    void rejectsMissingName(String nome) {
        assertThatThrownBy(() -> validator.validNameCoin(nome))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("obrigatório");
    }

    @Test
    @DisplayName("rejeita nome de um único caractere")
    void rejectsSingleCharacterName() {
        // Um caractere não identifica moeda alguma e só gastaria uma requisição.
        assertThatThrownBy(() -> validator.validNameCoin("b"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("muito curto");
    }

    @Test
    @DisplayName("considera o nome já sem espaços nas pontas")
    void trimsBeforeMeasuringLength() {
        // "  b  " tem 5 caracteres brutos, mas 1 depois do trim.
        assertThatThrownBy(() -> validator.validNameCoin("  b  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("muito curto");
    }
}