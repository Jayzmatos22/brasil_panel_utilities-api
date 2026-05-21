package com.brasilpanel.backend.exception.global;

import com.brasilpanel.backend.exception.customized.BcbApiException;
import com.brasilpanel.backend.exception.customized.ViaCepException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
public class GlobalExceptionHandler {


    // Atende @PathVariable (ValidCep), @RequestParam com anotação customizada
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<String> handleMethodValidation(HandlerMethodValidationException ex) {
        String message = ex.getParameterValidationResults()
                .stream()
                .flatMap(r -> r.getResolvableErrors().stream())
                .map(MessageSourceResolvable::getDefaultMessage)
                .findFirst()
                .orElse("Parâmetro inválido");
        return ResponseEntity.badRequest().body(message);
    }


    // Atende Bean Validation em service
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<String> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations()
                .iterator().next()
                .getMessage();
        return ResponseEntity.badRequest().body(message);
    }


    // Atende exceção illgeal
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }


    // Atende exceção @RequestBody
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Dados inválidos");
        return ResponseEntity.badRequest().body(message);
    }


    // Atende error de API externa Banco Central
    @ExceptionHandler(BcbApiException.class)
    public ResponseEntity<String> handleBcbApi(BcbApiException ex) {
        return ResponseEntity.status(502).body(ex.getMessage());
    }


    // Atende error API ViaCep
    @ExceptionHandler(ViaCepException.class)
    public ResponseEntity<String> handleViaCep(ViaCepException ex){
        return ResponseEntity.status(502).body(ex.getMessage());
    }

}