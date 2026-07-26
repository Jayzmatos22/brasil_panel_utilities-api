package com.brasilpanel.backend.config.jwt;

import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * O secret e a expiração chegam por {@code @Value}, então são injetados aqui via
 * ReflectionTestUtils — não há colaborador a mockar.
 */
class JwtServiceTest {

    private static final String SECRET = "secret-de-teste-com-mais-de-32-bytes-para-hs256";
    private static final long ONE_DAY_MS = 86_400_000L;

    private JwtService jwtService;
    private UserEntity user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", ONE_DAY_MS);

        user = UserEntity.builder()
                .name("Usuário Teste")
                .email("usuario@exemplo.com")
                .password("hash-bcrypt")
                .role(Role.USER)
                .verified(true)
                .build();
    }

    @Test
    @DisplayName("token gerado carrega o e-mail como subject")
    void generatedTokenCarriesEmailAsSubject() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.extractEmail(token)).isEqualTo("usuario@exemplo.com");
    }

    @Test
    @DisplayName("token é válido para o usuário que o originou")
    void tokenIsValidForItsOwner() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    @DisplayName("token não é válido para outro usuário")
    void tokenIsNotValidForAnotherUser() {
        String token = jwtService.generateToken(user);

        UserDetails outro = User.withUsername("outro@exemplo.com")
                .password("hash")
                .authorities("ROLE_USER")
                .build();

        assertThat(jwtService.isTokenValid(token, outro)).isFalse();
    }

    @Test
    @DisplayName("token expirado é rejeitado na leitura")
    void expiredTokenIsRejected() {
        // Expiração negativa: o token já nasce vencido.
        ReflectionTestUtils.setField(jwtService, "expirationMs", -1000L);
        String expirado = jwtService.generateToken(user);

        assertThatThrownBy(() -> jwtService.extractEmail(expirado))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("token assinado com outro secret é rejeitado")
    void tokenSignedWithAnotherSecretIsRejected() {
        String token = jwtService.generateToken(user);

        // Simula um token forjado: mesma estrutura, chave diferente.
        JwtService outroServico = new JwtService();
        ReflectionTestUtils.setField(outroServico, "secret", "outro-secret-completamente-diferente-32b+");
        ReflectionTestUtils.setField(outroServico, "expirationMs", ONE_DAY_MS);

        assertThatThrownBy(() -> outroServico.extractEmail(token))
                .isInstanceOf(io.jsonwebtoken.security.SignatureException.class);
    }

    @Test
    @DisplayName("expiração exposta corresponde à configurada")
    void expirationMatchesConfiguration() {
        assertThat(jwtService.getExpirationMs()).isEqualTo(ONE_DAY_MS);
    }
}