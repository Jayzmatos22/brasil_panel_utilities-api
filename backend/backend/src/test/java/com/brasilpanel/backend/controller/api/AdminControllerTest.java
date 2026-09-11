package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.service.auth.TokenDenylistService;
import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.dto.user.UserResponseDTO;
import com.brasilpanel.backend.mappers.UserMapper;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cobre a regra do S5: um admin não pode revogar o próprio acesso.
 *
 * <p>Antes, a validação era delegada ao frontend — o que não protege nada, já que
 * o endpoint é acessível diretamente. Um admin que se rebaixasse perderia o acesso
 * ao painel sem forma de reverter pela interface.
 */
@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AdminControllerTest {

    private static final String EMAIL_ADMIN = "admin@exemplo.com";
    private static final String EMAIL_OUTRO = "outro@exemplo.com";

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserRepository userRepository;
    @MockitoBean private UserMapper userMapper;

    // O JwtFilter entra no slice do @WebMvcTest por ser um Filter — o bean é
    // criado mesmo com addFilters = false, então suas dependências precisam existir.
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;
    @MockitoBean private TokenDenylistService tokenDenylist;

    private UUID idAdmin;
    private UUID idOutro;

    @BeforeEach
    void setUp() {
        idAdmin = UUID.randomUUID();
        idOutro = UUID.randomUUID();
    }

    private UserEntity usuario(String email, Role role) {
        return UserEntity.builder()
                .name("Fulano")
                .email(email)
                .password("hash")
                .role(role)
                .verified(true)
                .build();
    }

    @Test
    @WithMockUser(username = EMAIL_ADMIN, roles = "ADMIN")
    @DisplayName("admin não consegue revogar o próprio acesso")
    void adminCannotDemoteThemselves() throws Exception {
        when(userRepository.findById(idAdmin))
                .thenReturn(Optional.of(usuario(EMAIL_ADMIN, Role.ADMIN)));

        mockMvc.perform(put("/api/admin/users/{id}/demote", idAdmin))
                .andExpect(status().isBadRequest());

        // O estado não pode ter sido alterado.
        verify(userRepository, never()).save(any());
    }

    @Test
    @WithMockUser(username = EMAIL_ADMIN, roles = "ADMIN")
    @DisplayName("admin consegue revogar o acesso de outro admin")
    void adminCanDemoteAnotherAdmin() throws Exception {
        UserEntity outro = usuario(EMAIL_OUTRO, Role.ADMIN);
        when(userRepository.findById(idOutro)).thenReturn(Optional.of(outro));
        when(userMapper.toResponse(any()))
                .thenReturn(new UserResponseDTO(idOutro, "Fulano", EMAIL_OUTRO, Role.USER, LocalDateTime.now()));

        mockMvc.perform(put("/api/admin/users/{id}/demote", idOutro))
                .andExpect(status().isOk());

        verify(userRepository).save(outro);
    }

    @Test
    @WithMockUser(username = EMAIL_ADMIN, roles = "ADMIN")
    @DisplayName("usuário inexistente devolve 400")
    void unknownUserReturns400() throws Exception {
        when(userRepository.findById(idOutro)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/admin/users/{id}/demote", idOutro))
                .andExpect(status().isBadRequest());
    }

    /**
     * O painel listava cadastro abandonado misturado com usuário de verdade, então a
     * lista não respondia "quantas contas existem mesmo". O filtro é opcional para
     * não mudar o comportamento de quem já consome a rota.
     */
    @Nested
    @DisplayName("Filtro por situação da conta")
    class FiltroVerificado {

        @BeforeEach
        void semResultados() {
            Page<UserEntity> vazia = new PageImpl<>(List.of());
            when(userRepository.findAll(any(Pageable.class))).thenReturn(vazia);
            when(userRepository.findByVerified(anyBoolean(), any(Pageable.class))).thenReturn(vazia);
        }

        @Test
        @DisplayName("sem o parâmetro, lista todos — comportamento antigo")
        @WithMockUser(username = EMAIL_ADMIN, roles = "ADMIN")
        void withoutTheParamListsEveryone() throws Exception {
            mockMvc.perform(get("/api/admin/users")).andExpect(status().isOk());

            verify(userRepository).findAll(any(Pageable.class));
            verify(userRepository, never()).findByVerified(anyBoolean(), any(Pageable.class));
        }

        @Test
        @DisplayName("verified=false traz só os cadastros nunca concluídos")
        @WithMockUser(username = EMAIL_ADMIN, roles = "ADMIN")
        void falseBringsOnlyUnverified() throws Exception {
            mockMvc.perform(get("/api/admin/users").param("verified", "false"))
                    .andExpect(status().isOk());

            verify(userRepository).findByVerified(eq(false), any(Pageable.class));
            verify(userRepository, never()).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("verified=true traz só as contas de verdade")
        @WithMockUser(username = EMAIL_ADMIN, roles = "ADMIN")
        void trueBringsOnlyVerified() throws Exception {
            mockMvc.perform(get("/api/admin/users").param("verified", "true"))
                    .andExpect(status().isOk());

            verify(userRepository).findByVerified(eq(true), any(Pageable.class));
        }
    }
}
