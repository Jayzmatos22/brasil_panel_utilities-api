package com.brasilpanel.backend.controller.auth;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.AuthResponseDTO;
import com.brasilpanel.backend.dto.user.ProfileResponseDTO;
import com.brasilpanel.backend.exception.customized.TooManyAttemptsException;
import com.brasilpanel.backend.model.EducationLevel;
import com.brasilpanel.backend.model.ProfessionalArea;
import com.brasilpanel.backend.service.auth.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
        when(authService.loginUser(any()))
                .thenReturn(new AuthResponseDTO("jwt-secreto", EMAIL, "USER", 86_400_000L));

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
        when(authService.loginUser(any()))
                .thenReturn(new AuthResponseDTO("jwt-secreto", EMAIL, "USER", 86_400_000L));

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

    @Test
    @DisplayName("payload inválido devolve 400 antes de chegar ao service")
    void invalidPayloadReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nao-e-email\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
    }


    // ── Perfil profissional (onboarding) ─────────────────────────────────────

    @Nested
    @WithMockUser(username = EMAIL)
    class Perfil {

        private String perfilJson(String area, String escolaridade) {
            return """
                   {"profession":"Analista de dados","area":"%s",
                    "educationLevel":"%s","institution":"UFBA"}
                   """.formatted(area, escolaridade);
        }

        @Test
        @DisplayName("área fora do enum devolve 400, não 500")
        void unknownEnumValueReturns400() throws Exception {
            // A escolha por enum trouxe este caso: o Jackson lança
            // HttpMessageNotReadableException, que sem handler próprio caía no
            // genérico e virava 500 — erro do cliente reportado como falha do servidor.
            mockMvc.perform(patch("/api/auth/update-profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(perfilJson("INEXISTENTE", "SUPERIOR_COMPLETO")))
                    .andExpect(status().isBadRequest())
                    // A mensagem do Jackson cita nomes de classe e o caminho do campo.
                    .andExpect(content().string(Matchers.not(Matchers.containsString("ProfessionalArea"))));
        }

        @Test
        @DisplayName("profissão em branco devolve 400 sem chegar ao service")
        void blankProfessionReturns400() throws Exception {
            mockMvc.perform(patch("/api/auth/update-profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                     {"profession":"  ","area":"TECNOLOGIA",
                                      "educationLevel":"SUPERIOR_COMPLETO"}
                                     """))
                    .andExpect(status().isBadRequest());

            verify(authService, never()).updateProfile(anyString(), any());
        }

        @Test
        @DisplayName("escolaridade ausente devolve 400")
        void missingEducationLevelReturns400() throws Exception {
            mockMvc.perform(patch("/api/auth/update-profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"profession\":\"Analista de dados\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("perfil válido é salvo sob a identidade do token, não do corpo")
        void validProfileIsStoredUnderTheAuthenticatedIdentity() throws Exception {
            when(authService.updateProfile(anyString(), any()))
                    .thenReturn(new ProfileResponseDTO("Analista de dados",
                            ProfessionalArea.TECNOLOGIA, EducationLevel.SUPERIOR_COMPLETO,
                            "UFBA", LocalDateTime.now()));

            mockMvc.perform(patch("/api/auth/update-profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(perfilJson("TECNOLOGIA", "SUPERIOR_COMPLETO")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.profession").value("Analista de dados"))
                    .andExpect(jsonPath("$.onboardingCompletedAt").exists());

            // O e-mail vem do principal. Se viesse do corpo, qualquer sessão
            // editaria o perfil de qualquer outra conta.
            verify(authService).updateProfile(eq(EMAIL), any());
        }

        @Test
        @DisplayName("pular onboarding devolve 204")
        void skipOnboardingReturns204() throws Exception {
            mockMvc.perform(post("/api/auth/skip-onboarding"))
                    .andExpect(status().isNoContent());

            verify(authService).skipOnboarding(EMAIL);
        }

        @Test
        @DisplayName("consultar perfil nunca preenchido devolve 200 com campos nulos")
        void emptyProfileReturns200WithNullFields() throws Exception {
            when(authService.getProfile(EMAIL))
                    .thenReturn(new ProfileResponseDTO(null, null, null, null, null));

            mockMvc.perform(get("/api/auth/profile"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.profession").doesNotExist())
                    .andExpect(jsonPath("$.onboardingCompletedAt").doesNotExist());
        }
    }
}