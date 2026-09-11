package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.FrankfurterRateException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

    /**
     * O que o teste antigo de moeda não pegava.
     *
     * <p>A checagem anterior era {@code length() != 3}: passava qualquer trio de
     * caracteres. E {@code amount <= 0} é falso para {@code NaN}, então {@code NaN} e
     * {@code Infinity} atravessavam o validador inteiro e viravam texto na URL da fonte.
     */
    @Nested
    @DisplayName("Buracos da checagem antiga")
    class ChecagemAntiga {

        @ParameterizedTest(name = "\"{0}\" tem 3 caracteres mas não é moeda")
        @ValueSource(strings = {"a&b", "U$D", "1 2", "../", "%2F", "US'"})
        @DisplayName("rejeita trio de caracteres que não são letras")
        void rejectsThreeCharsThatAreNotLetters(String moeda) {
            assertThatThrownBy(() -> validator.validSearchFrankfurter(moeda, "BRL", 1.0))
                    .isInstanceOf(FrankfurterRateException.class)
                    .hasMessageContaining("origem");
        }

        @ParameterizedTest(name = "amount = {0}")
        @ValueSource(doubles = {Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY})
        @DisplayName("rejeita valor não finito")
        void rejectsNonFiniteAmount(double valor) {
            assertThatThrownBy(() -> validator.validSearchFrankfurter("USD", "BRL", valor))
                    .isInstanceOf(FrankfurterRateException.class);
        }

        @Test
        @DisplayName("rejeita valor acima do teto")
        void rejectsAmountAboveCeiling() {
            assertThatThrownBy(() -> validator.validSearchFrankfurter("USD", "BRL", 1e12))
                    .isInstanceOf(FrankfurterRateException.class);
        }

        @Test
        @DisplayName("aceita valor no teto exato")
        void acceptsAmountAtCeiling() {
            assertThatCode(() -> validator.validSearchFrankfurter("USD", "BRL", 1_000_000_000d))
                    .doesNotThrowAnyException();
        }
    }

    /**
     * {@code validCurrencyPair} existe porque o histórico não validava moeda nenhuma —
     * só data. Sem ele, {@code from} e {@code to} de tamanho livre iam direto para a
     * query da fonte.
     */
    @Nested
    @DisplayName("Par de moedas sem valor (histórico)")
    class ParDeMoedas {

        @Test
        @DisplayName("aceita par válido")
        void acceptsValidPair() {
            assertThatCode(() -> validator.validCurrencyPair("usd", "brl"))
                    .doesNotThrowAnyException();
        }

        @ParameterizedTest(name = "origem \"{0}\"")
        @NullAndEmptySource
        @ValueSource(strings = {"USDD", "a&b", "USD&amount=99"})
        @DisplayName("rejeita origem fora do padrão")
        void rejectsMalformedSource(String moeda) {
            assertThatThrownBy(() -> validator.validCurrencyPair(moeda, "BRL"))
                    .isInstanceOf(FrankfurterRateException.class)
                    .hasMessageContaining("origem");
        }

        @ParameterizedTest(name = "destino \"{0}\"")
        @ValueSource(strings = {"BRLL", "B R", "BRL&to=XXX"})
        @DisplayName("rejeita destino fora do padrão")
        void rejectsMalformedTarget(String moeda) {
            assertThatThrownBy(() -> validator.validCurrencyPair("USD", moeda))
                    .isInstanceOf(FrankfurterRateException.class)
                    .hasMessageContaining("destino");
        }
    }
}
