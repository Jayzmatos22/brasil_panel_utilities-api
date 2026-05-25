package com.brasilpanel.backend.exception.global;

import com.brasilpanel.backend.exception.customized.*;
import jakarta.validation.ConstraintViolationException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

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

    // Atende BrasilAPI
    @ExceptionHandler(BrasilApiException.class)
    public ResponseEntity<String> handleBrasilApi(BrasilApiException ex){
        return ResponseEntity.status(502).body(ex.getMessage());
    }

    // Banco não encontrado pelo código
    @ExceptionHandler(BrasilApiNotFoundException.class)
    public ResponseEntity<String> handleBrasilApiNotFound(BrasilApiNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }


    // Crypto não retornada - erro na api
    @ExceptionHandler(CryptoCoinGeckoException.class)
    public ResponseEntity<String> handleCryptoCoinGeckoException(CryptoCoinGeckoException ex) {
        return ResponseEntity.status(502).body(ex.getMessage());
    }

    // Nome inválido de crypto
    @ExceptionHandler(CoinGeckoException.class)
    public ResponseEntity<String> handleCoinGeckoException(CoinGeckoException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }


    // Moeda inválida ou erro na api - Frankfurter
    @ExceptionHandler(FrankfurterRateException.class)
    public ResponseEntity<String> handleFrankfurterRateException(FrankfurterRateException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ex.getMessage());
    }

    // Moeda não encontrada - Frankfurter
    @ExceptionHandler(FrankfurterNotFoundException.class)
    public ResponseEntity<String> handleFrankfurterNotFound(FrankfurterNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }


    // Erro na api do worldabnk
    // Ano inválido
    @ExceptionHandler(WorldBankException.class)
    public ResponseEntity<String> handleWorldBank(WorldBankException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ex.getMessage());
    }

    // Parâmetros inadequados
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body("Parâmetro inválido: '" + ex.getValue() + "' não é um número válido");
    }


    // Exception genérica
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneral(Exception ex) {
        return ResponseEntity.status(500).body("Erro interno do servidor: " + ex.getMessage());
    }


    @ExceptionHandler(ClassCastException.class)
    public ResponseEntity<String> handleClassCast(ClassCastException ex) {
        return ResponseEntity.status(500).body(ex.getMessage());
    }


    // Erro ibge - api e busca
    @ExceptionHandler(IbgeException.class)
    public ResponseEntity<String> handleIbgeException(IbgeException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ex.getMessage());
    }


    @ExceptionHandler(MinimumWageException.class)
    public ResponseEntity<String> handleMinimumWage(MinimumWageException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ex.getMessage());
    }



}
