package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.email.EmailOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

/**
 * O scheduler é {@code @Profile("!test")}, então não roda sozinho durante os testes —
 * antes disso ele disparava no meio das suítes lentas e a cobertura variava conforme o
 * tempo de execução. A lógica dele é exercitada aqui, diretamente.
 */
@ExtendWith(MockitoExtension.class)
class EmailOutboxSchedulerTest {

    @Mock private EmailOutboxService outboxService;

    @InjectMocks private EmailOutboxScheduler scheduler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(scheduler, "retencaoEnviadas", 3);
        ReflectionTestUtils.setField(scheduler, "retencaoFalhas", 30);
    }

    @Test
    @DisplayName("a rodada delega o envio para a fila")
    void rodadaChamaODrain() {
        scheduler.drenarFila();

        verify(outboxService).drain();
    }

    /**
     * Sem o catch, uma exceção que escape do drain faz o Spring CANCELAR o
     * agendamento: a fila pararia para sempre, em silêncio, a partir do primeiro
     * erro inesperado — e o sintoma seria "os e-mails simplesmente não saem mais".
     */
    @Test
    @DisplayName("rodada que estoura não derruba o agendamento")
    void falhaNaRodadaNaoPropaga() {
        when(outboxService.drain()).thenThrow(new RuntimeException("banco fora do ar"));

        assertThatCode(() -> scheduler.drenarFila()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a rodada seguinte continua acontecendo após uma falha")
    void rodadaSeguinteAcontece() {
        when(outboxService.drain())
                .thenThrow(new RuntimeException("falha transitória"))
                .thenReturn(1);

        scheduler.drenarFila();
        scheduler.drenarFila();

        verify(outboxService, times(2)).drain();
    }

    @Test
    @DisplayName("o expurgo usa as janelas de retenção configuradas")
    void expurgoUsaAsJanelas() {
        when(outboxService.prune(3, 30)).thenReturn(5);

        scheduler.expurgarConcluidas();

        verify(outboxService).prune(3, 30);
    }
}
