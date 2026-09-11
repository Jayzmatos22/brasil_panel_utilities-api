package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.FrankfurterRateException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

@Component
public class FrankfurterValidator {

    /**
     * Código ISO 4217: exatamente três letras.
     *
     * <p>O teste anterior era só {@code length() != 3}, que aceita {@code "a&b"} — e esse
     * valor ia concatenado na query da fonte. Exigir letras fecha isso no serviço, que é
     * onde a garantia precisa valer mesmo que a anotação do controller seja removida.
     */
    private static final Pattern MOEDA = Pattern.compile("^[A-Za-z]{3}$");

    /** Teto do valor convertido. Ver o javadoc de {@code validAmount}. */
    private static final double VALOR_MAXIMO = 1_000_000_000d;

    public void validSearchFrankfurter(String from, String to, double amount) {
        validCurrency(from, "origem");
        validCurrency(to, "destino");
        validAmount(amount);
    }

    /** Valida o par de moedas sem exigir valor — usado pelas rotas de histórico. */
    public void validCurrencyPair(String from, String to) {
        validCurrency(from, "origem");
        validCurrency(to, "destino");
    }

    private void validCurrency(String codigo, String papel) {
        if (codigo == null || !MOEDA.matcher(codigo).matches()) {
            throw new FrankfurterRateException("Moeda de " + papel + " inválida.", 400);
        }
    }

    /**
     * Recusa valor não positivo, não finito e absurdamente grande.
     *
     * <p>{@code NaN} e {@code Infinity} passavam: {@code NaN <= 0} é falso em Java, então
     * a checagem anterior os deixava seguir e virar texto na URL da fonte. O teto superior
     * existe porque {@code amount} entra na chave do cache — não impede a cardinalidade
     * alta de um double, mas tira a faixa que só serve para abuso.
     */
    private void validAmount(double amount) {
        if (!Double.isFinite(amount) || amount <= 0 || amount > VALOR_MAXIMO) {
            throw new FrankfurterRateException("Valor deve ser maior que zero e no máximo "
                    + (long) VALOR_MAXIMO + ".", 400);
        }
    }

    // Para last-30-days
    public void validDateRange(String startDate, String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            if (start.isAfter(end)) {
                throw new FrankfurterRateException("Data inicial não pode ser maior que a data final", 400);
            }
            if (end.isAfter(LocalDate.now())) {
                throw new FrankfurterRateException("Data final não pode ser futura", 400);
            }
        } catch (DateTimeParseException e) {
            throw new FrankfurterRateException("Formato de data inválido — use YYYY-MM-DD", 400);
        }
    }
}
