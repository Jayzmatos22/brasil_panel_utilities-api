package com.brasilpanel.backend.config.securityConfig;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.controller.api.IpeaAdminController;
import com.brasilpanel.backend.service.api.ipea.IpeaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

/**
 * Headers de segurança que a API precisa devolver em TODA resposta — inclusive num
 * 401, que é o que uma requisição anônima a rota de admin recebe aqui.
 *
 * <p>O {@code HeaderWriterFilter} roda antes da autorização, então a rota escolhida
 * não importa; importa que exista no slice.
 */
@WebMvcTest(IpeaAdminController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class SecurityHeadersTest {

    private static final String ROTA = "/api/admin/ipea/refresh";

    @Autowired private MockMvc mockMvc;

    @MockitoBean private IpeaService ipeaService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    @DisplayName("HSTS sai quando a requisição é vista como segura")
    void hstsIsEmittedOnSecureRequests() throws Exception {
        // secure(true) é o que o ForwardedHeaderFilter produz atrás do proxy quando
        // forward-headers-strategy está configurado — ver ProdConfigTest.
        mockMvc.perform(post(ROTA).secure(true))
                .andExpect(header().string("Strict-Transport-Security",
                        "max-age=31536000 ; includeSubDomains"));
    }

    /**
     * Documenta a dependência, não um defeito: o writer de HSTS do Spring Security só
     * escreve em request.isSecure(). Atrás do Render isso só é verdade com o
     * forward-headers-strategy — sem ele, este cenário é o que produção veria.
     */
    @Test
    @DisplayName("sem a requisição marcada como segura, HSTS não sai — por isso o proxy precisa ser confiado")
    void hstsDependsOnTheRequestBeingSecure() throws Exception {
        mockMvc.perform(post(ROTA).secure(false))
                .andExpect(header().doesNotExist("Strict-Transport-Security"));
    }

    @Test
    @DisplayName("Referrer-Policy e Permissions-Policy não são default e precisam estar configurados")
    void nonDefaultHeadersArePresent() throws Exception {
        mockMvc.perform(post(ROTA))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("Permissions-Policy",
                        "camera=(), microphone=(), geolocation=(), payment=()"));
    }

    @Test
    @DisplayName("os defaults do Spring Security continuam ligados")
    void springSecurityDefaultsStayOn() throws Exception {
        // Guarda de regressão: um `.headers(h -> h.disable())` ou um `defaultsDisabled()`
        // acrescentado por engano derrubaria estes dois junto.
        mockMvc.perform(post(ROTA))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }
}
