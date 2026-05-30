package com.brasilpanel.backend.validators.annotations;


import com.brasilpanel.backend.validators.api.ViaCepValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ViaCepValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCep {
    String message() default "Cep inválido";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
