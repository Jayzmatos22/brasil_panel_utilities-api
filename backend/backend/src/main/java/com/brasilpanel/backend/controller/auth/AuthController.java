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
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequestDTO dto) {
        LoginOutcomeDTO outcome = authService.loginUser(dto);

        // 202: credenciais aceitas, sessão ainda não. Nenhum Set-Cookie sai daqui — é
        // isso que faz a senha de admin, sozinha, não valer acesso.
        if (outcome.twoFactorRequired()) {
            return ResponseEntity.accepted().body(TwoFactorRequiredDTO.of(outcome.message()));
        }

        AuthResponseDTO response = outcome.auth();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(response.token()).toString())
                .body(response);
    }


    @Operation(summary = "Confirmar login de administrador",
               description = "Conclui o login de admin com o código de 6 dígitos enviado por e-mail.")
    @ApiResponse(responseCode = "200", description = "Código confirmado — sessão emitida")
    @ApiResponse(responseCode = "400", description = "Código inválido ou expirado")
    @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    @PostMapping("/admin/confirm-login")
    public ResponseEntity<AuthResponseDTO> confirmAdminLogin(
            @RequestBody @Valid ConfirmAdminLoginRequestDTO dto) {
        AuthResponseDTO response = authService.confirmAdminLogin(dto);
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

    @Operation(summary = "Alterar senha",
               description = "Troca a senha. Para admin, responde 202 e a troca só vale após confirmação por e-mail.")
    @ApiResponse(responseCode = "204", description = "Senha alterada")
    @ApiResponse(responseCode = "202", description = "Troca pendente — código enviado por e-mail")
    @PatchMapping("/update-password")
    public ResponseEntity<?> updatePassword(
            @RequestBody @Valid UpdatePasswordRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean pendente = authService.updatePassword(userDetails.getUsername(), dto);

        if (pendente) {
            return ResponseEntity.accepted().body(TwoFactorRequiredDTO.of(
                    "Código de confirmação enviado. A senha atual continua valendo até você confirmar."));
        }
        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "Confirmar troca de senha de administrador",
               description = "Aplica a senha nova retida no desafio, conferindo o código enviado por e-mail.")
    @ApiResponse(responseCode = "204", description = "Senha alterada")
    @ApiResponse(responseCode = "400", description = "Código inválido ou expirado")
    @PostMapping("/admin/confirm-password")
    public ResponseEntity<Void> confirmAdminPasswordChange(
            @RequestBody @Valid ConfirmAdminPasswordRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.confirmAdminPasswordChange(userDetails.getUsername(), dto);
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