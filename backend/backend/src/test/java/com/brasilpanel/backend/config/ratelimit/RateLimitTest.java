package com.brasilpanel.backend.config.ratelimit;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * IPs de documentação (RFC 5737) — nenhum endereço real.
 */
class RateLimitTest {

    private static final String IP_A = "203.0.113.7";
    private static final String IP_B = "198.51.100.4";

    /** Tetos de e-mail folgados: os testes desta fábrica exercitam só as rotas de dados. */
    private static ApiRateLimiter limiter(int rpm, boolean enabled) {
        return new ApiRateLimiter(new RateLimitProperties(enabled, rpm, 10_000, 1_000, 1_000));
    }

    private static ApiRateLimiter emailLimiter(int porCliente, int global) {
        return new ApiRateLimiter(new RateLimitProperties(true, 10_000, 10_000, porCliente, global));
    }

    @Nested
    @DisplayName("Contagem")
    class Contagem {

        @Test
        @DisplayName("libera até o teto e bloqueia a partir da requisição seguinte")
        void bloqueiaAposOTeto() {
            ApiRateLimiter limiter = limiter(3, true);

            assertThat(limiter.tryConsume(IP_A)).isTrue();
            assertThat(limiter.tryConsume(IP_A)).isTrue();
            assertThat(limiter.tryConsume(IP_A)).isTrue();
            assertThat(limiter.tryConsume(IP_A))
                    .as("quarta requisição com teto de 3")
                    .isFalse();
        }

        @Test
        @DisplayName("o teto de um cliente não afeta os demais")
        void contagemEIsoladaPorCliente() {
            ApiRateLimiter limiter = limiter(2, true);

            limiter.tryConsume(IP_A);
            limiter.tryConsume(IP_A);
            assertThat(limiter.tryConsume(IP_A)).isFalse();

            assertThat(limiter.tryConsume(IP_B))
                    .as("IP_B não gastou nada do próprio teto")
                    .isTrue();
        }

        @Test
        @DisplayName("desligado, nada é contado nem bloqueado")
        void desligado_liberaTudo() {
            ApiRateLimiter limiter = limiter(1, false);

            for (int i = 0; i < 50; i++) {
                assertThat(limiter.tryConsume(IP_A)).isTrue();
            }
            assertThat(limiter.currentHits(IP_A)).isZero();
        }

        @Test
        @DisplayName("cliente nulo cai num balde próprio em vez de estourar")
        void clienteNulo_naoQuebra() {
            ApiRateLimiter limiter = limiter(1, true);

            assertThat(limiter.tryConsume(null)).isTrue();
            assertThat(limiter.tryConsume(null)).isFalse();
        }

        @Test
        @DisplayName("configuração inválida é rejeitada na construção")
        void configuracaoInvalida_falhaRapido() {
            org.assertj.core.api.Assertions
                    .assertThatThrownBy(() -> new RateLimitProperties(true, 0, 10, 5, 60))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("requests-per-minute");
        }

        @Test
        @DisplayName("teto de e-mail inválido também é rejeitado na construção")
        void tetoDeEmailInvalido_falhaRapido() {
            org.assertj.core.api.Assertions
                    .assertThatThrownBy(() -> new RateLimitProperties(true, 120, 10, 0, 60))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("emails-per-hour");
        }
    }

    @Nested
    @DisplayName("Filtro HTTP")
    class Filtro {

        private MockHttpServletRequest request(String uri, String forwardedFor) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", uri);
            req.setRequestURI(uri);
            req.setRemoteAddr("10.0.0.1");   // o proxy, em produção
            if (forwardedFor != null) {
                req.addHeader("X-Forwarded-For", forwardedFor);
            }
            return req;
        }

        @Test
        @DisplayName("passa a requisição adiante enquanto há folga")
        void dentroDoTeto_segueACadeia() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(limiter(10, true));
            FilterChain chain = mock(FilterChain.class);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request("/api/coinmarketcap", IP_A), response, chain);

            verify(chain).doFilter(any(), any());
            assertThat(response.getStatus()).isEqualTo(200);
        }

        @Test
        @DisplayName("estourado o teto, responde 429 com Retry-After e não chama a cadeia")
        void acimaDoTeto_responde429() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(limiter(1, true));
            FilterChain chain = mock(FilterChain.class);

            filter.doFilter(request("/api/coinmarketcap", IP_A), new MockHttpServletResponse(), chain);

            MockHttpServletResponse bloqueada = new MockHttpServletResponse();
            filter.doFilter(request("/api/coinmarketcap", IP_A), bloqueada, chain);

            assertThat(bloqueada.getStatus()).isEqualTo(429);
            assertThat(bloqueada.getHeader("Retry-After")).isEqualTo("60");
            assertThat(bloqueada.getContentAsString()).contains("Muitas requisições");
            verify(chain, times(1)).doFilter(any(), any());   // só a primeira passou
        }

        @Test
        @DisplayName("rotas fora de /api/ não são limitadas — inclusive o health check")
        void foraDeApi_naoLimita() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(limiter(1, true));
            FilterChain chain = mock(FilterChain.class);

            for (int i = 0; i < 5; i++) {
                filter.doFilter(request("/actuator/health", IP_A), new MockHttpServletResponse(), chain);
            }

            verify(chain, times(5)).doFilter(any(), any());
        }

        /**
         * Atrás do proxy do Render, getRemoteAddr() é o mesmo para todo mundo. Se
         * o filtro usasse esse endereço, o teto viraria global e o primeiro usuário
         * a carregar o painel bloquearia todos os outros.
         */
        @Test
        @DisplayName("distingue clientes por X-Forwarded-For, e não pelo IP do proxy")
        void clientesAtrasDoMesmoProxy_naoCompartilhamOTeto() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(limiter(1, true));
            FilterChain chain = mock(FilterChain.class);

            filter.doFilter(request("/api/bcb", IP_A), new MockHttpServletResponse(), chain);

            MockHttpServletResponse outroCliente = new MockHttpServletResponse();
            filter.doFilter(request("/api/bcb", IP_B), outroCliente, chain);

            assertThat(outroCliente.getStatus())
                    .as("IP_B não pode pagar pelo consumo de IP_A")
                    .isEqualTo(200);
            verify(chain, times(2)).doFilter(any(), any());
        }

        @Test
        @DisplayName("usa o primeiro IP da cadeia de X-Forwarded-For")
        void xForwardedForComVariosIps_usaOPrimeiro() throws Exception {
            ApiRateLimiter limiter = limiter(10, true);
            RateLimitFilter filter = new RateLimitFilter(limiter);

            filter.doFilter(request("/api/bcb", IP_A + ", 70.41.3.18, 150.172.238.178"),
                    new MockHttpServletResponse(), mock(FilterChain.class));

            assertThat(limiter.currentHits(IP_A)).isEqualTo(1);
        }

        @Test
        @DisplayName("sem X-Forwarded-For, cai para o endereço da conexão")
        void semHeader_usaRemoteAddr() throws Exception {
            ApiRateLimiter limiter = limiter(10, true);
            RateLimitFilter filter = new RateLimitFilter(limiter);

            filter.doFilter(request("/api/bcb", null), new MockHttpServletResponse(),
                    mock(FilterChain.class));

            assertThat(limiter.currentHits("10.0.0.1")).isEqualTo(1);
        }
    }

    /**
     * As rotas que disparam e-mail ficavam só sob o teto genérico de 120/min — 120
     * mensagens por minuto para endereços de terceiros a partir de um cliente só.
     */
    @Nested
    @DisplayName("Rotas que disparam e-mail")
    class Email {

        private MockHttpServletRequest post(String uri, String forwardedFor) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", uri);
            req.setRequestURI(uri);
            req.setRemoteAddr("10.0.0.1");
            req.addHeader("X-Forwarded-For", forwardedFor);
            return req;
        }

        @Test
        @DisplayName("/register estoura no teto por cliente, com Retry-After de uma hora")
        void register_estouraNoTetoPorCliente() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(emailLimiter(2, 100));
            FilterChain chain = mock(FilterChain.class);

            filter.doFilter(post("/api/auth/register", IP_A), new MockHttpServletResponse(), chain);
            filter.doFilter(post("/api/auth/register", IP_A), new MockHttpServletResponse(), chain);

            MockHttpServletResponse bloqueada = new MockHttpServletResponse();
            filter.doFilter(post("/api/auth/register", IP_A), bloqueada, chain);

            assertThat(bloqueada.getStatus()).isEqualTo(429);
            assertThat(bloqueada.getHeader("Retry-After")).isEqualTo("3600");
            assertThat(bloqueada.getContentAsString()).contains("solicitações de e-mail");
            verify(chain, times(2)).doFilter(any(), any());
        }

        @Test
        @DisplayName("/resend-code compartilha o mesmo teto do /register")
        void resendCode_temOMesmoTeto() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(emailLimiter(1, 100));
            FilterChain chain = mock(FilterChain.class);

            filter.doFilter(post("/api/auth/register", IP_A), new MockHttpServletResponse(), chain);

            MockHttpServletResponse bloqueada = new MockHttpServletResponse();
            filter.doFilter(post("/api/auth/resend-code", IP_A), bloqueada, chain);

            assertThat(bloqueada.getStatus()).isEqualTo(429);
            verify(chain, times(1)).doFilter(any(), any());
        }

        /**
         * O X-Forwarded-For é forjável nesta topologia, então o teto por cliente sozinho
         * não segura quem varia o header a cada requisição — e é a cota do provedor de
         * e-mail que está em jogo. O teto global não depende de identidade nenhuma.
         */
        @Test
        @DisplayName("teto global segura quem troca de X-Forwarded-For a cada requisição")
        void tetoGlobal_naoDependeDeIdentidade() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(emailLimiter(1_000, 3));
            FilterChain chain = mock(FilterChain.class);

            for (int i = 0; i < 3; i++) {
                filter.doFilter(post("/api/auth/register", "203.0.113." + i),
                        new MockHttpServletResponse(), chain);
            }

            MockHttpServletResponse bloqueada = new MockHttpServletResponse();
            filter.doFilter(post("/api/auth/register", "203.0.113.99"), bloqueada, chain);

            assertThat(bloqueada.getStatus())
                    .as("IP novo, mas o teto global da instância já estourou")
                    .isEqualTo(429);
            verify(chain, times(3)).doFilter(any(), any());
        }

        @Test
        @DisplayName("/login não entra no teto de e-mail — não envia nada")
        void login_ficaForaDoTetoDeEmail() throws Exception {
            RateLimitFilter filter = new RateLimitFilter(emailLimiter(1, 1));
            FilterChain chain = mock(FilterChain.class);

            for (int i = 0; i < 5; i++) {
                filter.doFilter(post("/api/auth/login", IP_A), new MockHttpServletResponse(), chain);
            }

            verify(chain, times(5)).doFilter(any(), any());
        }

        @Test
        @DisplayName("GET no caminho de e-mail não consome o teto de envio")
        void metodoDiferenteDePost_naoConsome() throws Exception {
            ApiRateLimiter limiter = emailLimiter(1, 1);
            RateLimitFilter filter = new RateLimitFilter(limiter);
            FilterChain chain = mock(FilterChain.class);

            MockHttpServletRequest get = new MockHttpServletRequest("GET", "/api/auth/register");
            get.setRequestURI("/api/auth/register");
            get.addHeader("X-Forwarded-For", IP_A);

            filter.doFilter(get, new MockHttpServletResponse(), chain);
            filter.doFilter(post("/api/auth/register", IP_A), new MockHttpServletResponse(), chain);

            verify(chain, times(2)).doFilter(any(), any());
        }
    }
}
