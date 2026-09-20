package com.brasilpanel.backend.service.email;

import com.brasilpanel.backend.model.EmailType;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.email.EmailOutboxRepository;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * O envio deixou de depender da varredura.
 *
 * <p>Antes, a fila era varrida a cada 10 segundos para o código de verificação não
 * demorar. Isso custava uma consulta ao banco a cada 10 segundos, o dia inteiro — e
 * o Neon cobra por tempo com o banco acordado, suspendendo só após 5 minutos ocioso.
 * A varredura curta impedia qualquer suspensão.
 *
 * <p>Com o evento, enfileirar dispara o envio na hora e a varredura vira rede de
 * segurança rara. Estes testes garantem que o evento é publicado — sem ele, o usuário
 * esperaria até uma hora pelo código.
 */
@SpringBootTest
@ActiveProfiles("test")
@RecordApplicationEvents
@Transactional
class EmailOutboxEventTest {

    private static final String EMAIL = "evento@exemplo.com";

    @Autowired private EmailOutboxService outboxService;
    @Autowired private EmailOutboxRepository outboxRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ApplicationEvents eventos;

    @MockitoBean private EmailService emailService;

    @Value("${app.mail.outbox.drain-cron}") private String drainCron;
    @Value("${app.scheduler.cmc-cron}") private String cmcCron;
    @Value("${app.scheduler.crypto-cron}") private String cryptoCron;

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
        userRepository.findByEmail(EMAIL).ifPresent(userRepository::delete);
        userRepository.save(UserEntity.builder()
                .name("Usuário Evento").email(EMAIL).password("hash").role(Role.USER)
                .verified(false).verificationCode("123456")
                .verificationCodeExpiresAt(LocalDateTime.now().plusMinutes(15))
                .build());
    }

    private long eventosPublicados() {
        return eventos.stream(EmailEnqueuedEvent.class).count();
    }

    @Test
    @DisplayName("enfileirar código de verificação publica o evento de drain")
    void verificationCodePublishesTheEvent() {
        outboxService.enqueueVerificationCode(EMAIL);

        assertThat(eventosPublicados()).isEqualTo(1);
    }

    @Test
    @DisplayName("enfileirar desafio publica o evento de drain")
    void authChallengePublishesTheEvent() {
        outboxService.enqueueAuthChallenge(EMAIL, UUID.randomUUID(), EmailType.PASSWORD_RESET_CODE);

        assertThat(eventosPublicados()).isEqualTo(1);
    }

    @Test
    @DisplayName("cada enfileiramento publica o seu evento")
    void eachEnqueuePublishesItsOwnEvent() {
        outboxService.enqueueVerificationCode(EMAIL);
        outboxService.enqueueVerificationCode(EMAIL);

        assertThat(eventosPublicados()).isEqualTo(2);
    }

    /**
     * A trava que protege a economia inteira.
     *
     * <p>Qualquer intervalo MENOR que os 5 minutos de ociosidade do Neon impede a
     * suspensão do compute e traz de volta a conta alta — inclusive uma varredura
     * "de 1 minuto", que parece inofensiva. Se alguém encurtar um destes padrões sem
     * saber disso, é aqui que descobre.
     */
    @Test
    @DisplayName("os três agendamentos padrão são de hora em hora e alinhados")
    void defaultSchedulesAreHourlyAndAligned() {
        assertThat(drainCron).isEqualTo("0 0 * * * *");
        assertThat(cmcCron).isEqualTo("0 0 * * * *");
        assertThat(cryptoCron).isEqualTo("0 0 * * * *");
    }
}
