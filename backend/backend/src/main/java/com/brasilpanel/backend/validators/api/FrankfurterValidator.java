package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.FrankfurterRateException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Component
public class FrankfurterValidator {

    public void validSearchFrankfurter(String from, String to, double amount) {
        if (from == null || from.isBlank() || from.length() != 3) {
            throw new FrankfurterRateException("Moeda de origem inválida: " + from, 400);
        }
        if (to == null || to.isBlank() || to.length() != 3) {
            throw new FrankfurterRateException("Moeda de destino inválida: " + to, 400);
        }
        if (amount <= 0) {
            throw new FrankfurterRateException("Valor deve ser maior que zero", 400);
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
