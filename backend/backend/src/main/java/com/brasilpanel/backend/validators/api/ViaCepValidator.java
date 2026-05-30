package com.brasilpanel.backend.validators.api;


import com.brasilpanel.backend.validators.annotations.ValidCep;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;


public class ViaCepValidator implements ConstraintValidator<ValidCep, String> {
    @Override
    public boolean isValid(String cep, ConstraintValidatorContext context) {
        if (cep == null || cep.isBlank()) return false;
        String clean = cep.replaceAll("\\D", "");
        return clean.length() == 8;
    }
}
