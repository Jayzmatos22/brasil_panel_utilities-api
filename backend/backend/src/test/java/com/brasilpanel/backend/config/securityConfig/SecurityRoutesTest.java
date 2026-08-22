package com.brasilpanel.backend.config.securityConfig;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.controller.api.IpeaAdminController;
import com.brasilpanel.backend.service.api.ipea.IpeaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Contrato de autorização da cadeia de filtros — com o SecurityConfig real, e não
 * com {@code addFilters = false}, porque é justamente a cadeia que está sob teste.
 */
@WebMvcTest(IpeaAdminController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class SecurityRoutesTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private IpeaService ipeaService;

    // O JwtFilter entra no slice por ser um Filter; suas dependências precisam existir.
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;

    /**
     * O refresh do IPEA morava em {@code POST /api/ipea/refresh}, que o
     * {@code permitAll} de {@code /api/ipea/**} liberava junto com as rotas de leitura.
     * Qualquer anônimo disparava as 57 buscas sequenciais de {@code refreshAll()}.
     */
    @Nested
    @DisplayName("Refresh do IPEA")
    class RefreshDoIpea {

        private static final String ROTA = "/api/admin/ipea/refresh";

        @Test
        @DisplayName("anônimo recebe 401 e o serviço não é chamado")
        void anonimo_naoDisparaORefresh() throws Exception {
            mockMvc.perform(post(ROTA))
                    .andExpect(status().isUnauthorized());

            verify(ipeaService, never()).refreshAll();
        }

        @Test
        @DisplayName("usuário comum recebe 403 e o serviço não é chamado")
        @WithMockUser(roles = "USER")
        void usuarioComum_naoDisparaORefresh() throws Exception {
            mockMvc.perform(post(ROTA))
                    .andExpect(status().isForbidden());

            verify(ipeaService, never()).refreshAll();
        }

        @Test
        @DisplayName("admin dispara o refresh")
        @WithMockUser(roles = "ADMIN")
        void admin_disparaORefresh() throws Exception {
            mockMvc.perform(post(ROTA))
                    .andExpect(status().isOk());

            verify(ipeaService).refreshAll();
        }

        @Test
        @DisplayName("a rota pública antiga não existe mais")
        void rotaAntiga_naoExisteMais() throws Exception {
            mockMvc.perform(post("/api/ipea/refresh"))
                    .andExpect(status().isNotFound());

            verify(ipeaService, never()).refreshAll();
        }
    }

    /**
     * Sem entry point explícito o Spring Security usa o Http403ForbiddenEntryPoint, e
     * requisição anônima em rota protegida virava 403. O interceptor do frontend só
     * redireciona para o login em 401 (Client.ts), então a sessão expirada travava
     * numa mensagem de erro em vez de mandar o usuário relogar.
     */
    @Nested
    @DisplayName("Anônimo vs. autenticado sem permissão")
    class StatusDeNegacao {

        @Test
        @DisplayName("sem sessão é 401, não 403")
        void semSessao_e401() throws Exception {
            mockMvc.perform(get("/api/profile/me"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("com sessão mas sem o papel exigido continua sendo 403")
        @WithMockUser(roles = "USER")
        void comSessaoSemPapel_continua403() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isForbidden());
        }
    }
}
