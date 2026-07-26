package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import com.brasilpanel.backend.service.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String EMAIL = "usuario@exemplo.com";
    private static final String SENHA = "SenhaForte@123";
    private static final long EXPIRACAO_MS = 86_400_000L;

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserMapper userMapper;
    @Mock private EmailService emailService;
    @Mock private LoginAttemptLimiter loginAttemptLimiter;

    @InjectMocks
    private AuthService authService;

    private UserEntity usuarioVerificado;

    @BeforeEach
    void setUp() {
        usuarioVerificado = UserEntity.builder()
                .name("Usuário Teste")
                .email(EMAIL)
                .password("hash-bcrypt")
                .role(Role.USER)
                .verified(true)
                .build();
    }

    // ── Registro ─────────────────────────────────────────────────────────────

    @Nested
    class Registro {

        @Test
        @DisplayName("e-mail já cadastrado não revela que a conta existe")
        void duplicatedEmailDoesNotLeakAccountExistence() {
            var dto = new UserRequestDTO("Usuário Teste", EMAIL, SENHA);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioVerificado));

            assertThatThrownBy(() -> authService.registerUser(dto))
                    .isInstanceOf(IllegalArgumentException.class)
                    // Mensagem genérica de propósito: não confirma se o e-mail existe.
                    .hasMessageNotContainingAny("já cadastrado", "já existe");

            verify(userRepository, never()).save(any());
            verify(emailService, never()).sendVerificationCode(anyString(), anyString());
        }

        @Test
        @DisplayName("registro salva o usuário e dispara o código de verificação")
        void registerSavesUserAndSendsCode() {
            var dto = new UserRequestDTO("Usuário Teste", EMAIL, SENHA);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(SENHA)).thenReturn("hash-bcrypt");

            RegisterResponseDTO resposta = authService.registerUser(dto);

            assertThat(resposta.message()).contains(EMAIL);
            verify(userRepository).save(any(UserEntity.class));
            verify(emailService).sendVerificationCode(eq(EMAIL), anyString());
            // A senha nunca é persistida em texto puro.
            verify(passwordEncoder).encode(SENHA);
        }
    }

    // ── Verificação de e-mail ────────────────────────────────────────────────

    @Nested
    class VerificacaoDeEmail {

        private UserEntity naoVerificado;

        @BeforeEach
        void setUp() {
            naoVerificado = UserEntity.builder()
                    .name("Usuário Teste")
                    .email(EMAIL)
                    .password("hash-bcrypt")
                    .role(Role.USER)
                    .verified(false)
                    .build();
            naoVerificado.setVerificationCode("123456");
            naoVerificado.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        }

        @Test
        @DisplayName("código correto autentica e devolve o token")
        void validCodeAuthenticates() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(naoVerificado));
            when(jwtService.generateToken(naoVerificado)).thenReturn("jwt-gerado");
            when(jwtService.getExpirationMs()).thenReturn(EXPIRACAO_MS);

            AuthResponseDTO resposta = authService.verifyEmail(new VerifyEmailRequestDTO(EMAIL, "123456"));

            assertThat(resposta.token()).isEqualTo("jwt-gerado");
            assertThat(resposta.email()).isEqualTo(EMAIL);
            assertThat(resposta.role()).isEqualTo("USER");
            assertThat(resposta.expiresInMs()).isEqualTo(EXPIRACAO_MS);

            assertThat(naoVerificado.isVerified()).isTrue();
            // O código é apagado após o uso: não pode ser reaproveitado.
            assertThat(naoVerificado.getVerificationCode()).isNull();
            verify(userRepository).save(naoVerificado);
        }

        @Test
        @DisplayName("código errado é rejeitado e não verifica a conta")
        void wrongCodeIsRejected() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(naoVerificado));

            assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequestDTO(EMAIL, "000000")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Código inválido");

            assertThat(naoVerificado.isVerified()).isFalse();
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("código expirado é rejeitado mesmo estando correto")
        void expiredCodeIsRejected() {
            naoVerificado.setVerificationCodeExpiresAt(LocalDateTime.now().minusMinutes(1));
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(naoVerificado));

            assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequestDTO(EMAIL, "123456")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("expirado");

            assertThat(naoVerificado.isVerified()).isFalse();
        }

        @Test
        @DisplayName("conta já verificada não passa pela verificação de novo")
        void alreadyVerifiedIsRejected() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioVerificado));

            assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequestDTO(EMAIL, "123456")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("já verificado");
        }
    }

    // ── Login ────────────────────────────────────────────────────────────────

    @Nested
    class Login {

        @Test
        @DisplayName("login válido devolve o token e zera o contador de tentativas")
        void successfulLoginResetsAttemptCounter() {
            var dto = new LoginRequestDTO(EMAIL, SENHA);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioVerificado));
            when(jwtService.generateToken(usuarioVerificado)).thenReturn("jwt-gerado");
            when(jwtService.getExpirationMs()).thenReturn(EXPIRACAO_MS);

            AuthResponseDTO resposta = authService.loginUser(dto);

            assertThat(resposta.token()).isEqualTo("jwt-gerado");
            assertThat(resposta.email()).isEqualTo(EMAIL);
            verify(loginAttemptLimiter).reset(EMAIL);
            verify(loginAttemptLimiter, never()).recordFailure(anyString());
        }

        @Test
        @DisplayName("senha errada registra a falha e propaga o erro de credencial")
        void wrongPasswordRecordsFailure() {
            var dto = new LoginRequestDTO(EMAIL, "senha-errada");
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.loginUser(dto))
                    .isInstanceOf(BadCredentialsException.class);

            verify(loginAttemptLimiter).recordFailure(EMAIL);
            verify(loginAttemptLimiter, never()).reset(anyString());
            // Sem autenticação, não se consulta o usuário.
            verify(userRepository, never()).findByEmail(anyString());
        }

        @Test
        @DisplayName("e-mail bloqueado nem chega a tentar autenticar")
        void blockedEmailShortCircuits() {
            var dto = new LoginRequestDTO(EMAIL, SENHA);
            doThrow(new TooManyAttemptsException("Muitas tentativas de login."))
                    .when(loginAttemptLimiter).checkNotBlocked(EMAIL);

            assertThatThrownBy(() -> authService.loginUser(dto))
                    .isInstanceOf(TooManyAttemptsException.class);

            // O ponto do rate limiting: a senha não é sequer verificada.
            verify(authenticationManager, never()).authenticate(any());
        }

        @Test
        @DisplayName("conta não verificada não consegue logar")
        void unverifiedAccountCannotLogIn() {
            var naoVerificado = UserEntity.builder()
                    .name("Usuário Teste")
                    .email(EMAIL)
                    .password("hash-bcrypt")
                    .role(Role.USER)
                    .verified(false)
                    .build();

            var dto = new LoginRequestDTO(EMAIL, SENHA);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(naoVerificado));

            assertThatThrownBy(() -> authService.loginUser(dto))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("não verificado");
        }
    }
}