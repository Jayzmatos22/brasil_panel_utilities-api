package com.brasilpanel.backend.controller.auth;

import com.brasilpanel.backend.service.auth.TokenDenylistService;
import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.AuthResponseDTO;
import com.brasilpanel.backend.dto.user.LoginOutcomeDTO;
import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import com.brasilpanel.backend.service.auth.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.util.Date;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Teste de camada web: exercita o controller junto do {@code GlobalExceptionHandler}
 * e da serialização — o que os testes de unidade do {@code AuthService} não alcançam.
 *
 * <p>{@code addFilters = false} desliga a cadeia de filtros de segurança: o alvo aqui
 * é o mapeamento exceção → status HTTP e o cookie emitido, não a autorização.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuthControllerTest {

    private static final String EMAIL = "usuario@exemplo.com";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AuthService authService;

    // O JwtFilter entra no slice do @WebMvcTest por ser um Filter, mesmo com
    // addFilters = false — o bean é criado, então suas dependências precisam existir.
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;
    @MockitoBean private TokenDenylistService tokenDenylist;

    private String loginJson(String senha) throws Exception {
        return objectMapper.writeValueAsString(Map.of("email", EMAIL, "password", senha));
    }

    @Test
    @DisplayName("senha errada devolve 401, não 500")
    void wrongPasswordReturns401() throws Exception {
        // Regressão do S4: sem handler para BadCredentialsException, isto virava 500
        // e o interceptor do frontend — que só trata 401 — não limpava a sessão.
        when(authService.loginUser(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("senha-errada")))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(Matchers.containsString("inválidos")));
    }

    @Test
    @DisplayName("excesso de tentativas devolve 429")
    void tooManyAttemptsReturns429() throws Exception {
        when(authService.loginUser(any()))
                .thenThrow(new TooManyAttemptsException("Muitas tentativas de login. Aguarde 15 minutos."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("qualquer")))
                // 429 sinaliza ao cliente que deve esperar, em vez de continuar tentando.
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("e-mail não verificado devolve 403")
    void unverifiedEmailReturns403() throws Exception {
        when(authService.loginUser(any()))
                .thenThrow(new IllegalStateException("E-mail não verificado. Verifique sua caixa de entrada."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("SenhaCerta@123")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("login bem-sucedido emite cookie httpOnly e não devolve o token no corpo")
    void successfulLoginEmitsHttpOnlyCookieAndHidesToken() throws Exception {
        when(authService.loginUser(any())).thenReturn(LoginOutcomeDTO.autenticado(
                new AuthResponseDTO("jwt-secreto", "Fulano de Tal", EMAIL, "USER", 86_400_000L)));

        var resultado = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("SenhaCerta@123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.role").value("USER"))
                // O coração do S12: o JWT não pode chegar ao JavaScript.
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        String setCookie = resultado.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("token=jwt-secreto");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("SameSite=Lax");
        assertThat(setCookie).contains("Path=/");
    }

    @Test
    @DisplayName("corpo da resposta não contém o JWT em lugar nenhum")
    void responseBodyNeverLeaksTheToken() throws Exception {
        when(authService.loginUser(any())).thenReturn(LoginOutcomeDTO.autenticado(
                new AuthResponseDTO("jwt-secreto", "Fulano de Tal", EMAIL, "USER", 86_400_000L)));

        var resultado = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("SenhaCerta@123")))
                .andReturn();

        assertThat(resultado.getResponse().getContentAsString()).doesNotContain("jwt-secreto");
    }

    @Test
    @DisplayName("logout expira o cookie e devolve 204")
    void logoutExpiresTheCookie() throws Exception {
        var resultado = mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = resultado.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        // Max-Age=0 é o que efetivamente apaga um cookie httpOnly no navegador.
        assertThat(setCookie).contains("Max-Age=0");
        assertThat(setCookie).contains("HttpOnly");
    }

    /**
     * O logout antes apagava só o cookie. O token continuava assinado e dentro da
     * validade, então bastava reapresentá-lo para seguir autenticado por até 24 h.
     */
    @Nested
    @DisplayName("Logout revoga o token")
    class LogoutRevoga {

        private static final String TOKEN = "jwt-da-sessao";
        private static final String JTI = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

        @Test
        @DisplayName("o jti do cookie vai para a denylist")
        void revokesTheCookieToken() throws Exception {
            Date expiracao = new Date(System.currentTimeMillis() + 3_600_000);
            Claims claims = mock(Claims.class);
            when(claims.getId()).thenReturn(JTI);
            when(claims.getExpiration()).thenReturn(expiracao);
            when(jwtService.parseClaims(TOKEN)).thenReturn(claims);

            mockMvc.perform(post("/api/auth/logout").cookie(new Cookie("token", TOKEN)))
                    .andExpect(status().isNoContent());

            verify(tokenDenylist).revoke(JTI, expiracao);
        }

        @Test
        @DisplayName("sem cookie devolve 204 e não revoga nada")
        void withoutCookieStillSucceeds() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isNoContent());

            verify(tokenDenylist, never()).revoke(anyString(), any(Date.class));
        }

        @Test
        @DisplayName("token ilegível devolve 204 e não derruba o logout")
        void unparseableTokenStillSucceeds() throws Exception {
            when(jwtService.parseClaims("lixo"))
                    .thenThrow(new MalformedJwtException("inválido"));

            mockMvc.perform(post("/api/auth/logout").cookie(new Cookie("token", "lixo")))
                    .andExpect(status().isNoContent());

            verify(tokenDenylist, never()).revoke(anyString(), any(Date.class));
        }

        @Test
        @DisplayName("o cookie continua sendo apagado mesmo quando há revogação")
        void cookieIsStillCleared() throws Exception {
            Claims claims = mock(Claims.class);
            when(claims.getId()).thenReturn(JTI);
            when(claims.getExpiration()).thenReturn(new Date(System.currentTimeMillis() + 3_600_000));
            when(jwtService.parseClaims(TOKEN)).thenReturn(claims);

            var resultado = mockMvc.perform(post("/api/auth/logout").cookie(new Cookie("token", TOKEN)))
                    .andExpect(status().isNoContent())
                    .andReturn();

            assertThat(resultado.getResponse().getHeader("Set-Cookie")).contains("Max-Age=0");
        }
    }


    @Test
    @DisplayName("payload inválido devolve 400 antes de chegar ao service")
    void invalidPayloadReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nao-e-email\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── Segundo fator do admin ───────────────────────────────────────────────

    @Test
    @DisplayName("login que exige segundo fator responde 202 e NÃO emite cookie")
    void twoFactorLoginIssuesNoCookie() throws Exception {
        when(authService.loginUser(any()))
                .thenReturn(LoginOutcomeDTO.desafioPendente("Código de confirmação enviado."));

        var resultado = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("SenhaCerta@123")))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.twoFactorRequired").value(true))
                .andReturn();

        // O ponto inteiro da mudança: credenciais certas, e ainda assim nenhuma
        // sessão sai daqui. Um Set-Cookie nesta resposta anularia o segundo fator.
        assertThat(resultado.getResponse().getHeader("Set-Cookie")).isNull();
    }

    @Test
    @DisplayName("confirmação do código emite o cookie de sessão")
    void confirmingTwoFactorEmitsCookie() throws Exception {
        when(authService.confirmAdminLogin(any()))
                .thenReturn(new AuthResponseDTO("jwt-admin", "Dono", EMAIL, "ADMIN", 86_400_000L));

        var resultado = mockMvc.perform(post("/api/auth/admin/confirm-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                 {"email":"%s","password":"SenhaCerta@123","code":"123456"}
                                 """.formatted(EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        String setCookie = resultado.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).contains("token=jwt-admin").contains("HttpOnly");
    }

    @Test
    @DisplayName("código fora do formato de 6 dígitos é barrado antes do serviço")
    void malformedCodeIsRejectedBeforeReachingTheService() throws Exception {
        mockMvc.perform(post("/api/auth/admin/confirm-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                 {"email":"%s","password":"SenhaCerta@123","code":"abc"}
                                 """.formatted(EMAIL)))
                .andExpect(status().isBadRequest());

        // Barrar na validação poupa uma tentativa do desafio: sem isso, lixo digitado
        // no formulário queimaria uma das 5 chances de quem está tentando entrar.
        verify(authService, never()).confirmAdminLogin(any());
    }

    // ── Validação do cadastro ────────────────────────────────────────────────

    /**
     * Até aqui a composição da senha era exigida só pelo JavaScript da tela: o backend
     * pedia oito caracteres e nada mais. Quem chamasse a API direto — curl, Postman,
     * qualquer coisa — cadastrava "12345678" sem obstáculo. Estes testes prendem a
     * regra no lugar onde ela não pode ser contornada.
     */
    private String registroJson(String nome, String senha) throws Exception {
        return objectMapper.writeValueAsString(
                Map.of("name", nome, "email", EMAIL, "password", senha));
    }

    private void esperaRecusa(String nome, String senha) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroJson(nome, senha)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).registerUser(any());
    }

    @Test
    @DisplayName("senha sem símbolo, sem número ou curta é recusada pela API, não só pela tela")
    void weakPasswordIsRejectedByTheApi() throws Exception {
        esperaRecusa("Jailton Matos", "12345678");
        esperaRecusa("Jailton Matos", "senhaminuscula@1");
        esperaRecusa("Jailton Matos", "Ab1@cde");
    }

    @Test
    @DisplayName("símbolo fora da lista branca antiga é aceito — é senha forte")
    void symbolsOutsideTheOldWhitelistAreAccepted() throws Exception {
        // A regra do frontend aceitava só @$!%*?&, então "Senha#Forte1" era recusada
        // por conter '#'. A do backend não repete esse erro.
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroJson("Jailton Matos", "Senha#Forte1")))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("nome de uma palavra é aceito — sobrenome não é exigido")
    void singleWordNameIsAccepted() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registroJson("Ana", "Senha@123")))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("nome com menos de 3 letras, ou com dígito, é recusado")
    void nameNeedsThreeLetters() throws Exception {
        esperaRecusa("Jo", "Senha@123");
        esperaRecusa("Jailton 123", "Senha@123");
    }
}
