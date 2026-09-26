package com.brasilpanel.backend.config.datasource;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * O pool de produção não pode segurar conexão ociosa.
 *
 * <p><b>Por quê.</b> O Neon cobra por tempo de compute acordado e suspende o banco
 * após 5 minutos de ociosidade — e um banco com conexão aberta não conta como ocioso.
 * Os defaults do Spring Boot mantêm {@code minimumIdle = maximumPoolSize = 10}: dez
 * conexões abertas para sempre, recriadas a cada 30 minutos pelo {@code maxLifetime}.
 * Com isso o compute jamais suspende.
 *
 * <p>Foi o que aconteceu entre 8 e 24 de setembro de 2026: o histórico de operações do
 * Neon não registra nenhum {@code Suspend compute} no intervalo, e ~16 dias de compute
 * ligado a 0,25 CU consomem praticamente a cota gratuita inteira de 100 CU-h. Nem a #66
 * (tarefas de hora em hora) nem a #67 (health check sem banco) moveram a conta, porque
 * o custo nunca foi o volume de query — era o pool.
 *
 * <p>Este teste é a trava. Ele lê o YAML de produção direto, sem subir contexto: subir
 * o perfil {@code prod} exigiria banco, SMTP e as chaves das APIs externas, e o que
 * precisa ser garantido aqui é o conteúdo do arquivo que vai para o Render.
 */
class ConnectionPoolCostTest {

    /** Ociosidade que o Neon espera antes de suspender o compute. */
    private static final int OCIOSIDADE_DO_NEON_MS = 5 * 60 * 1000;

    private static Properties prod;

    @BeforeAll
    static void lerYamlDeProducao() {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application-prod.yml"));
        yaml.afterPropertiesSet();
        prod = yaml.getObject();
        assertThat(prod).as("application-prod.yml precisa estar no classpath").isNotNull();
    }

    private static int inteiro(String chave) {
        String valor = prod.getProperty(chave);
        assertThat(valor).as("%s não está definido em application-prod.yml", chave).isNotNull();
        return Integer.parseInt(valor.trim());
    }

    /**
     * O número que decide a conta. Qualquer valor acima de zero significa pelo menos
     * uma conexão aberta o tempo todo, e o compute nunca suspende.
     */
    @Test
    @DisplayName("minimum-idle é 0 — o pool esvazia quando não há tráfego")
    void thePoolDrainsToZeroWhenIdle() {
        assertThat(inteiro("spring.datasource.hikari.minimum-idle")).isZero();
    }

    /**
     * De nada adianta o piso ser zero se a conexão só for devolvida depois da janela
     * de suspensão: o pool soltaria a última conexão tarde demais e a janela nunca
     * abriria. Precisa ser confortavelmente menor que os 5 minutos do Neon.
     */
    @Test
    @DisplayName("idle-timeout é menor que a ociosidade que o Neon espera")
    void theIdleTimeoutFitsInsideNeonsSuspendWindow() {
        assertThat(inteiro("spring.datasource.hikari.idle-timeout"))
                .isLessThan(OCIOSIDADE_DO_NEON_MS);
    }

    /**
     * Keepalive é um ping periódico na conexão ociosa. Ligá-lo desfaz os dois testes
     * acima sem alterar nenhum deles: as conexões continuariam sendo devolvidas, mas o
     * ping contaria como atividade e o banco seguiria acordado.
     */
    @Test
    @DisplayName("keepalive está desligado — nada fica cutucando o banco parado")
    void nothingPingsTheIdleDatabase() {
        assertThat(inteiro("spring.datasource.hikari.keepalive-time")).isZero();
    }

    /**
     * Os valores são fixos no YAML, sem {@code ${VAR:default}}, de propósito. Uma
     * variável de ambiente ausente ou mal digitada cairia no default do Hikari
     * ({@code minimumIdle = maximumPoolSize}) e ressuscitaria a conta em silêncio.
     */
    @Test
    @DisplayName("os valores são literais, não variáveis de ambiente")
    void theValuesCannotBeUndoneByAMissingEnvVar() {
        assertThat(prod.getProperty("spring.datasource.hikari.minimum-idle")).doesNotContain("${");
        assertThat(prod.getProperty("spring.datasource.hikari.idle-timeout")).doesNotContain("${");
        assertThat(prod.getProperty("spring.datasource.hikari.keepalive-time")).doesNotContain("${");
    }

    /**
     * O próprio Hikari valida as faixas — {@code idleTimeout} tem piso de 10 s, e
     * {@code keepaliveTime}, quando ligado, de 30 s. Um valor fora da faixa é
     * silenciosamente trocado pelo default em tempo de boot, que é justamente o
     * comportamento que este arquivo existe para evitar. Aqui isso vira falha de teste
     * em vez de surpresa em produção.
     */
    @Test
    @DisplayName("o Hikari aceita a combinação sem cair de volta nos defaults")
    void hikariAcceptsTheseValues() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/validacao");
        config.setMaximumPoolSize(inteiro("spring.datasource.hikari.maximum-pool-size"));
        config.setMinimumIdle(inteiro("spring.datasource.hikari.minimum-idle"));
        config.setIdleTimeout(inteiro("spring.datasource.hikari.idle-timeout"));
        config.setKeepaliveTime(inteiro("spring.datasource.hikari.keepalive-time"));

        config.validate();

        assertThat(config.getMinimumIdle()).isZero();
        assertThat(config.getIdleTimeout()).isLessThan(OCIOSIDADE_DO_NEON_MS);
        assertThat(config.getKeepaliveTime()).isZero();
    }
}
