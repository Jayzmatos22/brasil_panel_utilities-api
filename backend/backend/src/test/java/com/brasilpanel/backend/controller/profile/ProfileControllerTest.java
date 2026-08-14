package com.brasilpanel.backend.controller.profile;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.profile.ProfileOptionsDTO;
import com.brasilpanel.backend.dto.profile.ProfileResponseDTO;
import com.brasilpanel.backend.service.profile.ProfileService;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Camada web do perfil: mapeamento exceção → status HTTP e a origem da
 * identidade. O {@code ProfileServiceTest} cobre as regras; aqui o alvo é o que
 * só aparece atravessando o {@code GlobalExceptionHandler} e a serialização.
 *
 * <p>{@code addFilters = false} desliga a cadeia de segurança — o alvo não é a
 * autorização, que o SecurityConfig resolve em {@code anyRequest().authenticated()}.
 */
@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockUser(username = ProfileControllerTest.EMAIL)
class ProfileControllerTest {

    static final String EMAIL = "usuario@exemplo.com";

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ProfileService profileService;

    // O JwtFilter entra no slice por ser um Filter, mesmo com addFilters = false:
    // o bean é criado, então suas dependências precisam existir.
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;

    private static ProfileResponseDTO perfilVazio() {
        return new ProfileResponseDTO(null, null, null, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("id não numérico devolve 400, não 500")
    void nonNumericIdReturns400() throws Exception {
        // Regressão: o Jackson não converte "abc" para Long e lança
        // HttpMessageNotReadableException. Sem handler dedicado isso caía no
        // genérico e o cliente recebia 500 por um erro que é dele.
        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"professionAreaId\":\"abc\"}"))
                .andExpect(status().isBadRequest())
                // A mensagem do Jackson cita nomes de classe e o caminho do campo.
                .andExpect(content().string(Matchers.not(Matchers.containsString("Long"))));

        verify(profileService, never()).updateProfile(anyString(), any());
    }

    @Test
    @DisplayName("referência incoerente devolve 400 com a mensagem do serviço")
    void incoherentReferenceReturns400() throws Exception {
        when(profileService.updateProfile(anyString(), any()))
                .thenThrow(new IllegalArgumentException("A subárea de profissão não pertence à área escolhida."));

        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"professionAreaId\":2,\"professionSubareaId\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(Matchers.containsString("não pertence à área")));
    }

    @Test
    @DisplayName("cargo acima do limite devolve 400 sem chegar ao serviço")
    void oversizedTitleReturns400() throws Exception {
        // @Size(max = 120) existe para o excesso virar 400 aqui, e não violação
        // de constraint no INSERT — que seria 500.
        String cargoLongo = "x".repeat(121);

        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"professionTitle\":\"" + cargoLongo + "\"}"))
                .andExpect(status().isBadRequest());

        verify(profileService, never()).updateProfile(anyString(), any());
    }

    @Test
    @DisplayName("perfil é gravado sob a identidade do token, não do corpo")
    void profileIsStoredUnderTheAuthenticatedIdentity() throws Exception {
        when(profileService.updateProfile(anyString(), any())).thenReturn(perfilVazio());

        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        // O e-mail no corpo é ruído: nada no controller o lê.
                        .content("{\"professionTitle\":\"Analista\",\"email\":\"outro@exemplo.com\"}"))
                .andExpect(status().isOk());

        // Se a identidade viesse do corpo, qualquer sessão editaria perfil alheio.
        verify(profileService).updateProfile(eq(EMAIL), any());
    }

    @Test
    @DisplayName("perfil nunca preenchido devolve 200 com campos nulos")
    void emptyProfileReturns200() throws Exception {
        when(profileService.getProfile(EMAIL)).thenReturn(perfilVazio());

        mockMvc.perform(get("/api/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professionArea").doesNotExist())
                .andExpect(jsonPath("$.updatedAt").doesNotExist());
    }

    @Test
    @DisplayName("catálogo devolve a árvore de áreas e os níveis")
    void optionsReturnsTheCatalogTree() throws Exception {
        when(profileService.getOptions()).thenReturn(new ProfileOptionsDTO(
                List.of(new ProfileOptionsDTO.AreaOption(1L, "tecnologia", "Tecnologia",
                        List.of(new ProfileOptionsDTO.SubareaOption(10L, "backend", "Back-end")))),
                List.of(new ProfileOptionsDTO.LevelOption(200L, "superior", "Ensino Superior")),
                List.of(new ProfileOptionsDTO.LevelOption(100L, "pleno", "Pleno"))));

        mockMvc.perform(get("/api/profile/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.areas[0].slug").value("tecnologia"))
                .andExpect(jsonPath("$.areas[0].subareas[0].slug").value("backend"))
                .andExpect(jsonPath("$.educationLevels[0].slug").value("superior"))
                .andExpect(jsonPath("$.professionLevels[0].slug").value("pleno"));
    }
}
