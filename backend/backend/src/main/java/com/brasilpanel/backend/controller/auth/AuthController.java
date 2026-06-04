package com.brasilpanel.backend.controller.auth;

import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de registro, verificação e login")
public class AuthController {

    private final AuthService authService;


    @Operation(summary = "Registrar usuário",
               description = "Cria o usuário e envia código de verificação por e-mail")
    @ApiResponse(responseCode = "201", description = "Usuário criado — código enviado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou e-mail já cadastrado")
    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(@RequestBody @Valid UserRequestDTO dto) {
        RegisterResponseDTO response = authService.registerUser(dto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/users/{email}")
                .buildAndExpand(dto.email())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }


    @Operation(summary = "Verificar e-mail",
               description = "Valida o código de 6 dígitos e retorna o JWT de acesso")
    @ApiResponse(responseCode = "200", description = "E-mail verificado — JWT retornado")
    @ApiResponse(responseCode = "400", description = "Código inválido ou expirado")
    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponseDTO> verifyEmail(@RequestBody @Valid VerifyEmailRequestDTO dto) {
        return ResponseEntity.ok(authService.verifyEmail(dto));
    }


    @Operation(summary = "Reenviar código",
               description = "Gera e reenvia um novo código de verificação")
    @ApiResponse(responseCode = "200", description = "Novo código enviado")
    @PostMapping("/resend-code")
    public ResponseEntity<RegisterResponseDTO> resendCode(@RequestBody @Valid ResendCodeRequestDTO dto) {
        return ResponseEntity.ok(authService.resendCode(dto));
    }


    @Operation(summary = "Login",
               description = "Autentica o usuário verificado e retorna o JWT token")
    @ApiResponse(responseCode = "200", description = "Login realizado com sucesso")
    @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    @ApiResponse(responseCode = "403", description = "E-mail não verificado")
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.loginUser(dto));
    }
}