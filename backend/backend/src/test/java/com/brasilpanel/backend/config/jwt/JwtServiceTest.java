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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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

    // ── Invalidação por troca de senha ───────────────────────────────────────

    /**
     * O JWT é stateless: não há store de sessão para limpar. Sem esta regra,
     * trocar a senha não derrubava as sessões abertas — o token anterior valia
     * até expirar, e quem tivesse acesso indevido continuava dentro apesar da
     * troca, que é justamente a ação tomada para expulsá-lo.
     */
    @Test
    @DisplayName("token emitido ANTES da troca de senha é recusado")
    void tokenIssuedBeforePasswordChangeIsRejected() {
        String token = jwtService.generateToken(user);
        assertThat(jwtService.isTokenValid(token, user))
                .as("antes da troca, o token vale")
                .isTrue();

        user.setPasswordChangedAt(LocalDateTime.now().plusSeconds(5));

        assertThat(jwtService.isTokenValid(token, user)).isFalse();
    }

    @Test
    @DisplayName("token emitido DEPOIS da troca de senha continua válido")
    void tokenIssuedAfterPasswordChangeStaysValid() {
        user.setPasswordChangedAt(LocalDateTime.now().minusMinutes(10));

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    @DisplayName("sem troca registrada, nada é invalidado")
    void nullPasswordChangedAtInvalidatesNothing() {
        String token = jwtService.generateToken(user);

        assertThat(user.getPasswordChangedAt()).isNull();
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    /**
     * O caso de borda que quebraria a implementação ingênua. O `iat` do JWT tem
     * precisão de SEGUNDO; o timestamp do banco, de microssegundo. Comparando sem
     * truncar, o token emitido logo após a troca pareceria anterior a ela — o
     * usuário trocaria a senha, logaria e cairia para fora na requisição seguinte.
     */
    @Test
    @DisplayName("token emitido no mesmo segundo da troca sobrevive")
    void tokenIssuedInTheSameSecondSurvives() {
        String token = jwtService.generateToken(user);

        // Mesmo segundo do iat, mas com microssegundos à frente.
        user.setPasswordChangedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS).plusNanos(900_000_000));

        assertThat(jwtService.isTokenValid(token, user))
                .as("truncar para segundos evita expulsar quem acabou de logar")
                .isTrue();
    }

    @Test
    @DisplayName("a regra não se aplica a UserDetails que não seja UserEntity")
    void nonUserEntityIsUnaffected() {
        String token = jwtService.generateToken(user);
        UserDetails outro = User.withUsername(user.getUsername())
                .password("irrelevante").authorities("ROLE_USER").build();

        assertThat(jwtService.isTokenValid(token, outro)).isTrue();
    }
}
