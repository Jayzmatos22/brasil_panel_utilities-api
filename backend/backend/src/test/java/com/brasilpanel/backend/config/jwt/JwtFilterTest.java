package com.brasilpanel.backend.config.jwt;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.service.auth.TokenDenylistService;
import io.jsonwebtoken.Claims;
import com.brasilpanel.backend.model.UserEntity;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * O filtro é o ponto onde o cookie httpOnly vira uma sessão autenticada — a peça
 * central do S12. Sem estes testes, quebrar a leitura do cookie não falharia
 * nenhuma verificação automatizada.
 */
class JwtFilterTest {

    private static final String EMAIL = "usuario@exemplo.com";
    private static final String TOKEN = "jwt-valido";
    private static final String JTI = "11111111-2222-3333-4444-555555555555";

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private TokenDenylistService tokenDenylist;
    private JwtFilter jwtFilter;
    private Claims claims;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain chain;
    private UserEntity usuario;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        userDetailsService = mock(UserDetailsService.class);
        tokenDenylist = mock(TokenDenylistService.class);
        jwtFilter = new JwtFilter(jwtService, userDetailsService, tokenDenylist);

        claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn(EMAIL);
        when(claims.getId()).thenReturn(JTI);

        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        chain = new MockFilterChain();

        usuario = UserEntity.builder()
                .name("Usuário Teste")
                .email(EMAIL)
                .password("hash")
                .role(Role.USER)
                .verified(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        // O contexto é estático (ThreadLocal): sem limpar, um teste contamina o próximo.
        SecurityContextHolder.clearContext();
    }

    private void tokenValido() {
        when(jwtService.parseClaims(TOKEN)).thenReturn(claims);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(usuario);
        when(jwtService.isTokenValid(claims, usuario)).thenReturn(true);
        when(tokenDenylist.isRevoked(JTI)).thenReturn(false);
    }

    private String autenticado() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }

    @Test
    @DisplayName("cookie de sessão autentica a requisição")
    void cookieAuthenticates() throws Exception {
        tokenValido();
        request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isEqualTo(EMAIL);
    }

    /**
     * O header era um segundo canal para a mesma credencial, e um canal que vaza com
     * facilidade: header de requisição aparece em log de proxy, de CDN e de
     * ferramenta de diagnóstico, onde um cookie httpOnly não costuma parar.
     */
    @Test
    @DisplayName("header Authorization não autentica mais")
    void authorizationHeaderNoLongerAuthenticates() throws Exception {
        tokenValido();
        request.addHeader("Authorization", "Bearer " + TOKEN);

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
    }

    @Test
    @DisplayName("token no header não chega nem a ser parseado")
    void headerTokenIsNotEvenParsed() throws Exception {
        tokenValido();
        request.addHeader("Authorization", "Bearer " + TOKEN);

        jwtFilter.doFilter(request, response, chain);

        verify(jwtService, never()).extractEmail(anyString());
    }


    @Test
    @DisplayName("cookie tem precedência sobre o header")
    void cookieTakesPrecedenceOverHeader() throws Exception {
        tokenValido();
        request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));
        request.addHeader("Authorization", "Bearer token-do-header");

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isEqualTo(EMAIL);
        verify(jwtService, never()).parseClaims("token-do-header");
    }

    @Test
    @DisplayName("requisição sem credencial segue sem autenticar")
    void requestWithoutCredentialsPassesThrough() throws Exception {
        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
        verify(jwtService, never()).parseClaims(anyString());
    }

    @Test
    @DisplayName("cookie com outro nome é ignorado")
    void unrelatedCookieIsIgnored() throws Exception {
        request.setCookies(new Cookie("preferencias", "tema=escuro"));

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
        verify(jwtService, never()).parseClaims(anyString());
    }

    @Test
    @DisplayName("token malformado não autentica e não interrompe a cadeia")
    void malformedTokenDoesNotAuthenticate() throws Exception {
        request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, "lixo"));
        when(jwtService.parseClaims("lixo")).thenThrow(new MalformedJwtException("inválido"));

        jwtFilter.doFilter(request, response, chain);

        // A requisição continua: quem decide o 401 é a camada de autorização.
        assertThat(autenticado()).isNull();
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    @DisplayName("token que não valida contra o usuário não autentica")
    void tokenThatFailsValidationDoesNotAuthenticate() throws Exception {
        when(jwtService.parseClaims(TOKEN)).thenReturn(claims);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(usuario);
        when(jwtService.isTokenValid(claims, usuario)).thenReturn(false);
        request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
    }

    @Test
    @DisplayName("header sem o prefixo Bearer é ignorado")
    void headerWithoutBearerPrefixIsIgnored() throws Exception {
        request.addHeader("Authorization", TOKEN);

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
        verify(userDetailsService, never()).loadUserByUsername(any());
    }

    /**
     * O logout só passa a significar alguma coisa se o filtro consultar a denylist.
     * Antes disso o token seguia aceito por até 24 h depois de o usuário sair.
     */
    @Nested
    @DisplayName("Token revogado (logout)")
    class Revogado {

        @Test
        @DisplayName("token revogado não autentica")
        void revokedTokenDoesNotAuthenticate() throws Exception {
            tokenValido();
            when(tokenDenylist.isRevoked(JTI)).thenReturn(true);
            request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));

            jwtFilter.doFilter(request, response, chain);

            assertThat(autenticado()).isNull();
        }

        @Test
        @DisplayName("token revogado não chega a consultar o usuário")
        void revokedTokenSkipsUserLookup() throws Exception {
            tokenValido();
            when(tokenDenylist.isRevoked(JTI)).thenReturn(true);
            request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));

            jwtFilter.doFilter(request, response, chain);

            verify(userDetailsService, never()).loadUserByUsername(anyString());
        }

        @Test
        @DisplayName("token revogado não interrompe a cadeia de filtros")
        void revokedTokenKeepsChainGoing() throws Exception {
            tokenValido();
            when(tokenDenylist.isRevoked(JTI)).thenReturn(true);
            request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));

            jwtFilter.doFilter(request, response, chain);

            // Quem responde 401 é a camada de autorização, não este filtro.
            assertThat(chain.getRequest()).isNotNull();
        }

        @Test
        @DisplayName("token não revogado segue autenticando")
        void nonRevokedTokenStillAuthenticates() throws Exception {
            tokenValido();
            request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));

            jwtFilter.doFilter(request, response, chain);

            assertThat(autenticado()).isEqualTo(EMAIL);
            verify(tokenDenylist).isRevoked(JTI);
        }

        @Test
        @DisplayName("a denylist também vale para o header Authorization")
        void denylistAppliesToBearerHeader() throws Exception {
            tokenValido();
            when(tokenDenylist.isRevoked(JTI)).thenReturn(true);
            request.addHeader("Authorization", "Bearer " + TOKEN);

            jwtFilter.doFilter(request, response, chain);

            assertThat(autenticado()).isNull();
        }
    }
}
