package com.brasilpanel.backend.config.jwt;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private JwtFilter jwtFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain chain;
    private UserEntity usuario;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        userDetailsService = mock(UserDetailsService.class);
        jwtFilter = new JwtFilter(jwtService, userDetailsService);

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
        when(jwtService.extractEmail(TOKEN)).thenReturn(EMAIL);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(usuario);
        when(jwtService.isTokenValid(TOKEN, usuario)).thenReturn(true);
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

    @Test
    @DisplayName("header Authorization continua funcionando para clientes não-navegador")
    void authorizationHeaderStillWorks() throws Exception {
        tokenValido();
        request.addHeader("Authorization", "Bearer " + TOKEN);

        jwtFilter.doFilter(request, response, chain);

        // Mantido para Swagger, curl e testes de integração.
        assertThat(autenticado()).isEqualTo(EMAIL);
    }

    @Test
    @DisplayName("cookie tem precedência sobre o header")
    void cookieTakesPrecedenceOverHeader() throws Exception {
        tokenValido();
        request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, TOKEN));
        request.addHeader("Authorization", "Bearer token-do-header");

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isEqualTo(EMAIL);
        verify(jwtService, never()).extractEmail("token-do-header");
    }

    @Test
    @DisplayName("requisição sem credencial segue sem autenticar")
    void requestWithoutCredentialsPassesThrough() throws Exception {
        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
        verify(jwtService, never()).extractEmail(anyString());
    }

    @Test
    @DisplayName("cookie com outro nome é ignorado")
    void unrelatedCookieIsIgnored() throws Exception {
        request.setCookies(new Cookie("preferencias", "tema=escuro"));

        jwtFilter.doFilter(request, response, chain);

        assertThat(autenticado()).isNull();
        verify(jwtService, never()).extractEmail(anyString());
    }

    @Test
    @DisplayName("token malformado não autentica e não interrompe a cadeia")
    void malformedTokenDoesNotAuthenticate() throws Exception {
        request.setCookies(new Cookie(JwtFilter.SESSION_COOKIE, "lixo"));
        when(jwtService.extractEmail("lixo")).thenThrow(new MalformedJwtException("inválido"));

        jwtFilter.doFilter(request, response, chain);

        // A requisição continua: quem decide o 401 é a camada de autorização.
        assertThat(autenticado()).isNull();
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    @DisplayName("token que não valida contra o usuário não autentica")
    void tokenThatFailsValidationDoesNotAuthenticate() throws Exception {
        when(jwtService.extractEmail(TOKEN)).thenReturn(EMAIL);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(usuario);
        when(jwtService.isTokenValid(TOKEN, usuario)).thenReturn(false);
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
}