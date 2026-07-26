package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Não usa mocks: o limitador não tem colaboradores, todo o estado é interno.
 * Mockar aqui só acrescentaria ruído.
 */
class LoginAttemptLimiterTest {

    private static final String EMAIL = "usuario@exemplo.com";
    private static final int MAX_ATTEMPTS = 5;

    private LoginAttemptLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new LoginAttemptLimiter();
    }

    @Test
    @DisplayName("permite a tentativa quando não há falhas registradas")
    void allowsWhenNoFailures() {
        assertThatCode(() -> limiter.checkNotBlocked(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("permite até o limite de tentativas")
    void allowsUpToTheLimit() {
        for (int i = 0; i < MAX_ATTEMPTS - 1; i++) {
            limiter.recordFailure(EMAIL);
        }

        assertThatCode(() -> limiter.checkNotBlocked(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("bloqueia ao atingir o limite")
    void blocksAtTheLimit() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.recordFailure(EMAIL);
        }

        assertThatThrownBy(() -> limiter.checkNotBlocked(EMAIL))
                .isInstanceOf(TooManyAttemptsException.class)
                .hasMessageContaining("Muitas tentativas");
    }

    @Test
    @DisplayName("login bem-sucedido zera o contador")
    void resetClearsTheCounter() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.recordFailure(EMAIL);
        }
        limiter.reset(EMAIL);

        assertThatCode(() -> limiter.checkNotBlocked(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("variar a caixa do e-mail não burla o limite")
    void normalizesEmailCase() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.recordFailure("Usuario@Exemplo.com");
        }

        // Sem normalização, este e-mail seria tratado como outra conta.
        assertThatThrownBy(() -> limiter.checkNotBlocked("  USUARIO@EXEMPLO.COM  "))
                .isInstanceOf(TooManyAttemptsException.class);
    }

    @Test
    @DisplayName("contadores são independentes por e-mail")
    void countersAreIndependentPerEmail() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            limiter.recordFailure(EMAIL);
        }

        assertThatCode(() -> limiter.checkNotBlocked("outro@exemplo.com"))
                .doesNotThrowAnyException();
    }
}