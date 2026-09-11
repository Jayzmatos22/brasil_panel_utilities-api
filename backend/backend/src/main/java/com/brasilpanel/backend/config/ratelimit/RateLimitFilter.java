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
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    /** 45 caracteres cobrem o maior literal IPv6 com sufixo IPv4 mapeado. */
    private static final int MAX_IP_LENGTH = 45;

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
            "/api/auth/resend-code",
            // Dispara e-mail para endereço de terceiro informado na requisição — mesma
            // exposição do /register, e por isso o mesmo teto.
            "/api/auth/forgot-password");

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
     * Identidade do cliente para efeito de teto.
     *
     * <p><b>Autenticado: o {@code sub} do JWT.</b> É a única identidade inforjável que
     * existe aqui — o token é assinado, e o {@code JwtFilter} já o validou quando esta
     * linha roda. Quem está logado passa a ter um balde que não se multiplica mexendo
     * em header nenhum.
     *
     * <p><b>Anônimo: o primeiro IP de {@code X-Forwarded-For}, se for mesmo um IP.</b>
     * Ler o header não é opcional: em produção a aplicação fica atrás do proxy do
     * Render, e {@code getRemoteAddr()} devolveria o IP do proxy para todo mundo — o
     * teto viraria global e o primeiro usuário a carregar o painel bloquearia os outros.
     *
     * <p><b>Por que o primeiro IP e não o último.</b> Pegar o último elemento da cadeia
     * é a receita usual contra forjamento, e ela vale quando existe exatamente um proxy
     * confiável na frente. Não é o caso aqui: o frontend na Vercel/Cloudflare reescreve
     * {@code /api/*} para o Render (ver DEPLOY.md, seção 1), então a requisição chega
     * com a cadeia {@code cliente, edge-do-frontend} e o último elemento é o edge —
     * comum a todos. Usar o último recriaria o teto global que este método evita.
     *
     * <p><b>O que a validação de IP resolve, e o que não resolve.</b> Sem ela, qualquer
     * string no header virava uma chave nova: {@code X-Forwarded-For: a}, {@code b},
     * {@code c} davam três baldes cheios, e o teto por IP simplesmente não existia para
     * quem soubesse disso. Exigir um literal de IP tira o caso trivial e mantém a chave
     * num formato previsível para o log.
     *
     * <p>Mas não transforma anônimo em identidade confiável: sobram 2^32 endereços IPv4
     * para rotacionar. <b>Nesta topologia o teto por IP para tráfego anônimo é
     * best-effort e ponto final</b> — o que de fato protege onde o abuso custa dinheiro
     * é o teto global de {@link ApiRateLimiter#tryConsumeEmail} e, nas rotas pagas, o
     * cache mais os guardas de orçamento de cada provedor.
     */
    private static String clientId(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken)) {
            // Prefixo para que um e-mail nunca colida com um IP no mesmo mapa.
            return "user:" + auth.getName();
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            String first = (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
            if (isIpLiteral(first)) {
                return "ip:" + first;
            }
        }
        return "ip:" + request.getRemoteAddr();
    }

    /**
     * Se o texto é um literal de endereço IP.
     *
     * <p>Escrito à mão porque o projeto não tem Guava nem commons-validator, e porque
     * {@code InetAddress.getByName} resolveria DNS para qualquer coisa que não fosse
     * literal — transformar um header hostil em consulta de rede seria trocar um
     * problema pequeno por um grande.
     *
     * <p>O IPv6 aqui é conservador, não um parser de RFC: aceita algum literal malformado
     * que um parser recusaria. Serve ao propósito, que é distinguir "isto parece um
     * endereço" de "isto é uma string arbitrária escolhida para criar uma chave nova".
     */
    private static boolean isIpLiteral(String value) {
        if (value.isEmpty() || value.length() > MAX_IP_LENGTH) {
            return false;
        }
        return value.indexOf(':') >= 0 ? isIpv6Literal(value) : isIpv4Literal(value);
    }

    private static boolean isIpv4Literal(String value) {
        int octetos = 0;
        int inicio = 0;

        for (int i = 0; i <= value.length(); i++) {
            if (i != value.length() && value.charAt(i) != '.') {
                continue;
            }
            int digitos = i - inicio;
            if (digitos < 1 || digitos > 3) {
                return false;
            }
            int valor = 0;
            for (int j = inicio; j < i; j++) {
                char c = value.charAt(j);
                if (c < '0' || c > '9') {
                    return false;
                }
                valor = valor * 10 + (c - '0');
            }
            if (valor > 255) {
                return false;
            }
            octetos++;
            inicio = i + 1;
        }
        return octetos == 4;
    }

    private static boolean isIpv6Literal(String value) {
        int doisPontos = 0;

        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == ':') {
                doisPontos++;
            } else if (c != '.' && Character.digit(c, 16) < 0) {
                // '.' é aceito por causa da forma mista (::ffff:192.0.2.1).
                return false;
            }
        }
        return doisPontos >= 2 && doisPontos <= 8;
    }
}
