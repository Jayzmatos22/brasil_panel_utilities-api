package com.brasilpanel.backend.service.auth;

import com.brasilpanel.backend.model.AuthChallenge;
import com.brasilpanel.backend.model.AuthChallengePurpose;
import com.brasilpanel.backend.model.EmailType;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.auth.AuthChallengeRepository;
import com.brasilpanel.backend.service.email.EmailOutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Mecânica dos desafios por e-mail: emitir, conferir, consumir.
 *
 * <p>Existe uma vez só, e de propósito. Três fluxos dependem dela — login de admin, troca
 * de senha do admin e recuperação de senha — e todos precisam das mesmas garantias:
 * comparação em tempo constante, teto de tentativas, uso único, recusa indistinguível.
 * Uma segunda cópia disso seria livre para divergir, e um ajuste feito numa e esquecido na
 * outra é o modo de falha clássico desse tipo de duplicação.
 *
 * <p>A política de <em>quando</em> exigir desafio não mora aqui: isso varia por fluxo e é
 * decidido por quem chama.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthChallengeService {

    /** Mesma janela do código de cadastro — o usuário já conhece esse prazo. */
    private static final Duration VALIDADE = Duration.ofMinutes(15);

    /**
     * Erros de código por desafio. São 6 dígitos: sem teto, quem chegou até aqui percorre
     * o espaço inteiro. Com 5, a chance de acerto cego fica em 5 em 10^6 por desafio, e
     * cada desafio novo dispara mais um e-mail — ou seja, o ataque se denuncia.
     */
    private static final int MAX_TENTATIVAS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Resposta única para código errado, expirado, consumido ou inexistente. */
    public static final String CODIGO_INVALIDO = "Código inválido ou expirado.";

    private final AuthChallengeRepository challengeRepository;
    private final EmailOutboxService emailOutbox;

    // ── Emissão ──────────────────────────────────────────────────────────────

    /**
     * Emite um desafio e enfileira o e-mail.
     *
     * <p>Invalida os desafios abertos da mesma finalidade antes: dois códigos válidos ao
     * mesmo tempo dobram a superfície de acerto e ainda deixam quem recebeu dois e-mails
     * sem saber qual vale.
     *
     * @param destinatario        para onde o código vai — nem sempre o e-mail da conta
     * @param pendingPasswordHash carga retida até a confirmação; só em {@code PASSWORD_CHANGE}
     */
    @Transactional
    public AuthChallenge issue(UserEntity user, AuthChallengePurpose purpose,
                               String destinatario, String pendingPasswordHash) {
        challengeRepository.invalidateOpen(user.getId(), purpose, LocalDateTime.now());

        AuthChallenge desafio = challengeRepository.save(AuthChallenge.builder()
                .userId(user.getId())
                .purpose(purpose)
                .code(generateCode())
                .pendingPasswordHash(pendingPasswordHash)
                .expiresAt(LocalDateTime.now().plus(VALIDADE))
                .build());

        emailOutbox.enqueueAuthChallenge(destinatario, desafio.getId(), emailTypeDe(purpose));

        // Sem o código no log: log de produção é lido por mais gente e sobrevive mais
        // tempo que o próprio desafio.
        log.info("[AuthChallenge] Desafio {} emitido para o usuário {}.", purpose, user.getId());
        return desafio;
    }

    /** O texto do e-mail muda com a finalidade; o tipo na fila é o que seleciona qual sai. */
    private static EmailType emailTypeDe(AuthChallengePurpose purpose) {
        return purpose == AuthChallengePurpose.PASSWORD_RESET
                ? EmailType.PASSWORD_RESET_CODE
                : EmailType.ADMIN_CHALLENGE_CODE;
    }

    // ── Conferência ──────────────────────────────────────────────────────────

    /**
     * Confere o código e consome o desafio.
     *
     * <p>Toda recusa devolve a mesma mensagem. Distinguir "expirado" de "errado" contaria
     * a quem está tentando se o código existe e se vale a pena insistir.
     *
     * @throws IllegalArgumentException em qualquer recusa
     */
    @Transactional
    public AuthChallenge consume(UserEntity user, AuthChallengePurpose purpose, String code) {
        Optional<AuthChallenge> encontrado = challengeRepository
                .findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                        user.getId(), purpose);

        AuthChallenge desafio = encontrado
                .orElseThrow(() -> new IllegalArgumentException(CODIGO_INVALIDO));

        if (!desafio.isUsable()) {
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }

        if (desafio.getAttempts() >= MAX_TENTATIVAS) {
            // Queimado: consome para que nem o código certo o ressuscite.
            desafio.consume();
            challengeRepository.save(desafio);
            log.warn("[AuthChallenge] Desafio {} do usuário {} queimado por excesso de tentativas.",
                    purpose, user.getId());
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }

        if (!constantTimeEquals(desafio.getCode(), code)) {
            desafio.registerFailedAttempt();
            challengeRepository.save(desafio);
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }

        desafio.consume();
        challengeRepository.save(desafio);
        log.info("[AuthChallenge] Desafio {} confirmado para o usuário {}.", purpose, user.getId());
        return desafio;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Código numérico de 6 dígitos, mesmo formato do cadastro. */
    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /**
     * Comparação em tempo constante.
     *
     * <p>{@code String.equals} sai no primeiro caractere diferente, e essa diferença de
     * tempo, medida em muitas tentativas, vaza o código dígito a dígito. O limite de
     * tentativas já torna o ataque impraticável, mas comparar segredo com {@code equals}
     * é o tipo de hábito que sobrevive a um copiar-e-colar para um lugar sem limite nenhum.
     */
    private boolean constantTimeEquals(String esperado, String recebido) {
        if (esperado == null || recebido == null || esperado.length() != recebido.length()) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < esperado.length(); i++) {
            diff |= esperado.charAt(i) ^ recebido.charAt(i);
        }
        return diff == 0;
    }
}
