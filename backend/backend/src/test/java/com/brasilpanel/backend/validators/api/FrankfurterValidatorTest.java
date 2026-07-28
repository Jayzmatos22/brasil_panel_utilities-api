package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.FrankfurterRateException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Primeira barreira antes de gastar uma requisição na API externa — rejeitar
 * aqui evita chamada inútil e mensagem de erro vinda de terceiro.
 */
class FrankfurterValidatorTest {

    private final FrankfurterValidator validator = new FrankfurterValidator();

    @Test
    @DisplayName("aceita par de moedas válido")
    void acceptsValidPair() {
        assertThatCode(() -> validator.validSearchFrankfurter("USD", "BRL", 1.0))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"US", "USDD", "  "})
    @DisplayName("rejeita código de origem fora do padrão ISO de 3 letras")
    void rejectsMalformedSourceCurrency(String moeda) {
        assertThatThrownBy(() -> validator.validSearchFrankfurter(moeda, "BRL", 1.0))
                .isInstanceOf(FrankfurterRateException.class)
                .hasMessageContaining("origem");
    }

    @ParameterizedTest
    @ValueSource(strings = {"BR", "BRLL"})
    @DisplayName("rejeita código de destino fora do padrão")
    void rejectsMalformedTargetCurrency(String moeda) {
        assertThatThrownBy(() -> validator.validSearchFrankfurter("USD", moeda, 1.0))
                .isInstanceOf(FrankfurterRateException.class)
                .hasMessageContaining("destino");
    }

    @ParameterizedTest
    @ValueSource(doubles = {0.0, -1.0, -0.01})
    @DisplayName("rejeita valor não positivo")
    void rejectsNonPositiveAmount(double valor) {
        assertThatThrownBy(() -> validator.validSearchFrankfurter("USD", "BRL", valor))
                .isInstanceOf(FrankfurterRateException.class)
                .hasMessageContaining("maior que zero");
    }

    @Test
    @DisplayName("aceita intervalo de datas coerente")
    void acceptsCoherentDateRange() {
        assertThatCode(() -> validator.validDateRange("2026-01-01", "2026-01-31"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("rejeita data inicial posterior à final")
    void rejectsInvertedRange() {
        assertThatThrownBy(() -> validator.validDateRange("2026-02-01", "2026-01-01"))
                .isInstanceOf(FrankfurterRateException.class)
                .hasMessageContaining("maior que a data final");
    }

    @Test
    @DisplayName("rejeita data final no futuro")
    void rejectsFutureEndDate() {
        String amanha = LocalDate.now().plusDays(1).toString();

        assertThatThrownBy(() -> validator.validDateRange("2026-01-01", amanha))
                .isInstanceOf(FrankfurterRateException.class)
                .hasMessageContaining("futura");
    }

    @ParameterizedTest
    @ValueSource(strings = {"01/01/2026", "2026-13-01", "ontem"})
    @DisplayName("rejeita formato de data inválido")
    void rejectsMalformedDate(String data) {
        assertThatThrownBy(() -> validator.validDateRange(data, "2026-01-31"))
                .isInstanceOf(FrankfurterRateException.class)
                .hasMessageContaining("Formato de data");
    }
}