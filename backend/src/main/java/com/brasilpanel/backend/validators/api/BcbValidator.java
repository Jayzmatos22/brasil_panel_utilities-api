package com.brasilpanel.backend.validators.api;

import com.brasilpanel.backend.exception.customized.MinimumWageException;
import org.springframework.stereotype.Component;

@Component
public class BcbValidator {
    public static final int MIN_MONTH = 1;
    public static final int MAX_MONTH = 20;

    public void validIntervalFilterMonth(int id){
        if (id < MIN_MONTH || id > MAX_MONTH){
            throw new MinimumWageException("Intervalo de meses do salário mínimo deve estar entre 1 e 20", 400);
        }
    }
}
