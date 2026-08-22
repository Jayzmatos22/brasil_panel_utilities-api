package com.brasilpanel.backend.config.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Aplica o teto de requisições às rotas de dados.
 *
 * <p>Existe porque as rotas sob {@code /api/**} são públicas e várias delas
 * consomem cota de API externa paga (CoinMarketCap, AlphaVantage, Metals). Sem
 * teto, um laço trivial esgota o orçamento do mês — e, no caso da CoinMarketCap,
 * derruba junto o scheduler que reabastece o painel.
 *
 * <p>Duas rotas têm teto próprio, muito mais apertado: as que disparam e-mail.
 * Ver {@link #EMAIL_PATHS}.
 */
@Component
@ConditionalOnProperty(prefix = "app.rate-limit", name = "enabled",
                       havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String PROTECTED_PREFIX = "/api/";

    /**
     * Rotas que enviam e-mail para um endereço fornecido na requisição.
     *
     * <p>Ficavam só sob o teto genérico de 120/min, o que permitia 120 mensagens por
     * minuto a partir de um único cliente: queima a cota do provedor de SMTP e usa o
     * serviço como amplificador de e-mail para endereços de terceiros. O login não
     * entra na lista — não envia nada e já tem o LoginAttemptLimiter por e-mail.
     */
    private static final Set<String> EMAIL_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/resend-code");

    /** Corpo de erro fixo: nada da requisição é ecoado de volta. */
    private static final String BODY_429 =
            "{\"error\":\"Muitas requisições. Aguarde um minuto e tente novamente.\"}";

    private static final String BODY_429_EMAIL =
            "{\"error\":\"Muitas solicitações de e-mail. Aguarde e tente novamente.\"}";

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

        if (isEmailRoute(request) && !rateLimiter.tryConsumeEmail(client)) {
            reject(request, response, client, BODY_429_EMAIL, rateLimiter.emailRetryAfterSeconds());
            return;
        }

        if (!rateLimiter.tryConsume(client)) {
            reject(request, response, client, BODY_429, rateLimiter.retryAfterSeconds());
            return;
        }

        chain.doFilter(request, response);
    }

    private static boolean isEmailRoute(HttpServletRequest request) {
        return HttpMethod.POST.matches(request.getMethod())
                && EMAIL_PATHS.contains(request.getRequestURI());
    }

    private void reject(HttpServletRequest request, HttpServletResponse response,
                        String client, String body, long retryAfterSeconds) throws IOException {

        log.warn("[RateLimit] {} excedeu o teto em {} {}",
                client, request.getMethod(), request.getRequestURI());

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));
        response.getWriter().write(body);
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
     * <p><b>Por que o primeiro IP e não o último.</b> Pegar o último elemento da
     * cadeia é a receita usual contra forjamento, e ela vale quando existe exatamente
     * um proxy confiável na frente. Não é o caso aqui: o frontend na Vercel/Cloudflare
     * reescreve {@code /api/*} para o Render (ver DEPLOY.md, seção 1), então a
     * requisição chega com a cadeia {@code cliente, edge-do-frontend} e o último
     * elemento é o edge — comum a todos os usuários. Usar o último recriaria
     * exatamente o teto global que este método existe para evitar.
     *
     * <p>Ou seja: nesta topologia o {@code X-Forwarded-For} não fornece identidade
     * confiável, e nenhuma escolha de índice conserta isso. O primeiro IP é o melhor
     * best-effort para repartir o teto entre usuários legítimos; a defesa que não
     * depende de identidade nenhuma é o teto global de
     * {@link ApiRateLimiter#tryConsumeEmail}, aplicado onde o abuso custa dinheiro.
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
