package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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

    // ── IP da requisição ──────────────────────────────────────────────────────

    /** Põe uma requisição no contexto com o IP informado via X-Forwarded-For. */
    private static void requisicaoDe(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", ip);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void limparContexto() {
        // O contexto é estático (ThreadLocal): sem limpar, um teste contamina o próximo.
        RequestContextHolder.resetRequestAttributes();
    }

    /**
     * O bloqueio por e-mail sozinho transformava a defesa em arma: 5 requisições com
     * senha errada trancavam a conta de quem o atacante quisesse, de graça e para
     * sempre. O par (e-mail, IP) é o que separa "alguém tentando adivinhar esta senha
     * daqui" de "a conta desta pessoa".
     */
    @Nested
    @DisplayName("Bloqueio por par (e-mail, IP)")
    class PorIp {

        @Test
        @DisplayName("estourar de um IP não tranca o dono, que vem de outro")
        void oneIpDoesNotLockTheOwnerOut() {
            requisicaoDe("203.0.113.10");
            for (int i = 0; i < MAX_ATTEMPTS; i++) {
                limiter.recordFailure(EMAIL);
            }

            // O dono, de outro endereço, continua conseguindo tentar.
            requisicaoDe("198.51.100.7");
            assertThatCode(() -> limiter.checkNotBlocked(EMAIL)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("o IP que estourou continua bloqueado")
        void theOffendingIpStaysBlocked() {
            requisicaoDe("203.0.113.10");
            for (int i = 0; i < MAX_ATTEMPTS; i++) {
                limiter.recordFailure(EMAIL);
            }

            assertThatThrownBy(() -> limiter.checkNotBlocked(EMAIL))
                    .isInstanceOf(TooManyAttemptsException.class);
        }

        @Test
        @DisplayName("IP forjado que não é endereço cai no IP da conexão")
        void nonIpHeaderFallsBackToRemoteAddr() {
            // Sem a validação, cada string inventada no header daria um balde novo
            // e o teto por IP deixaria de existir para quem soubesse disso.
            for (int i = 0; i < MAX_ATTEMPTS; i++) {
                requisicaoDe("chave-inventada-" + i);
                limiter.recordFailure(EMAIL);
            }

            requisicaoDe("outra-string-qualquer");
            assertThatThrownBy(() -> limiter.checkNotBlocked(EMAIL))
                    .isInstanceOf(TooManyAttemptsException.class);
        }
    }

    /**
     * A rede de segurança: sem um teto por e-mail, rotacionar IP daria tentativas
     * ilimitadas contra uma única conta.
     */
    @Nested
    @DisplayName("Teto por e-mail somando todos os IPs")
    class PorEmail {

        @Test
        @DisplayName("distribuir por muitos IPs ainda esbarra no teto do e-mail")
        void spreadingAcrossIpsStillHitsTheEmailCap() {
            for (int i = 0; i < LoginAttemptLimiter.MAX_POR_EMAIL; i++) {
                requisicaoDe("203.0.113." + (i % 250));
                limiter.recordFailure(EMAIL);
            }

            requisicaoDe("198.51.100.200");
            assertThatThrownBy(() -> limiter.checkNotBlocked(EMAIL))
                    .isInstanceOf(TooManyAttemptsException.class);
        }

        @Test
        @DisplayName("abaixo do teto do e-mail, um IP novo ainda passa")
        void belowTheEmailCapAFreshIpStillPasses() {
            for (int i = 0; i < LoginAttemptLimiter.MAX_POR_EMAIL - 1; i++) {
                requisicaoDe("203.0.113." + (i % 250));
                limiter.recordFailure(EMAIL);
            }

            requisicaoDe("198.51.100.200");
            assertThatCode(() -> limiter.checkNotBlocked(EMAIL)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("o teto por e-mail não contamina outra conta")
        void theEmailCapDoesNotLeakToAnotherAccount() {
            for (int i = 0; i < LoginAttemptLimiter.MAX_POR_EMAIL; i++) {
                requisicaoDe("203.0.113." + (i % 250));
                limiter.recordFailure(EMAIL);
            }

            requisicaoDe("198.51.100.200");
            assertThatCode(() -> limiter.checkNotBlocked("outro@exemplo.com"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("login bem-sucedido zera também o teto por e-mail")
        void resetAlsoClearsTheEmailCap() {
            for (int i = 0; i < LoginAttemptLimiter.MAX_POR_EMAIL; i++) {
                requisicaoDe("203.0.113." + (i % 250));
                limiter.recordFailure(EMAIL);
            }

            // Chegar ao reset exigiu a senha correta, que o atacante não forja.
            requisicaoDe("198.51.100.200");
            limiter.reset(EMAIL);

            requisicaoDe("198.51.100.201");
            assertThatCode(() -> limiter.checkNotBlocked(EMAIL)).doesNotThrowAnyException();
        }
    }
}
