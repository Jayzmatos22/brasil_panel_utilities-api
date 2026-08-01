package com.brasilpanel.backend.config.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Aplica o teto de requisições às rotas de dados.
 *
 * <p>Existe porque as rotas sob {@code /api/**} são públicas e várias delas
 * consomem cota de API externa paga (CoinMarketCap, AlphaVantage, Metals). Sem
 * teto, um laço trivial esgota o orçamento do mês — e, no caso da CoinMarketCap,
 * derruba junto o scheduler que reabastece o painel.
 */
@Component
@ConditionalOnProperty(prefix = "app.rate-limit", name = "enabled",
                       havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String PROTECTED_PREFIX = "/api/";

    /** Corpo de erro fixo: nada da requisição é ecoado de volta. */
    private static final String BODY_429 =
            "{\"error\":\"Muitas requisições. Aguarde um minuto e tente novamente.\"}";

    private final ApiRateLimiter rateLimiter;

    /**
     * Fora de {@code /api/**} o filtro não roda. O health check precisa responder
     * ao orquestrador sem competir com tráfego de usuário pelo mesmo teto.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PROTECTED_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String client = clientId(request);

        if (rateLimiter.tryConsume(client)) {
            chain.doFilter(request, response);
            return;
        }

        log.warn("[RateLimit] {} excedeu o teto em {} {}",
                client, request.getMethod(), request.getRequestURI());

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(rateLimiter.retryAfterSeconds()));
        response.getWriter().write(BODY_429);
    }

    /**
     * Identifica o cliente pelo primeiro IP de {@code X-Forwarded-For}, caindo
     * para o endereço da conexão quando o header não existe.
     *
     * <p>Ler o header não é opcional: em produção a aplicação fica atrás do proxy
     * do Render, e {@code getRemoteAddr()} devolveria o IP do proxy para todo
     * mundo — o teto viraria global e o primeiro usuário a carregar o painel
     * bloquearia todos os outros.
     *
     * <p>O header é forjável, e isso é aceito conscientemente: quem forja engana
     * apenas o próprio limite, sem afetar terceiros. O contrário — confiar no
     * {@code getRemoteAddr()} — quebraria o serviço para usuários legítimos.
     */
    private static String clientId(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            String first = comma > 0 ? forwarded.substring(0, comma) : forwarded;
            return first.trim();
        }
        return request.getRemoteAddr();
    }
}