package com.brasilpanel.backend.service.admin;

import com.brasilpanel.backend.model.AdminChallenge;
import com.brasilpanel.backend.model.AdminChallengePurpose;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.repository.admin.AdminChallengeRepository;
import com.brasilpanel.backend.service.email.EmailOutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Segundo fator por e-mail das ações sensíveis do admin.
 *
 * <p>A senha de admin é ponto único de falha: quem a descobre promove contas, dispara
 * refresh e apaga dados. Aqui ela deixa de bastar — sem o código enviado ao endereço de
 * segurança do dono, o login não emite sessão e a troca de senha não é aplicada.
 *
 * <p><b>Só admin.</b> Usuário comum não passa por nada disto: o custo (um e-mail e uma
 * etapa a mais) só se justifica onde o estrago de um acesso indevido é desproporcional.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminTwoFactorService {

    /** Mesma janela do código de cadastro — o usuário já conhece esse prazo. */
    private static final Duration VALIDADE = Duration.ofMinutes(15);

    /**
     * Erros de código por desafio. São 6 dígitos: sem teto, quem já tem a senha percorre
     * o espaço inteiro. Com 5, a chance de acerto cego fica em 5 em 10^6 por desafio, e
     * cada novo desafio dispara mais um e-mail — ou seja, o ataque se denuncia.
     */
    private static final int MAX_TENTATIVAS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Resposta única para código errado, expirado, consumido ou inexistente. */
    public static final String CODIGO_INVALIDO = "Código inválido ou expirado.";

    private final AdminChallengeRepository challengeRepository;
    private final EmailOutboxService emailOutbox;

    /**
     * Liga/desliga o segundo fator. Existe como válvula de escape: se o Resend cair ou a
     * cota estourar, o código nunca chega e o admin fica trancado do lado de fora do
     * próprio painel. Desligar pelo painel do Render destranca em um minuto, sem SQL na
     * produção.
     *
     * <p>Ligado por padrão — uma proteção que precisa ser lembrada não protege.
     */
    @Value("${app.admin.two-factor.enabled:true}")
    private boolean enabled;

    /**
     * Para onde vai o código. Deliberadamente separado do e-mail da conta: se o endereço
     * da conta for comprometido, ou trocado por quem invadiu, o segundo fator continua
     * chegando a quem é dono do sistema. Vazio significa "manda para o e-mail da própria
     * conta", que é o comportamento sensato em desenvolvimento.
     */
    @Value("${app.admin.security-email:}")
    private String securityEmail;

    // ── Consulta ─────────────────────────────────────────────────────────────

    /** Se esta ação, para este usuário, exige confirmação por e-mail. */
    public boolean isRequiredFor(UserEntity user) {
        return enabled && user.getRole() == Role.ADMIN;
    }

    /** Endereço que recebe o código — o de segurança, ou o da conta se não configurado. */
    public String recipientFor(UserEntity user) {
        return (securityEmail == null || securityEmail.isBlank())
                ? user.getEmail()
                : securityEmail.trim();
    }

    // ── Emissão ──────────────────────────────────────────────────────────────

    /**
     * Emite um desafio e enfileira o e-mail.
     *
     * <p>Invalida os desafios abertos da mesma finalidade antes: dois códigos válidos ao
     * mesmo tempo dobram a superfície de acerto e ainda confundem quem recebeu dois
     * e-mails sem saber qual vale.
     *
     * @param pendingPasswordHash hash da senha nova, só em {@code PASSWORD_CHANGE}
     */
    @Transactional
    public AdminChallenge issue(UserEntity user, AdminChallengePurpose purpose,
                                String pendingPasswordHash) {
        challengeRepository.invalidateOpen(user.getId(), purpose, LocalDateTime.now());

        AdminChallenge desafio = challengeRepository.save(AdminChallenge.builder()
                .userId(user.getId())
                .purpose(purpose)
                .code(generateCode())
                .pendingPasswordHash(pendingPasswordHash)
                .expiresAt(LocalDateTime.now().plus(VALIDADE))
                .build());

        emailOutbox.enqueueAdminChallenge(recipientFor(user), desafio.getId());

        // Sem o código no log: log de produção é lido por mais gente e sobrevive mais
        // tempo que o próprio desafio.
        log.info("[Admin2FA] Desafio {} emitido para o usuário {}.", purpose, user.getId());
        return desafio;
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
    public AdminChallenge consume(UserEntity user, AdminChallengePurpose purpose, String code) {
        Optional<AdminChallenge> encontrado = challengeRepository
                .findFirstByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                        user.getId(), purpose);

        AdminChallenge desafio = encontrado
                .orElseThrow(() -> new IllegalArgumentException(CODIGO_INVALIDO));

        if (!desafio.isUsable()) {
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }

        if (desafio.getAttempts() >= MAX_TENTATIVAS) {
            // Queimado: consome para que nem o código certo o ressuscite.
            desafio.consume();
            challengeRepository.save(desafio);
            log.warn("[Admin2FA] Desafio {} do usuário {} queimado por excesso de tentativas.",
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
        log.info("[Admin2FA] Desafio {} confirmado para o usuário {}.", purpose, user.getId());
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
     * tentativas já torna o ataque impraticável aqui, mas comparar segredo com
     * {@code equals} é o tipo de hábito que sobrevive a um copiar-e-colar para um lugar
     * sem limite nenhum.
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
