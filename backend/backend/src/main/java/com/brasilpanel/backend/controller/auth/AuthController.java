package com.brasilpanel.backend.controller.auth;

import com.brasilpanel.backend.config.jwt.JwtFilter;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.Duration;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de registro, verificação e login")
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    // Em produção o cookie deve exigir HTTPS. Em dev (http://localhost) precisa ser false.
    @Value("${app.auth.cookie.secure:false}")
    private boolean cookieSecure;


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
        AuthResponseDTO response = authService.verifyEmail(dto);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(response.token()).toString())
                .body(response);
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
        AuthResponseDTO response = authService.loginUser(dto);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(response.token()).toString())
                .body(response);
    }


    @Operation(summary = "Logout", description = "Limpa o cookie de sessão do navegador")
    @ApiResponse(responseCode = "204", description = "Sessão encerrada")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expiredSessionCookie().toString())
                .build();
    }


    // ── Cookie de sessão ──────────────────────────────────────────────────────
    // O JWT viaja em cookie httpOnly: inacessível ao JavaScript e, portanto, imune
    // a exfiltração por XSS. SameSite=Lax impede que o navegador o envie em
    // requisições disparadas por outros sites (defesa contra CSRF).

    private ResponseCookie sessionCookie(String token) {
        return baseCookie(token).maxAge(Duration.ofMillis(expirationMs)).build();
    }

    private ResponseCookie expiredSessionCookie() {
        return baseCookie("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(JwtFilter.SESSION_COOKIE, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/");
    }


    @PatchMapping("/update-name")
    public ResponseEntity<Void> updateName(
            @RequestBody @Valid UpdateNameRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.updateName(userDetails.getUsername(), dto);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/update-password")
    public ResponseEntity<Void> updatePassword(
            @RequestBody @Valid UpdatePasswordRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.updatePassword(userDetails.getUsername(), dto);
        return ResponseEntity.noContent().build();
    }

    // ── Perfil profissional (onboarding) ──────────────────────────────────────
    // Autenticados por omissão: não constam da lista permitAll do SecurityConfig,
    // então caem em anyRequest().authenticated(). A identidade vem do JWT, nunca
    // do corpo — um userId enviado pelo cliente permitiria editar perfil alheio.

    @Operation(summary = "Consultar perfil",
               description = "Perfil profissional do usuário autenticado. Campos nulos "
                           + "significam não preenchido; onboardingCompletedAt nulo "
                           + "significa que a etapa ainda não foi apresentada")
    @ApiResponse(responseCode = "200", description = "Perfil retornado")
    @ApiResponse(responseCode = "401", description = "Sessão ausente ou expirada")
    @GetMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> profile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getProfile(userDetails.getUsername()));
    }


    @Operation(summary = "Salvar perfil",
               description = "Grava o perfil profissional e encerra o onboarding. "
                           + "Serve também à edição posterior nas configurações")
    @ApiResponse(responseCode = "200", description = "Perfil salvo")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    @ApiResponse(responseCode = "401", description = "Sessão ausente ou expirada")
    @PatchMapping("/update-profile")
    public ResponseEntity<ProfileResponseDTO> updateProfile(
            @RequestBody @Valid ProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.updateProfile(userDetails.getUsername(), dto));
    }


    @Operation(summary = "Pular onboarding",
               description = "Marca a etapa como vista sem coletar dados. Idempotente: "
                           + "não sobrescreve perfil já preenchido")
    @ApiResponse(responseCode = "204", description = "Onboarding encerrado")
    @ApiResponse(responseCode = "401", description = "Sessão ausente ou expirada")
    @PostMapping("/skip-onboarding")
    public ResponseEntity<Void> skipOnboarding(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.skipOnboarding(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }


    @DeleteMapping("/delete-account")
    public ResponseEntity<Void> deleteAccount(
            @RequestBody @Valid DeleteAccountRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.deleteAccount(userDetails.getUsername(), dto);
        return ResponseEntity.noContent().build();
    }
}