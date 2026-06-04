package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.WorldBankException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class WorldBankValidator {

    // Ano válido
    public void validYear(int year) {
        int currentYear = LocalDate.now().getYear();

        if (year < 1960) {
            throw new WorldBankException("Ano inválido — dados disponíveis somente a partir de 1960", 400);
        }
        if (year > currentYear) {
            throw new WorldBankException("Ano inválido — não pode ser futuro: " + year, 400);
        }
    }
}
