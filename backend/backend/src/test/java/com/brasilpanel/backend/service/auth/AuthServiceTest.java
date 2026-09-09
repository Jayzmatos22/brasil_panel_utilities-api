package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.*;
import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.AuthChallenge;
import com.brasilpanel.backend.model.AuthChallengePurpose;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import com.brasilpanel.backend.service.admin.AdminTwoFactorService;
import com.brasilpanel.backend.service.auth.AuthChallengeService;
import com.brasilpanel.backend.service.email.EmailOutboxService;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class



AuthServiceTest {

    private static final String EMAIL = "usuario@exemplo.com";
    private static final String SENHA = "SenhaForte@123";
    private static final long EXPIRACAO_MS = 86_400_000L;

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserMapper userMapper;
    @Mock private EmailOutboxService emailOutbox;
    @Mock private LoginAttemptLimiter loginAttemptLimiter;
    @Mock private AdminTwoFactorService adminTwoFactor;
    @Mock private AuthChallengeService authChallenges;

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
            verify(emailOutbox, never()).enqueueVerificationCode(anyString());
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
            verify(emailOutbox).enqueueVerificationCode(EMAIL);
            // A senha nunca é persistida em texto puro.
            verify(passwordEncoder).encode(SENHA);
        }

        /**
         * Regressão do trava-cadastro: o usuário é salvo ANTES do e-mail sair, então
         * uma falha de envio deixava a conta criada e não verificada. A tentativa
         * seguinte batia na recusa por e-mail duplicado, e a tela de verificação só é
         * alcançável pela navegação de um cadastro bem-sucedido — a pessoa ficava sem
         * caminho nenhum pela interface.
         */
        @Test
        @DisplayName("cadastro pendente com o mesmo e-mail reemite o código em vez de recusar")
        void pendingRegistrationIsReissued() {
            var pendente = UserEntity.builder()
                    .name("Nome Antigo").email(EMAIL).password("hash-antigo")
                    .role(Role.USER).verified(false)
                    .verificationCode("111111")
                    .build();
            var dto = new UserRequestDTO("Nome Novo", EMAIL, SENHA);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pendente));
            when(passwordEncoder.encode(SENHA)).thenReturn("hash-novo");

            RegisterResponseDTO resposta = authService.registerUser(dto);

            assertThat(resposta.message()).contains(EMAIL);
            verify(userRepository).save(pendente);
            verify(emailOutbox).enqueueVerificationCode(EMAIL);

            assertThat(pendente.getVerificationCode())
                    .as("código novo, não o anterior")
                    .isNotEqualTo("111111");
            assertThat(pendente.getName()).isEqualTo("Nome Novo");
            assertThat(pendente.getPassword())
                    .as("a senha informada agora substitui a da tentativa anterior")
                    .isEqualTo("hash-novo");
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
            // O nome viaja na resposta: é dele que o cabeçalho do painel vive.
            // Sem isto o frontend só teria o e-mail e voltaria a exibir o trecho
            // antes do "@" no lugar do nome.
            assertThat(resposta.name()).isEqualTo("Usuário Teste");
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
        @DisplayName("conta já verificada responde igual a código errado")
        void alreadyVerifiedIsIndistinguishableFromWrongCode() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioVerificado));

            assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequestDTO(EMAIL, "123456")))
                    .isInstanceOf(IllegalArgumentException.class)
                    // Revelar "já verificado" diria a um estranho que a conta existe.
                    .hasMessageNotContainingAny("já verificado", "não encontrado")
                    .hasMessageContaining("Código inválido");
        }

        @Test
        @DisplayName("e-mail inexistente responde igual a código errado")
        void unknownEmailIsIndistinguishableFromWrongCode() {
            when(userRepository.findByEmail("estranho@exemplo.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    authService.verifyEmail(new VerifyEmailRequestDTO("estranho@exemplo.com", "123456")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Código inválido");
        }
    }

    // ── Reenvio de código ────────────────────────────────────────────────────

    @Nested
    class ReenvioDeCodigo {

        @Test
        @DisplayName("conta pendente recebe um novo código")
        void pendingAccountGetsANewCode() {
            var naoVerificado = UserEntity.builder()
                    .name("Usuário Teste").email(EMAIL).password("hash")
                    .role(Role.USER).verified(false).build();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(naoVerificado));

            authService.resendCode(new ResendCodeRequestDTO(EMAIL));

            verify(emailOutbox).enqueueVerificationCode(EMAIL);
            verify(userRepository).save(naoVerificado);
        }

        @Test
        @DisplayName("e-mail inexistente devolve a mesma resposta, sem enviar nada")
        void unknownEmailGetsTheSameAnswer() {
            when(userRepository.findByEmail("estranho@exemplo.com")).thenReturn(Optional.empty());

            var resposta = authService.resendCode(new ResendCodeRequestDTO("estranho@exemplo.com"));

            // Sem exceção e com a mesma mensagem: o endpoint não vira oráculo de cadastro.
            assertThat(resposta.message()).contains("Se houver um cadastro pendente");
            verify(emailOutbox, never()).enqueueVerificationCode(anyString());
        }

        @Test
        @DisplayName("conta já verificada devolve a mesma resposta, sem enviar nada")
        void verifiedAccountGetsTheSameAnswer() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioVerificado));

            var resposta = authService.resendCode(new ResendCodeRequestDTO(EMAIL));

            assertThat(resposta.message()).contains("Se houver um cadastro pendente");
            verify(emailOutbox, never()).enqueueVerificationCode(anyString());
            verify(userRepository, never()).save(any());
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

            LoginOutcomeDTO outcome = authService.loginUser(dto);

            assertThat(outcome.twoFactorRequired())
                    .as("usuário comum não passa pelo segundo fator")
                    .isFalse();
            AuthResponseDTO resposta = outcome.auth();
            assertThat(resposta.token()).isEqualTo("jwt-gerado");
            assertThat(resposta.name()).isEqualTo("Usuário Teste");
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

    // ── Troca de senha ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("Alteração de senha")
    class AlteracaoDeSenha {

        private UserEntity usuario;

        @BeforeEach
        void setUp() {
            usuario = UserEntity.builder()
                    .name("Usuário Teste").email(EMAIL).password("hash-antigo")
                    .role(Role.USER).verified(true)
                    .build();
        }

        /**
         * O campo é o que derruba as sessões abertas: o JwtService recusa todo
         * token emitido antes dele. Sem esta gravação, trocar a senha não expulsa
         * quem já estava dentro — o token anterior segue valendo até expirar.
         */
        @Test
        @DisplayName("troca bem-sucedida registra o instante que invalida os tokens antigos")
        void successfulChangeStampsPasswordChangedAt() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("SenhaAtual@123", "hash-antigo")).thenReturn(true);
            when(passwordEncoder.matches("SenhaNova@123", "hash-antigo")).thenReturn(false);
            when(passwordEncoder.encode("SenhaNova@123")).thenReturn("hash-novo");

            LocalDateTime antes = LocalDateTime.now().minusSeconds(1);
            authService.updatePassword(EMAIL, new UpdatePasswordRequestDTO("SenhaAtual@123", "SenhaNova@123"));

            assertThat(usuario.getPasswordChangedAt())
                    .as("carimbo gravado")
                    .isNotNull()
                    .isAfter(antes);
            assertThat(usuario.getPassword()).isEqualTo("hash-novo");
            verify(userRepository).save(usuario);
        }

        @Test
        @DisplayName("senha atual errada não altera nada")
        void wrongCurrentPasswordChangesNothing() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("SenhaErrada", "hash-antigo")).thenReturn(false);

            assertThatThrownBy(() -> authService.updatePassword(
                    EMAIL, new UpdatePasswordRequestDTO("SenhaErrada", "SenhaNova@123")))
                    .isInstanceOf(IllegalArgumentException.class);

            assertThat(usuario.getPasswordChangedAt())
                    .as("sessões abertas não podem cair por uma tentativa falha")
                    .isNull();
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("nova senha igual à atual é recusada")
        void samePasswordIsRejected() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("SenhaAtual@123", "hash-antigo")).thenReturn(true);

            assertThatThrownBy(() -> authService.updatePassword(
                    EMAIL, new UpdatePasswordRequestDTO("SenhaAtual@123", "SenhaAtual@123")))
                    .isInstanceOf(IllegalArgumentException.class);

            assertThat(usuario.getPasswordChangedAt()).isNull();
            verify(userRepository, never()).save(any());
        }
    }

    // ── Segundo fator do admin ───────────────────────────────────────────────

    /**
     * A promessa deste fluxo é uma só: a senha de admin, sozinha, não abre a porta.
     * Cada teste aqui prende um pedaço dela.
     */
    @Nested
    @DisplayName("Segundo fator do admin")
    class SegundoFatorDoAdmin {

        private UserEntity admin;

        @BeforeEach
        void setUp() {
            admin = UserEntity.builder()
                    .id(UUID.randomUUID())
                    .name("Dono").email(EMAIL).password("hash-antigo")
                    .role(Role.ADMIN).verified(true)
                    .build();
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));
        }

        private AuthChallenge desafio(String hashPendente) {
            return AuthChallenge.builder()
                    .id(UUID.randomUUID()).userId(admin.getId())
                    .purpose(AuthChallengePurpose.PASSWORD_CHANGE)
                    .code("123456").pendingPasswordHash(hashPendente)
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .build();
        }

        @Test
        @DisplayName("login de admin não emite sessão: acertar a senha só leva ao código")
        void adminLoginIssuesNoSession() {
            when(adminTwoFactor.isRequiredFor(admin)).thenReturn(true);

            LoginOutcomeDTO outcome = authService.loginUser(new LoginRequestDTO(EMAIL, SENHA));

            assertThat(outcome.twoFactorRequired()).isTrue();
            assertThat(outcome.auth())
                    .as("nenhum token pode sair antes da confirmação")
                    .isNull();
            verify(adminTwoFactor).issue(admin, AuthChallengePurpose.LOGIN, null);
            verify(jwtService, never()).generateToken(any());
        }

        @Test
        @DisplayName("confirmação com código válido emite a sessão")
        void confirmingLoginIssuesSession() {
            when(adminTwoFactor.isRequiredFor(admin)).thenReturn(true);
            when(jwtService.generateToken(admin)).thenReturn("jwt-gerado");

            AuthResponseDTO resposta = authService.confirmAdminLogin(
                    new ConfirmAdminLoginRequestDTO(EMAIL, SENHA, "123456"));

            assertThat(resposta.token()).isEqualTo("jwt-gerado");
            verify(adminTwoFactor).consume(admin, AuthChallengePurpose.LOGIN, "123456");
        }

        @Test
        @DisplayName("confirmar com o segundo fator desligado não vira porta dos fundos")
        void confirmingWithTwoFactorOffIsRejected() {
            when(adminTwoFactor.isRequiredFor(admin)).thenReturn(false);

            // Se a válvula de escape estiver acionada, o caminho certo é o /login
            // normal. Emitir sessão aqui daria acesso por uma rota que deveria estar
            // fechada, sem nunca conferir código nenhum.
            assertThatThrownBy(() -> authService.confirmAdminLogin(
                    new ConfirmAdminLoginRequestDTO(EMAIL, SENHA, "123456")))
                    .isInstanceOf(IllegalArgumentException.class);
            verify(jwtService, never()).generateToken(any());
        }

        @Test
        @DisplayName("troca de senha de admin fica pendente: a senha atual continua valendo")
        void adminPasswordChangeStaysPending() {
            when(passwordEncoder.matches("SenhaAtual@123", "hash-antigo")).thenReturn(true);
            when(passwordEncoder.matches("SenhaNova@123", "hash-antigo")).thenReturn(false);
            when(passwordEncoder.encode("SenhaNova@123")).thenReturn("hash-novo");
            when(adminTwoFactor.isRequiredFor(admin)).thenReturn(true);

            boolean pendente = authService.updatePassword(
                    EMAIL, new UpdatePasswordRequestDTO("SenhaAtual@123", "SenhaNova@123"));

            assertThat(pendente).isTrue();
            assertThat(admin.getPassword())
                    .as("a conta não pode mudar antes da confirmação")
                    .isEqualTo("hash-antigo");
            assertThat(admin.getPasswordChangedAt())
                    .as("nem as sessões podem cair por uma troca que ainda não vale")
                    .isNull();
            verify(userRepository, never()).save(any());
            verify(adminTwoFactor).issue(admin, AuthChallengePurpose.PASSWORD_CHANGE, "hash-novo");
        }

        @Test
        @DisplayName("confirmada, a senha retida no desafio é aplicada e derruba as sessões")
        void confirmingAppliesTheHeldPassword() {
            when(adminTwoFactor.isRequiredFor(admin)).thenReturn(true);
            when(adminTwoFactor.consume(admin, AuthChallengePurpose.PASSWORD_CHANGE, "123456"))
                    .thenReturn(desafio("hash-novo"));

            authService.confirmAdminPasswordChange(
                    EMAIL, new ConfirmAdminPasswordRequestDTO("123456"));

            assertThat(admin.getPassword()).isEqualTo("hash-novo");
            assertThat(admin.getPasswordChangedAt()).isNotNull();
            verify(userRepository).save(admin);
        }

        @Test
        @DisplayName("desafio sem senha retida não apaga a senha da conta")
        void challengeWithoutPayloadNeverWipesThePassword() {
            when(adminTwoFactor.isRequiredFor(admin)).thenReturn(true);
            when(adminTwoFactor.consume(admin, AuthChallengePurpose.PASSWORD_CHANGE, "123456"))
                    .thenReturn(desafio(null));

            // Não deveria existir; se existir, aplicar hash nulo deixaria a conta sem
            // senha utilizável — falha catastrófica a partir de um estado só estranho.
            assertThatThrownBy(() -> authService.confirmAdminPasswordChange(
                    EMAIL, new ConfirmAdminPasswordRequestDTO("123456")))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThat(admin.getPassword()).isEqualTo("hash-antigo");
            verify(userRepository, never()).save(any());
        }
    }

    // ── Recuperação de senha ─────────────────────────────────────────────────

    /**
     * A recuperação é a única rota que troca uma senha sem conhecer a anterior. O que a
     * torna segura é o código, e o que a torna discreta é responder igual para todo mundo.
     */
    @Nested
    @DisplayName("Recuperação de senha")
    class RecuperacaoDeSenha {

        private UserEntity verificado;

        @BeforeEach
        void setUp() {
            verificado = UserEntity.builder()
                    .id(UUID.randomUUID())
                    .name("Fulano").email(EMAIL).password("hash-antigo")
                    .role(Role.USER).verified(true)
                    .build();
        }

        @Test
        @DisplayName("conta existente recebe o código no próprio e-mail")
        void existingAccountGetsTheCode() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(verificado));

            authService.requestPasswordReset(new ForgotPasswordRequestDTO(EMAIL));

            verify(authChallenges).issue(
                    verificado, AuthChallengePurpose.PASSWORD_RESET, EMAIL, null);
        }

        @Test
        @DisplayName("e-mail sem cadastro devolve a mesma resposta e não emite nada")
        void unknownEmailIsIndistinguishable() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            var resposta = authService.requestPasswordReset(new ForgotPasswordRequestDTO(EMAIL));

            // Resposta diferente aqui transformaria a rota num oráculo de quais
            // endereços têm conta — e ela não exige credencial nenhuma.
            assertThat(resposta.message()).contains("Se houver uma conta");
            verify(authChallenges, never()).issue(any(), any(), anyString(), any());
        }

        @Test
        @DisplayName("conta ainda não verificada não recupera")
        void unverifiedAccountDoesNotReset() {
            verificado.setVerified(false);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(verificado));

            authService.requestPasswordReset(new ForgotPasswordRequestDTO(EMAIL));

            // Cadastro não confirmado não provou o vínculo com a caixa de entrada; o
            // caminho dele é concluir a verificação, não redefinir senha.
            verify(authChallenges, never()).issue(any(), any(), anyString(), any());
        }

        @Test
        @DisplayName("do admin, o código vai para o endereço de segurança")
        void adminResetGoesToTheSecurityAddress() {
            verificado.setRole(Role.ADMIN);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(verificado));
            when(adminTwoFactor.recipientFor(verificado)).thenReturn("dono@exemplo.com");

            authService.requestPasswordReset(new ForgotPasswordRequestDTO(EMAIL));

            // Senão a recuperação seria um desvio do segundo fator: quem tomasse a caixa
            // da conta redefiniria a senha por ali.
            verify(authChallenges).issue(
                    verificado, AuthChallengePurpose.PASSWORD_RESET, "dono@exemplo.com", null);
        }

        @Test
        @DisplayName("código válido aplica a senha nova e derruba as sessões abertas")
        void validCodeAppliesNewPasswordAndDropsSessions() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(verificado));
            when(passwordEncoder.encode("SenhaNova@123")).thenReturn("hash-novo");

            authService.resetPassword(
                    new ResetPasswordRequestDTO(EMAIL, "123456", "SenhaNova@123"));

            assertThat(verificado.getPassword()).isEqualTo("hash-novo");
            // Quem recupera a senha às pressas costuma estar expulsando alguém: sem o
            // carimbo, a sessão do invasor sobreviveria à troca.
            assertThat(verificado.getPasswordChangedAt()).isNotNull();
            verify(authChallenges).consume(
                    verificado, AuthChallengePurpose.PASSWORD_RESET, "123456");
            verify(userRepository).save(verificado);
        }

        @Test
        @DisplayName("e-mail sem cadastro não chega a conferir código")
        void unknownEmailNeverReachesTheChallenge() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resetPassword(
                    new ResetPasswordRequestDTO(EMAIL, "123456", "SenhaNova@123")))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(authChallenges, never()).consume(any(), any(), anyString());
            verify(userRepository, never()).save(any());
        }
    }
}
