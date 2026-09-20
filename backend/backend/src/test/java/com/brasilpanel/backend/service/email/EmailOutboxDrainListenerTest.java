package com.brasilpanel.backend.service.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

/**
 * O listener é a metade do caminho novo: o evento só vale se alguém o transformar
 * em envio.
 */
class EmailOutboxDrainListenerTest {

    private EmailOutboxService outboxService;
    private EmailOutboxDrainListener listener;

    @BeforeEach
    void setUp() {
        outboxService = mock(EmailOutboxService.class);
        listener = new EmailOutboxDrainListener(outboxService);
    }

    @Test
    @DisplayName("o evento dispara o drain")
    void theEventTriggersTheDrain() {
        listener.aoEnfileirar(new EmailEnqueuedEvent());

        verify(outboxService).drain();
    }

    /**
     * Um drain que estoura não pode derrubar nada: ele roda depois do commit, numa
     * thread própria, então a exceção não teria para onde subir a não ser o log. E a
     * entrada continua PENDING no banco — a varredura periódica a pega depois.
     */
    @Test
    @DisplayName("falha no drain não escapa do listener")
    void aFailingDrainDoesNotEscape() {
        when(outboxService.drain()).thenThrow(new RuntimeException("SMTP fora do ar"));

        assertThatCode(() -> listener.aoEnfileirar(new EmailEnqueuedEvent()))
                .doesNotThrowAnyException();
    }
}
