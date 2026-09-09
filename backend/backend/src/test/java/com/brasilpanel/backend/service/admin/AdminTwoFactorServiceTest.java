package com.brasilpanel.backend.service.admin;

import com.brasilpanel.backend.model.AuthChallengePurpose;
import com.brasilpanel.backend.model.Role;
import com.brasilpanel.backend.model.UserEntity;
import com.brasilpanel.backend.service.auth.AuthChallengeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

/**
 * Aqui mora só a política: <em>quando</em> exigir o segundo fator e <em>para onde</em>
 * mandar o código. A mecânica do desafio é do {@link AuthChallengeService} e tem testes
 * próprios — duplicá-los aqui só criaria dois lugares para atualizar.
 */
@ExtendWith(MockitoExtension.class)
class AdminTwoFactorServiceTest {

    private static final String CONTA = "admin@brasilpanel.com";
    private static final String SEGURANCA = "dono@exemplo.com";

    @Mock private AuthChallengeService challenges;

    @InjectMocks private AdminTwoFactorService service;

    private UserEntity admin;
    private UserEntity comum;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "securityEmail", SEGURANCA);

        admin = UserEntity.builder()
                .id(UUID.randomUUID()).name("Dono").email(CONTA).password("hash")
                .role(Role.ADMIN).verified(true).build();

        comum = UserEntity.builder()
                .id(UUID.randomUUID()).name("Fulano").email("fulano@exemplo.com").password("hash")
                .role(Role.USER).verified(true).build();
    }

    @Test
    @DisplayName("exigido do admin, dispensado do usuário comum")
    void appliesOnlyToAdmin() {
        assertThat(service.isRequiredFor(admin)).isTrue();
        // Cobrar segundo fator de todo mundo custaria um e-mail por login sem proteger
        // nada proporcional: conta comum não promove nem apaga dados.
        assertThat(service.isRequiredFor(comum)).isFalse();
    }

    @Test
    @DisplayName("a válvula de escape desliga o segundo fator até para o admin")
    void killSwitchDisablesEvenForAdmin() {
        ReflectionTestUtils.setField(service, "enabled", false);

        // Sem esta saída, uma queda do provedor de e-mail tranca o dono do lado de fora
        // do próprio painel, sem caminho que não passe por SQL em produção.
        assertThat(service.isRequiredFor(admin)).isFalse();
    }

    @Test
    @DisplayName("o código vai para o endereço de segurança, não para o e-mail da conta")
    void codeGoesToSecurityAddress() {
        // A separação é o ponto: se o e-mail da conta for comprometido — ou trocado por
        // quem invadiu —, o segundo fator continua chegando ao dono.
        assertThat(service.recipientFor(admin)).isEqualTo(SEGURANCA);
    }

    @Test
    @DisplayName("sem endereço de segurança configurado, cai no e-mail da conta")
    void fallsBackToAccountEmail() {
        ReflectionTestUtils.setField(service, "securityEmail", "  ");

        assertThat(service.recipientFor(admin)).isEqualTo(CONTA);
    }

    @Test
    @DisplayName("emitir manda o desafio para o endereço de segurança")
    void issueTargetsTheSecurityAddress() {
        service.issue(admin, AuthChallengePurpose.LOGIN, null);

        verify(challenges).issue(admin, AuthChallengePurpose.LOGIN, SEGURANCA, null);
    }
}
