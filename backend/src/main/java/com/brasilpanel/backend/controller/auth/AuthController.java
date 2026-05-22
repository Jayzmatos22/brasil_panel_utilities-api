package com.brasilpanel.backend.controller.auth;

import com.brasilpanel.backend.dto.user.AuthResponseDTO;
import com.brasilpanel.backend.dto.user.LoginRequestDTO;
import com.brasilpanel.backend.dto.user.UserRequestDTO;
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
@Tag(name = "Autenticação", description = "Endpoints de registro e login")
public class AuthController {

    private final AuthService authService;


    @Operation(summary = "Registrar usuário", description = "Cria um novo usuário e retorna o JWT token")
    @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou email já cadastrado")
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody @Valid UserRequestDTO dto) {
        AuthResponseDTO response = authService.registerUser(dto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/users/{email}")
                .buildAndExpand(dto.email())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }


    @Operation(summary = "Login", description = "Autentica o usuário e retorna o JWT token")
    @ApiResponse(responseCode = "200", description = "Login realizado com sucesso")
    @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.loginUser(dto));
    }
}