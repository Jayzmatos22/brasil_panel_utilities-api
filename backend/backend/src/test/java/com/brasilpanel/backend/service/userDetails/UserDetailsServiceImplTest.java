package com.brasilpanel.backend.service.userDetails;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Ponte entre o banco e o Spring Security. É consultado a cada requisição
 * autenticada, pelo JwtFilter.
 */
class UserDetailsServiceImplTest {

    private static final String EMAIL = "usuario@exemplo.com";

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserDetailsServiceImpl service = new UserDetailsServiceImpl(userRepository);

    @Test
    @DisplayName("carrega o usuário pelo e-mail")
    void loadsUserByEmail() {
        var usuario = UserEntity.builder()
                .name("Usuário Teste").email(EMAIL).password("hash")
                .role(Role.ADMIN).verified(true).build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));

        UserDetails carregado = service.loadUserByUsername(EMAIL);

        // O e-mail é o username: é o que vai no subject do JWT.
        assertThat(carregado.getUsername()).isEqualTo(EMAIL);
        assertThat(carregado.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    @DisplayName("e-mail desconhecido lança UsernameNotFoundException")
    void unknownEmailThrows() {
        when(userRepository.findByEmail("estranho@exemplo.com")).thenReturn(Optional.empty());

        // O Spring converte esta exceção em BadCredentials no login, o que é
        // justamente o que impede enumerar contas pela tela de autenticação.
        assertThatThrownBy(() -> service.loadUserByUsername("estranho@exemplo.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}