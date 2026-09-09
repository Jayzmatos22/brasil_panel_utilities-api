package com.brasilpanel.backend.service.admin;

import com.brasilpanel.backend.model.AuthChallenge;
import com.brasilpanel.backend.model.AuthChallengePurpose;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.service.auth.AuthChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Política do segundo fator do admin: <em>quando</em> exigir e <em>para onde</em> mandar.
 *
 * <p>A mecânica do desafio — gerar, conferir, consumir — mora no
 * {@link AuthChallengeService}, compartilhada com a recuperação de senha. Aqui fica só o
 * que é específico do admin.
 *
 * <p>A senha de admin é ponto único de falha: quem a descobre promove contas, dispara
 * refresh e apaga dados. Com o desafio, ela deixa de bastar — sem o código enviado ao
 * endereço de segurança do dono, o login não emite sessão e a troca de senha não é aplicada.
 *
 * <p><b>Só admin.</b> Usuário comum não passa por nada disto: o custo (um e-mail e uma
 * etapa a mais) só se justifica onde o estrago de um acesso indevido é desproporcional.
 */
@Service
@RequiredArgsConstructor
public class AdminTwoFactorService {

    /** Recusa única, herdada do serviço de desafio para que as mensagens não divirjam. */
    public static final String CODIGO_INVALIDO = AuthChallengeService.CODIGO_INVALIDO;

    private final AuthChallengeService challenges;

    /**
     * Liga/desliga o segundo fator. Existe como válvula de escape: se o provedor de e-mail
     * cair ou a cota estourar, o código nunca chega e o admin fica trancado do lado de fora
     * do próprio painel. Desligar pelo painel do Render destranca em um minuto, sem SQL na
     * produção.
     *
     * <p>Ligado por padrão — uma proteção que precisa ser lembrada não protege.
     */
    @Value("${app.admin.two-factor.enabled:true}")
    private boolean enabled;

    /**
     * Para onde vai o código. Deliberadamente separado do e-mail da conta: se o endereço da
     * conta for comprometido, ou trocado por quem invadiu, o segundo fator continua chegando
     * a quem é dono do sistema. Vazio significa "manda para o e-mail da própria conta", que
     * é o comportamento sensato em desenvolvimento.
     */
    @Value("${app.admin.security-email:}")
    private String securityEmail;

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

    /** Emite o desafio da ação, com a carga que ela precisar reter até a confirmação. */
    public AuthChallenge issue(UserEntity user, AuthChallengePurpose purpose,
                               String pendingPasswordHash) {
        return challenges.issue(user, purpose, recipientFor(user), pendingPasswordHash);
    }

    /** Confere o código da ação e consome o desafio. */
    public AuthChallenge consume(UserEntity user, AuthChallengePurpose purpose, String code) {
        return challenges.consume(user, purpose, code);
    }
}
