package com.brasilpanel.backend.config.seed;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * O seeder de admin cria uma conta com poder total no boot. Os caminhos que
 * importam são os de recusa: sem senha configurada, e admin já existente.
 * Um erro aqui não aparece em runtime — aparece como conta de ADMIN indevida.
 */
class AdminSeederTest {

    private static final String EMAIL = "admin@brasilpanel.test";

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AdminSeeder seeder;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        seeder = new AdminSeeder(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(seeder, "adminEmail", EMAIL);
    }

    private void comSenha(String senha) {
        ReflectionTestUtils.setField(seeder, "adminPassword", senha);
    }

    @Test
    @DisplayName("sem ADMIN_PASSWORD configurada, nenhum admin é criado")
    void semSenha_naoCriaAdmin() {
        comSenha(null);

        seeder.run(null);

        verify(userRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("senha em branco é tratada como ausente")
    void senhaEmBranco_naoCriaAdmin() {
        comSenha("   ");

        seeder.run(null);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("admin já existente não é recriado nem tem a senha sobrescrita")
    void adminExistente_naoSalvaDeNovo() {
        comSenha("senha-valida-123");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(new UserEntity()));

        seeder.run(null);

        verify(userRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("cria o admin com ROLE_ADMIN, verificado e com a senha codificada")
    void primeiroBoot_criaAdmin() {
        comSenha("senha-valida-123");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hash-fake");

        seeder.run(null);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());
        UserEntity admin = captor.getValue();

        assertThat(admin.getEmail()).isEqualTo(EMAIL);
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.isVerified()).isTrue();
        // A senha nunca pode ir ao banco em texto puro.
        assertThat(admin.getPassword()).isEqualTo("$2a$10$hash-fake")
                                       .isNotEqualTo("senha-valida-123");
    }
}