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
     * Obtém o JWT do cookie httpOnly e, se ausente, do header Authorization.
     *
     * <p>O cookie é a via usada pelo navegador — inacessível ao JavaScript, portanto
     * imune a exfiltração por XSS. O header permanece aceito para clientes que não
     * são navegador (Swagger, curl, testes de integração).
     */
    private String resolveToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (SESSION_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}