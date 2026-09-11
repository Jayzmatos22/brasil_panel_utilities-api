package com.brasilpanel.backend.config.jwt;

import com.brasilpanel.backend.service.auth.TokenDenylistService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;


@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    /** Nome do cookie httpOnly que carrega o JWT. Deve casar com o emitido em AuthController. */
    public static final String SESSION_COOKIE = "token";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TokenDenylistService tokenDenylist;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            final String token = resolveToken(request);

            if (token == null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Um parse só: o subject, o jti e a validade saem das mesmas claims.
            final Claims claims = jwtService.parseClaims(token);
            final String email = claims.getSubject();

            // Revogado (logout) é recusado antes de tocar no banco de usuários.
            if (tokenDenylist.isRevoked(claims.getId())) {
                log.debug("Token revogado apresentado em [{}].", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                if (jwtService.isTokenValid(claims, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Loga o problema sem vazar detalhes internos para o cliente
            log.warn("JWT inválido ou expirado em [{}]: {}", request.getRequestURI(), e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }


    /**
     * Obtém o JWT do cookie httpOnly. Única via.
     *
     * <p>O cookie é inacessível ao JavaScript, portanto imune a exfiltração por XSS.
     *
     * <p><b>O header {@code Authorization: Bearer} deixou de ser aceito.</b> Ele era
     * um segundo canal para a mesma credencial, e um canal que vaza com facilidade:
     * header de requisição aparece em log de proxy, de CDN e de ferramenta de
     * diagnóstico, lugares onde um cookie httpOnly não costuma parar. O javadoc
     * anterior dizia que ele existia para Swagger e curl, mas o projeto não declara
     * nenhum {@code SecurityScheme} e o Swagger vem desligado por padrão — ou seja,
     * não havia cliente algum dependendo disso.
     *
     * <p>Se um dia existir cliente que não seja navegador, o caminho é um esquema
     * próprio para ele, não reabrir este.
     */
    private String resolveToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (SESSION_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}