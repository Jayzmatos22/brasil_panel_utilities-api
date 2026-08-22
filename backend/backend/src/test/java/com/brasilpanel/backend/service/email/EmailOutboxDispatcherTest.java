package com.brasilpanel.backend.service.email;

import com.brasilpanel.backend.model.EmailOutboxEntry;
import com.brasilpanel.backend.model.EmailOutboxStatus;
import com.brasilpanel.backend.model.EmailType;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.email.EmailOutboxRepository;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailOutboxDispatcherTest {

    private static final String EMAIL = "usuario@exemplo.com";
    private static final String CODIGO = "123456";
    private static final int MAX_TENTATIVAS = 3;

    @Mock private EmailOutboxRepository outboxRepository;
    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;

    @InjectMocks private EmailOutboxDispatcher dispatcher;

    private EmailOutboxEntry entrada;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(dispatcher, "maxAttempts", MAX_TENTATIVAS);
        ReflectionTestUtils.setField(dispatcher, "retryBackoff", Duration.ofMinutes(1));

        entrada = EmailOutboxEntry.builder()
                .id(UUID.randomUUID())
                .recipient(EMAIL)
                .emailType(EmailType.VERIFICATION_CODE)
                .status(EmailOutboxStatus.PENDING)
                .nextAttemptAt(LocalDateTime.now())
                .build();

        when(outboxRepository.findById(entrada.getId())).thenReturn(Optional.of(entrada));
    }

    private static UserEntity usuario(boolean verificado, String codigo) {
        return UserEntity.builder()
                .name("Usuário Teste").email(EMAIL).password("hash").role(Role.USER)
                .verified(verificado).verificationCode(codigo)
                .build();
    }

    @Nested
    @DisplayName("Envio bem-sucedido")
    class Sucesso {

        /**
         * O código sai de users, não da fila — a entrada guarda só a intenção de
         * enviar. Isso evita duplicar o segredo numa segunda tabela e faz um reenvio
         * pedido antes do drain entregar o código vigente, não o antigo.
         */
        @Test
        @DisplayName("busca o código vigente no usuário e marca a entrada como SENT")
        void enviaComOCodigoVigente() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(false, CODIGO)));

            assertThat(dispatcher.processar(entrada.getId())).isTrue();

            verify(emailService).sendVerificationCode(EMAIL, CODIGO);
            assertThat(entrada.getStatus()).isEqualTo(EmailOutboxStatus.SENT);
            assertThat(entrada.getAttempts()).isEqualTo(1);
            assertThat(entrada.getCompletedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Entradas que deixaram de fazer sentido")
    class Obsoletas {

        @Test
        @DisplayName("conta já verificada não recebe e-mail")
        void contaJaVerificada() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(true, null)));

            assertThat(dispatcher.processar(entrada.getId())).isFalse();

            verify(emailService, never()).sendVerificationCode(anyString(), anyString());
            assertThat(entrada.getStatus()).isEqualTo(EmailOutboxStatus.OBSOLETE);
        }

        @Test
        @DisplayName("conta removida não recebe e-mail")
        void contaRemovida() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            assertThat(dispatcher.processar(entrada.getId())).isFalse();

            verify(emailService, never()).sendVerificationCode(anyString(), anyString());
            assertThat(entrada.getStatus()).isEqualTo(EmailOutboxStatus.OBSOLETE);
        }

        @Test
        @DisplayName("entrada que já saiu de PENDING é ignorada")
        void entradaJaProcessada() {
            entrada.markSent();

            assertThat(dispatcher.processar(entrada.getId())).isFalse();

            verify(emailService, never()).sendVerificationCode(anyString(), anyString());
            verifyNoInteractions(userRepository);
        }
    }

    @Nested
    @DisplayName("Falha e retry")
    class Retry {

        @BeforeEach
        void smtpQuebrado() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(false, CODIGO)));
            doThrow(new RuntimeException("SMTP fora do ar"))
                    .when(emailService).sendVerificationCode(anyString(), anyString());
        }

        @Test
        @DisplayName("falha volta para PENDING com a próxima tentativa no futuro")
        void falhaAgendaNovaTentativa() {
            assertThat(dispatcher.processar(entrada.getId())).isFalse();

            assertThat(entrada.getStatus()).isEqualTo(EmailOutboxStatus.PENDING);
            assertThat(entrada.getAttempts()).isEqualTo(1);
            assertThat(entrada.getNextAttemptAt()).isAfter(LocalDateTime.now());
            assertThat(entrada.getCompletedAt()).isNull();
        }

        @Test
        @DisplayName("esgotadas as tentativas, encerra em FAILED e para de tentar")
        void desisteAposOTeto() {
            for (int i = 0; i < MAX_TENTATIVAS; i++) {
                assertThat(dispatcher.processar(entrada.getId())).isFalse();
            }

            assertThat(entrada.getStatus()).isEqualTo(EmailOutboxStatus.FAILED);
            assertThat(entrada.getAttempts()).isEqualTo(MAX_TENTATIVAS);
            assertThat(entrada.getCompletedAt())
                    .as("terminal, então entra no expurgo")
                    .isNotNull();

            // Uma rodada a mais não tenta de novo: já saiu de PENDING.
            dispatcher.processar(entrada.getId());
            verify(emailService, times(MAX_TENTATIVAS))
                    .sendVerificationCode(anyString(), anyString());
        }

        /**
         * O detalhe da falha de SMTP pode citar host e credencial. Fica no banco para
         * diagnóstico e no log do servidor — nunca numa resposta ao cliente.
         */
        @Test
        @DisplayName("o motivo da falha é registrado na entrada")
        void registraOMotivo() {
            dispatcher.processar(entrada.getId());

            assertThat(entrada.getLastError()).contains("SMTP fora do ar");
        }
    }
}
