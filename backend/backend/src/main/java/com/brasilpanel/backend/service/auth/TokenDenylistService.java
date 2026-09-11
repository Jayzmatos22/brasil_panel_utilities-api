package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.model.RevokedToken;
import com.brasilpanel.backend.repository.auth.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

/**
 * Marca tokens como revogados e responde se um {@code jti} está revogado.
 *
 * <p>É o que falta para o logout significar alguma coisa num esquema stateless.
 * O {@code jti} já era emitido pelo {@code JwtService} desde sempre, mas nada o
 * consultava; esta classe é o consultante.
 *
 * <p><b>Custo.</b> Uma leitura por chave primária a cada requisição autenticada.
 * Requisição anônima não paga nada — o filtro só chega aqui se houver token. As
 * rotas públicas do painel, que são a maioria do tráfego, não são afetadas.
 *
 * <p><b>Por que não um cache em memória na frente.</b> Seria mais rápido, mas a
 * denylist precisa estar certa no instante do logout, e um cache de resultado
 * negativo atrasaria o efeito pelo tempo do TTL. Manter o conjunto inteiro em
 * memória resolveria isso, só que deixaria de funcionar em silêncio no dia em
 * que houver mais de uma instância: o logout feito numa não seria visto pela
 * outra. A leitura direta está correta nos dois cenários.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenDenylistService {

    private final RevokedTokenRepository repository;

    /**
     * Revoga o token. Idempotente: revogar de novo o mesmo {@code jti} não é erro.
     *
     * @param jti        identificador do token
     * @param expiration instante de expiração do próprio token
     */
    @Transactional
    public void revoke(String jti, Date expiration) {
        if (jti == null || jti.isBlank() || expiration == null) {
            // Token sem jti não é revogável individualmente. Não é motivo para
            // o logout falhar: o cookie é apagado de qualquer forma.
            return;
        }

        LocalDateTime expiraEm = LocalDateTime.ofInstant(expiration.toInstant(), ZoneId.systemDefault());
        try {
            repository.save(new RevokedToken(jti, expiraEm, LocalDateTime.now()));
        } catch (DataIntegrityViolationException e) {
            // Logout repetido com o mesmo token: o fato já está registrado.
            log.debug("[Denylist] jti já revogado, nada a fazer.");
        }
    }

    /** Sobrecarga para quem já tem o instante como {@link Instant}. */
    @Transactional
    public void revoke(String jti, Instant expiration) {
        revoke(jti, expiration == null ? null : Date.from(expiration));
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String jti) {
        return jti != null && !jti.isBlank() && repository.existsById(jti);
    }

    /** Remove as linhas cujo token já expirou sozinho. Ver {@code RevokedTokenRepository}. */
    @Transactional
    public int prune() {
        return repository.deleteExpiradosAntesDe(LocalDateTime.now());
    }
}
