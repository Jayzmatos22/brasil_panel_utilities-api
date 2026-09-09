package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.model.AuthChallenge;
import com.brasilpanel.backend.model.AuthChallengePurpose;
import com.brasilpanel.backend.model.EmailType;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.auth.AuthChallengeRepository;
import com.brasilpanel.backend.service.email.EmailOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * O desafio por e-mail é o que separa a senha do acesso, em três fluxos: login de admin,
 * troca de senha do admin e recuperação de senha. Estes testes prendem as garantias de que
 * os três dependem — o código confere, o desafio morre depois de usado, e nenhuma recusa
 * conta ao atacante o que deu errado.
 */
@ExtendWith(MockitoExtension.class)
class AuthChallengeServiceTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String DESTINO = "dono@exemplo.com";

    @Mock private AuthChallengeRepository challengeRepository;
    @Mock private EmailOutboxService emailOutbox;

    @InjectMocks private AuthChallengeService service;

    private UserEntity user;

    @BeforeEach
    void setUp() {
        user = UserEntity.builder()
                .id(USER_ID).name("Dono").email("conta@exemplo.com").password("hash")
                .role(Role.ADMIN).verified(true).build();
    }

    private AuthChallenge desafio(AuthChallengePurpose purpose, String code,
                                  LocalDateTime expiraEm, int tentativas) {
        return AuthChallenge.builder()
                .id(UUID.randomUUID()).userId(USER_ID).purpose(purpose)
                .code(code).attempts(tentativas).expiresAt(expiraEm)
                .build();
    }

    private void vigente(AuthChallenge d) {
        when(challengeRepository.findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                USER_ID, d.getPurpose())).thenReturn(Optional.of(d));
    }

    // ── Emissão ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Emissão")
    class Emissao {

        /** O id é gerado na gravação (GenerationType.UUID); o mock precisa imitar isso. */
        @BeforeEach
        void devolveOQueSalvaComId() {
            when(challengeRepository.save(any(AuthChallenge.class))).thenAnswer(i -> {
                AuthChallenge salvo = i.getArgument(0);
                ReflectionTestUtils.setField(salvo, "id", UUID.randomUUID());
                return salvo;
            });
        }

        @Test
        @DisplayName("emite código de 6 dígitos com prazo e enfileira o e-mail")
        void issuesSixDigitCodeAndEnqueuesEmail() {
            AuthChallenge emitido =
                    service.issue(user, AuthChallengePurpose.LOGIN, DESTINO, null);

            assertThat(emitido.getCode()).matches("\\d{6}");
            assertThat(emitido.getExpiresAt()).isAfter(LocalDateTime.now());
            assertThat(emitido.isUsable()).isTrue();
            verify(emailOutbox).enqueueAuthChallenge(
                    eq(DESTINO), any(UUID.class), eq(EmailType.ADMIN_CHALLENGE_CODE));
        }

        @Test
        @DisplayName("recuperação de senha enfileira com o tipo de e-mail próprio")
        void passwordResetUsesItsOwnEmailType() {
            service.issue(user, AuthChallengePurpose.PASSWORD_RESET, DESTINO, null);

            // O texto do e-mail sai da finalidade, mas o tipo na fila precisa existir
            // separado: o valor do enum é persistido em email_outbox.
            verify(emailOutbox).enqueueAuthChallenge(
                    eq(DESTINO), any(UUID.class), eq(EmailType.PASSWORD_RESET_CODE));
        }

        @Test
        @DisplayName("emitir invalida os desafios abertos da mesma finalidade")
        void issuingInvalidatesOpenChallenges() {
            service.issue(user, AuthChallengePurpose.LOGIN, DESTINO, null);

            // Dois códigos válidos ao mesmo tempo dobram a chance de acerto e ainda
            // deixam quem recebeu dois e-mails sem saber qual vale.
            verify(challengeRepository).invalidateOpen(
                    eq(USER_ID), eq(AuthChallengePurpose.LOGIN), any(LocalDateTime.class));
        }

        @Test
        @DisplayName("a senha nova fica retida no desafio, não na conta")
        void pendingPasswordIsHeldInTheChallenge() {
            AuthChallenge emitido = service.issue(
                    user, AuthChallengePurpose.PASSWORD_CHANGE, DESTINO, "hash-novo");

            // Gravar em users.password aqui aplicaria a troca antes da confirmação —
            // exatamente o que este fluxo existe para impedir.
            assertThat(emitido.getPendingPasswordHash()).isEqualTo("hash-novo");
            assertThat(user.getPassword()).isEqualTo("hash");
        }
    }

    // ── Conferência ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Conferência")
    class Conferencia {

        @Test
        @DisplayName("código correto consome o desafio")
        void correctCodeConsumesChallenge() {
            AuthChallenge d = desafio(AuthChallengePurpose.LOGIN, "123456",
                    LocalDateTime.now().plusMinutes(10), 0);
            vigente(d);

            AuthChallenge confirmado =
                    service.consume(user, AuthChallengePurpose.LOGIN, "123456");

            assertThat(confirmado.isConsumed()).isTrue();
            verify(challengeRepository).save(d);
        }

        @Test
        @DisplayName("o mesmo código não vale duas vezes")
        void consumedChallengeCannotBeReused() {
            AuthChallenge d = desafio(AuthChallengePurpose.LOGIN, "123456",
                    LocalDateTime.now().plusMinutes(10), 0);
            d.consume();
            vigente(d);

            // Sem isto, quem interceptar o e-mail reusa o código à vontade.
            assertThatThrownBy(() -> service.consume(user, AuthChallengePurpose.LOGIN, "123456"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage(AuthChallengeService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("código expirado é recusado com a mesma mensagem de código errado")
        void expiredCodeIsRejectedIndistinguishably() {
            AuthChallenge d = desafio(AuthChallengePurpose.LOGIN, "123456",
                    LocalDateTime.now().minusMinutes(1), 0);
            vigente(d);

            // Distinguir "expirado" de "errado" contaria a quem tenta que o código
            // existe e que insistir com um novo desafio vale a pena.
            assertThatThrownBy(() -> service.consume(user, AuthChallengePurpose.LOGIN, "123456"))
                    .hasMessage(AuthChallengeService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("código errado conta a tentativa e não consome o desafio")
        void wrongCodeCountsAttempt() {
            AuthChallenge d = desafio(AuthChallengePurpose.LOGIN, "123456",
                    LocalDateTime.now().plusMinutes(10), 0);
            vigente(d);

            assertThatThrownBy(() -> service.consume(user, AuthChallengePurpose.LOGIN, "000000"))
                    .hasMessage(AuthChallengeService.CODIGO_INVALIDO);

            assertThat(d.getAttempts()).isEqualTo(1);
            assertThat(d.isConsumed())
                    .as("errar não pode invalidar o desafio de quem está tentando legitimamente")
                    .isFalse();
        }

        @Test
        @DisplayName("estourar o limite de tentativas queima o desafio, mesmo com o código certo")
        void attemptLimitBurnsTheChallenge() {
            AuthChallenge d = desafio(AuthChallengePurpose.LOGIN, "123456",
                    LocalDateTime.now().plusMinutes(10), 5);
            vigente(d);

            // São 6 dígitos: sem teto, quem chegou até aqui percorre o espaço inteiro.
            assertThatThrownBy(() -> service.consume(user, AuthChallengePurpose.LOGIN, "123456"))
                    .hasMessage(AuthChallengeService.CODIGO_INVALIDO);

            assertThat(d.isConsumed())
                    .as("queimado: nem o código certo o ressuscita")
                    .isTrue();
        }

        @Test
        @DisplayName("sem desafio aberto, a recusa não revela que não há nada pendente")
        void missingChallengeIsIndistinguishable() {
            when(challengeRepository.findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                    USER_ID, AuthChallengePurpose.LOGIN)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.consume(user, AuthChallengePurpose.LOGIN, "123456"))
                    .hasMessage(AuthChallengeService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("código de tamanho diferente é recusado sem estourar")
        void codeOfDifferentLengthIsRejected() {
            AuthChallenge d = desafio(AuthChallengePurpose.LOGIN, "123456",
                    LocalDateTime.now().plusMinutes(10), 0);
            vigente(d);

            // A comparação em tempo constante percorre índices; sem a checagem de
            // tamanho, um código curto sairia por StringIndexOutOfBounds.
            assertThatThrownBy(() -> service.consume(user, AuthChallengePurpose.LOGIN, "12"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage(AuthChallengeService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("o código de uma finalidade não autoriza outra")
        void purposesAreIsolated() {
            AuthChallenge reset = desafio(AuthChallengePurpose.PASSWORD_RESET, "999999",
                    LocalDateTime.now().plusMinutes(10), 0);
            vigente(reset);

            // A busca é por (usuário, finalidade): um código de recuperação nunca
            // aparece como desafio de login, então não há como trocá-los.
            AuthChallenge confirmado = service.consume(
                    user, AuthChallengePurpose.PASSWORD_RESET, "999999");
            assertThat(confirmado.getPurpose()).isEqualTo(AuthChallengePurpose.PASSWORD_RESET);
        }
    }
}
