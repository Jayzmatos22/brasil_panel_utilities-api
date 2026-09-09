package com.brasilpanel.backend.service.admin;

import com.brasilpanel.backend.model.AdminChallenge;
import com.brasilpanel.backend.model.AdminChallengePurpose;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.admin.AdminChallengeRepository;
import com.brasilpanel.backend.service.email.EmailOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
 * O segundo fator é a única coisa entre a senha de admin e o controle do painel.
 * Estes testes prendem as três propriedades de que essa garantia depende: o código
 * confere, o desafio morre depois de usado, e nenhuma recusa conta ao atacante o que
 * deu errado.
 */
@ExtendWith(MockitoExtension.class)
class AdminTwoFactorServiceTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String CONTA = "admin@brasilpanel.com";
    private static final String SEGURANCA = "dono@exemplo.com";

    @Mock private AdminChallengeRepository challengeRepository;
    @Mock private EmailOutboxService emailOutbox;

    @InjectMocks private AdminTwoFactorService service;

    private UserEntity admin;
    private UserEntity comum;

    @BeforeEach
    void setUp() {
        ligar(true);
        ReflectionTestUtils.setField(service, "securityEmail", SEGURANCA);

        admin = UserEntity.builder()
                .id(USER_ID).name("Dono").email(CONTA).password("hash")
                .role(Role.ADMIN).verified(true).build();

        comum = UserEntity.builder()
                .id(UUID.randomUUID()).name("Fulano").email("fulano@exemplo.com").password("hash")
                .role(Role.USER).verified(true).build();
    }

    private void ligar(boolean valor) {
        ReflectionTestUtils.setField(service, "enabled", valor);
    }

    private AdminChallenge desafio(String code, LocalDateTime expiraEm, int tentativas) {
        return AdminChallenge.builder()
                .id(UUID.randomUUID()).userId(USER_ID)
                .purpose(AdminChallengePurpose.LOGIN)
                .code(code).attempts(tentativas).expiresAt(expiraEm)
                .build();
    }

    private void desafioVigente(AdminChallenge d) {
        when(challengeRepository.findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                USER_ID, AdminChallengePurpose.LOGIN)).thenReturn(Optional.of(d));
    }

    // ── Quando o segundo fator se aplica ─────────────────────────────────────

    @Nested
    @DisplayName("Alcance")
    class Alcance {

        @Test
        @DisplayName("exigido do admin, dispensado do usuário comum")
        void appliesOnlyToAdmin() {
            assertThat(service.isRequiredFor(admin)).isTrue();
            // Cobrar segundo fator de todo mundo custaria um e-mail por login sem
            // proteger nada proporcional: conta comum não promove nem apaga dados.
            assertThat(service.isRequiredFor(comum)).isFalse();
        }

        @Test
        @DisplayName("a válvula de escape desliga o segundo fator até para o admin")
        void killSwitchDisablesEvenForAdmin() {
            ligar(false);

            // Sem esta saída, uma queda do provedor de e-mail tranca o dono do lado de
            // fora do próprio painel, sem caminho que não passe por SQL em produção.
            assertThat(service.isRequiredFor(admin)).isFalse();
        }

        @Test
        @DisplayName("o código vai para o endereço de segurança, não para o e-mail da conta")
        void codeGoesToSecurityAddress() {
            // A separação é o ponto: se o e-mail da conta for comprometido — ou trocado
            // por quem invadiu —, o segundo fator continua chegando ao dono.
            assertThat(service.recipientFor(admin)).isEqualTo(SEGURANCA);
        }

        @Test
        @DisplayName("sem endereço de segurança configurado, cai no e-mail da conta")
        void fallsBackToAccountEmail() {
            ReflectionTestUtils.setField(service, "securityEmail", "  ");

            assertThat(service.recipientFor(admin)).isEqualTo(CONTA);
        }
    }

    // ── Emissão ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Emissão")
    class Emissao {

        /** O id é gerado na gravação (GenerationType.UUID); o mock precisa imitar isso. */
        @BeforeEach
        void devolveOQueSalvaComId() {
            when(challengeRepository.save(any(AdminChallenge.class))).thenAnswer(i -> {
                AdminChallenge salvo = i.getArgument(0);
                ReflectionTestUtils.setField(salvo, "id", UUID.randomUUID());
                return salvo;
            });
        }

        @Test
        @DisplayName("emite código de 6 dígitos com prazo e enfileira o e-mail")
        void issuesSixDigitCodeAndEnqueuesEmail() {
            AdminChallenge emitido = service.issue(admin, AdminChallengePurpose.LOGIN, null);

            assertThat(emitido.getCode()).matches("\\d{6}");
            assertThat(emitido.getExpiresAt()).isAfter(LocalDateTime.now());
            assertThat(emitido.isUsable()).isTrue();
            verify(emailOutbox).enqueueAdminChallenge(eq(SEGURANCA), any(UUID.class));
        }

        @Test
        @DisplayName("emitir invalida os desafios abertos da mesma finalidade")
        void issuingInvalidatesOpenChallenges() {
            service.issue(admin, AdminChallengePurpose.LOGIN, null);

            // Dois códigos válidos ao mesmo tempo dobram a chance de acerto e ainda
            // deixam quem recebeu dois e-mails sem saber qual vale.
            verify(challengeRepository).invalidateOpen(
                    eq(USER_ID), eq(AdminChallengePurpose.LOGIN), any(LocalDateTime.class));
        }

        @Test
        @DisplayName("a senha nova fica retida no desafio, não na conta")
        void pendingPasswordIsHeldInTheChallenge() {
            AdminChallenge emitido = service.issue(
                    admin, AdminChallengePurpose.PASSWORD_CHANGE, "hash-novo");

            // Gravar em users.password aqui aplicaria a troca antes da confirmação —
            // exatamente o que este fluxo existe para impedir.
            assertThat(emitido.getPendingPasswordHash()).isEqualTo("hash-novo");
            assertThat(admin.getPassword()).isEqualTo("hash");
        }
    }

    // ── Conferência ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Conferência")
    class Conferencia {

        @Test
        @DisplayName("código correto consome o desafio")
        void correctCodeConsumesChallenge() {
            AdminChallenge d = desafio("123456", LocalDateTime.now().plusMinutes(10), 0);
            desafioVigente(d);

            AdminChallenge confirmado =
                    service.consume(admin, AdminChallengePurpose.LOGIN, "123456");

            assertThat(confirmado.isConsumed()).isTrue();
            verify(challengeRepository).save(d);
        }

        @Test
        @DisplayName("o mesmo código não vale duas vezes")
        void consumedChallengeCannotBeReused() {
            AdminChallenge d = desafio("123456", LocalDateTime.now().plusMinutes(10), 0);
            d.consume();
            desafioVigente(d);

            // Sem isto, quem interceptar o e-mail reusa o código à vontade.
            assertThatThrownBy(() -> service.consume(admin, AdminChallengePurpose.LOGIN, "123456"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("código expirado é recusado com a mesma mensagem de código errado")
        void expiredCodeIsRejectedIndistinguishably() {
            AdminChallenge d = desafio("123456", LocalDateTime.now().minusMinutes(1), 0);
            desafioVigente(d);

            // Distinguir "expirado" de "errado" contaria a quem tenta que o código
            // existe e que insistir com um novo desafio vale a pena.
            assertThatThrownBy(() -> service.consume(admin, AdminChallengePurpose.LOGIN, "123456"))
                    .hasMessage(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("código errado conta a tentativa e não consome o desafio")
        void wrongCodeCountsAttempt() {
            AdminChallenge d = desafio("123456", LocalDateTime.now().plusMinutes(10), 0);
            desafioVigente(d);

            assertThatThrownBy(() -> service.consume(admin, AdminChallengePurpose.LOGIN, "000000"))
                    .hasMessage(AdminTwoFactorService.CODIGO_INVALIDO);

            assertThat(d.getAttempts()).isEqualTo(1);
            assertThat(d.isConsumed())
                    .as("errar não pode invalidar o desafio de quem está tentando legitimamente")
                    .isFalse();
        }

        @Test
        @DisplayName("estourar o limite de tentativas queima o desafio, mesmo com o código certo")
        void attemptLimitBurnsTheChallenge() {
            AdminChallenge d = desafio("123456", LocalDateTime.now().plusMinutes(10), 5);
            desafioVigente(d);

            // São 6 dígitos: sem teto, quem já tem a senha percorre o espaço inteiro.
            assertThatThrownBy(() -> service.consume(admin, AdminChallengePurpose.LOGIN, "123456"))
                    .hasMessage(AdminTwoFactorService.CODIGO_INVALIDO);

            assertThat(d.isConsumed())
                    .as("queimado: nem o código certo o ressuscita")
                    .isTrue();
        }

        @Test
        @DisplayName("sem desafio aberto, a recusa não revela que não há nada pendente")
        void missingChallengeIsIndistinguishable() {
            when(challengeRepository.findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                    USER_ID, AdminChallengePurpose.LOGIN)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.consume(admin, AdminChallengePurpose.LOGIN, "123456"))
                    .hasMessage(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("código de tamanho diferente é recusado sem estourar")
        void codeOfDifferentLengthIsRejected() {
            AdminChallenge d = desafio("123456", LocalDateTime.now().plusMinutes(10), 0);
            desafioVigente(d);

            // A comparação em tempo constante percorre índices; sem a checagem de
            // tamanho, um código curto sairia por StringIndexOutOfBounds.
            assertThatThrownBy(() -> service.consume(admin, AdminChallengePurpose.LOGIN, "12"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage(AdminTwoFactorService.CODIGO_INVALIDO);
        }

        @Test
        @DisplayName("desafios de finalidades diferentes não se confundem")
        void purposesAreIsolated() {
            AdminChallenge trocaDeSenha = AdminChallenge.builder()
                    .id(UUID.randomUUID()).userId(USER_ID)
                    .purpose(AdminChallengePurpose.PASSWORD_CHANGE)
                    .code("999999").expiresAt(LocalDateTime.now().plusMinutes(10)).build();

            when(challengeRepository.findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                    USER_ID, AdminChallengePurpose.PASSWORD_CHANGE)).thenReturn(Optional.of(trocaDeSenha));

            // O código da troca de senha não pode servir de chave para o login.
            AdminChallenge confirmado = service.consume(
                    admin, AdminChallengePurpose.PASSWORD_CHANGE, "999999");
            assertThat(confirmado.getPurpose()).isEqualTo(AdminChallengePurpose.PASSWORD_CHANGE);
        }
    }
}
