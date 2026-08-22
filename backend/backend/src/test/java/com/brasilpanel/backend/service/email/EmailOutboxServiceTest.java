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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * A fila contra o banco de verdade (H2 com o schema das migrations), e não contra
 * mocks: é o que prova que a V4 sobe, que a consulta do drain casa com o índice e
 * que o expurgo por status funciona no dialeto.
 *
 * <p>Só o {@link EmailService} é mockado — não há SMTP no CI.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EmailOutboxServiceTest {

    private static final String EMAIL = "fila@exemplo.com";

    @Autowired private EmailOutboxService outboxService;
    @Autowired private EmailOutboxRepository outboxRepository;
    @Autowired private UserRepository userRepository;

    @MockitoBean private EmailService emailService;

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
        userRepository.findByEmail(EMAIL).ifPresent(userRepository::delete);

        userRepository.save(UserEntity.builder()
                .name("Usuário Fila").email(EMAIL).password("hash").role(Role.USER)
                .verified(false).verificationCode("654321")
                .verificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15))
                .build());
    }

    @Test
    @DisplayName("enfileirar grava uma entrada PENDING sem tocar no SMTP")
    void enfileirarNaoEnvia() {
        outboxService.enqueueVerificationCode(EMAIL);

        assertThat(outboxService.pendentes()).isEqualTo(1);
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("o drain envia o pendente e o tira da fila")
    void drainEnvia() {
        outboxService.enqueueVerificationCode(EMAIL);

        assertThat(outboxService.drain()).isEqualTo(1);

        verify(emailService).sendVerificationCode(EMAIL, "654321");
        assertThat(outboxService.pendentes()).isZero();
        assertThat(outboxRepository.findAll().getFirst().getStatus())
                .isEqualTo(EmailOutboxStatus.SENT);
    }

    @Test
    @DisplayName("fila vazia não chama o SMTP nem quebra")
    void drainVazio() {
        assertThat(outboxService.drain()).isZero();
        verifyNoInteractions(emailService);
    }

    /**
     * O backoff é o que impede a fila de virar um laço apertado contra um SMTP fora
     * do ar: enquanto next_attempt_at estiver no futuro, o drain nem enxerga a linha.
     */
    @Test
    @DisplayName("entrada agendada para o futuro não entra no lote")
    void respeitaOBackoff() {
        outboxRepository.save(EmailOutboxEntry.builder()
                .recipient(EMAIL)
                .emailType(EmailType.VERIFICATION_CODE)
                .status(EmailOutboxStatus.PENDING)
                .nextAttemptAt(LocalDateTime.now().plusMinutes(30))
                .build());

        assertThat(outboxService.drain()).isZero();
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("falha no SMTP mantém a entrada na fila para nova tentativa")
    void falhaMantemNaFila() {
        doThrow(new RuntimeException("SMTP indisponível"))
                .when(emailService).sendVerificationCode(anyString(), anyString());

        outboxService.enqueueVerificationCode(EMAIL);

        assertThat(outboxService.drain()).isZero();

        EmailOutboxEntry entrada = outboxRepository.findAll().getFirst();
        assertThat(entrada.getStatus()).isEqualTo(EmailOutboxStatus.PENDING);
        assertThat(entrada.getAttempts()).isEqualTo(1);
        assertThat(entrada.getLastError()).contains("SMTP indisponível");
    }

    @Test
    @DisplayName("expurgo remove as concluídas antigas e preserva as pendentes")
    void expurgo() {
        EmailOutboxEntry antiga = outboxRepository.save(EmailOutboxEntry.builder()
                .recipient(EMAIL).emailType(EmailType.VERIFICATION_CODE)
                .status(EmailOutboxStatus.PENDING)
                .nextAttemptAt(LocalDateTime.now())
                .build());
        antiga.markSent();
        // completedAt fica no passado, fora da janela de retenção.
        org.springframework.test.util.ReflectionTestUtils.setField(
                antiga, "completedAt", LocalDateTime.now().minusDays(10));
        outboxRepository.save(antiga);

        outboxService.enqueueVerificationCode(EMAIL);

        assertThat(outboxService.prune(3, 30)).isEqualTo(1);

        List<EmailOutboxEntry> restantes = outboxRepository.findAll();
        assertThat(restantes).hasSize(1);
        assertThat(restantes.getFirst().getStatus()).isEqualTo(EmailOutboxStatus.PENDING);
    }
}
