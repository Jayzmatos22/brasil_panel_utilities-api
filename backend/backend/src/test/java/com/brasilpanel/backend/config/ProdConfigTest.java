package com.brasilpanel.backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prende o que o perfil {@code prod} PRECISA dizer, lendo o arquivo como o Spring leria.
 *
 * <p>Não sobe contexto de propósito: o perfil prod exige DATABASE_URL, MAIL_HOST e
 * companhia, que não existem no CI. O que interessa aqui é o conteúdo do YAML — se a
 * linha sumir num merge, é este teste que avisa, e não o primeiro usuário cujo cookie
 * de sessão saiu sem {@code Secure}.
 */
class ProdConfigTest {

    private static final Properties PROD = carregar("application-prod.yml");

    private static Properties carregar(String arquivo) {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource(arquivo));
        return yaml.getObject();
    }

    /**
     * Antes, {@code app.auth.cookie.secure} vinha só do application.yaml como
     * {@code ${COOKIE_SECURE:false}} — a variável faltando no Render rebaixava o cookie
     * para HTTP sem nenhum aviso. Produção nunca é localhost; o valor tem que ser fixo.
     */
    @Test
    @DisplayName("cookie de sessão é Secure em produção, sem depender de variável de ambiente")
    void sessionCookieIsSecureInProd() {
        assertThat(PROD.getProperty("app.auth.cookie.secure"))
                .as("app.auth.cookie.secure em application-prod.yml")
                .isEqualTo("true");
    }

    /**
     * O TLS termina no proxy do Render; sem esta estratégia o Tomcat vê HTTP puro,
     * {@code request.isSecure()} é falso e o Spring Security NÃO emite HSTS — o header
     * configurado no SecurityConfig existiria só no papel.
     */
    @Test
    @DisplayName("produção confia nos headers X-Forwarded-* do proxy")
    void prodTrustsForwardedHeaders() {
        assertThat(PROD.getProperty("server.forward-headers-strategy"))
                .as("server.forward-headers-strategy em application-prod.yml")
                .isEqualTo("framework");
    }
}
