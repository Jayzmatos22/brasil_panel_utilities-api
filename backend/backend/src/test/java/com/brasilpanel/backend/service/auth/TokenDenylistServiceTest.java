package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.model.RevokedToken;
import com.brasilpanel.backend.repository.auth.RevokedTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * A peça que faltava para o logout significar alguma coisa num esquema stateless.
 *
 * <p>O {@code jti} já era emitido desde sempre pelo {@code JwtService}, mas nada o
 * consultava: sair apagava o cookie e o token seguia válido por até 24 h.
 */
class TokenDenylistServiceTest {

    private static final String JTI = "11111111-2222-3333-4444-555555555555";

    private RevokedTokenRepository repository;
    private TokenDenylistService service;

    @BeforeEach
    void setUp() {
        repository = mock(RevokedTokenRepository.class);
        service = new TokenDenylistService(repository);
    }

    private static Date daquiAUmaHora() {
        return new Date(System.currentTimeMillis() + 3_600_000);
    }

    @Nested
    @DisplayName("Revogar")
    class Revogar {

        @Test
        @DisplayName("grava o jti e a expiração do próprio token")
        void storesJtiAndExpiry() {
            Date expiracao = daquiAUmaHora();

            service.revoke(JTI, expiracao);

            ArgumentCaptor<RevokedToken> capturado = ArgumentCaptor.forClass(RevokedToken.class);
            verify(repository).save(capturado.capture());
            assertThat(capturado.getValue().getJti()).isEqualTo(JTI);
            assertThat(capturado.getValue().getExpiresAt()).isNotNull();
            assertThat(capturado.getValue().getRevokedAt()).isNotNull();
        }

        @ParameterizedTest(name = "jti = \"{0}\"")
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("jti ausente não vira linha no banco")
        void missingJtiIsIgnored(String jti) {
            service.revoke(jti, daquiAUmaHora());

            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("expiração ausente não vira linha no banco")
        void missingExpiryIsIgnored() {
            service.revoke(JTI, (Date) null);

            verify(repository, never()).save(any());
        }

        /**
         * Dois logouts com o mesmo token são o mesmo fato, não dois. A chave
         * primária é o próprio jti, então a segunda gravação bate na duplicata —
         * e isso não pode virar erro para o usuário que só clicou em "sair".
         */
        @Test
        @DisplayName("revogar o mesmo token duas vezes não é erro")
        void revokingTwiceIsNotAnError() {
            when(repository.save(any())).thenThrow(new DataIntegrityViolationException("duplicata"));

            assertThatCode(() -> service.revoke(JTI, daquiAUmaHora()))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Consultar")
    class Consultar {

        @Test
        @DisplayName("jti revogado é reconhecido")
        void revokedJtiIsRecognized() {
            when(repository.existsById(JTI)).thenReturn(true);

            assertThat(service.isRevoked(JTI)).isTrue();
        }

        @Test
        @DisplayName("jti não revogado passa")
        void unknownJtiPasses() {
            when(repository.existsById(JTI)).thenReturn(false);

            assertThat(service.isRevoked(JTI)).isFalse();
        }

        @ParameterizedTest(name = "jti = \"{0}\"")
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("jti ausente não consulta o banco")
        void missingJtiSkipsTheQuery(String jti) {
            assertThat(service.isRevoked(jti)).isFalse();

            verify(repository, never()).existsById(anyString());
        }
    }

    @Nested
    @DisplayName("Expurgo")
    class Expurgo {

        @Test
        @DisplayName("remove o que já expirou e devolve a contagem")
        void prunesExpired() {
            when(repository.deleteExpiradosAntesDe(any(LocalDateTime.class))).thenReturn(7);

            assertThat(service.prune()).isEqualTo(7);
        }

        @Test
        @DisplayName("o corte é o instante atual, não uma data fixa")
        void cutoffIsNow() {
            LocalDateTime antes = LocalDateTime.now();

            service.prune();

            ArgumentCaptor<LocalDateTime> corte = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(repository).deleteExpiradosAntesDe(corte.capture());
            assertThat(corte.getValue()).isBetween(antes, LocalDateTime.now());
        }
    }
}
