package com.brasilpanel.backend.config.health;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A sonda que a plataforma consulta não pode tocar no banco.
 *
 * <p><b>Por quê.</b> O {@code /actuator/health} completo inclui o indicador de
 * DataSource, que roda uma query de validação a cada chamada. O Render consulta o
 * health com frequência bem maior que os 5 minutos de ociosidade que o Neon espera
 * para suspender o compute — então aquele endpoint sozinho mantinha o banco acordado
 * 24 h por dia, e o Neon cobra por tempo acordado. Os schedulers foram corrigidos na
 * #66; esta era a quarta fonte, que ficou de pé.
 *
 * <p>Há um segundo motivo, de estabilidade: com o banco dormindo, um health check que
 * chegue durante o cold start poderia devolver {@code DOWN} e fazer a plataforma
 * considerar a instância doente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LivenessProbeTest {

    @Autowired private MockMvc mockMvc;

    @Value("${management.endpoint.health.group.liveness.include}")
    private String indicadoresDaSonda;

    @Test
    @DisplayName("a sonda responde UP")
    void theProbeAnswersUp() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    /**
     * O matcher de segurança era {@code "/actuator/health"} exato, que NÃO alcança os
     * grupos — subcaminhos. Apontar o Render para a sonda sem corrigir isso daria 401
     * na checagem e o deploy falharia no health check, sem erro nenhum no log da
     * aplicação. É o tipo de defeito que só aparece em produção.
     */
    @Test
    @DisplayName("a sonda é pública, como o health completo")
    void theProbeIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    /**
     * A trava. Acrescentar {@code db} aqui recria o problema inteiro: a plataforma
     * volta a acordar o banco a cada checagem, e a economia da #66 evapora sem que
     * nada no código pareça errado.
     */
    @Test
    @DisplayName("a sonda contém apenas ping — nada que toque no banco")
    void theProbeContainsOnlyPing() {
        assertThat(indicadoresDaSonda).isEqualTo("ping");
    }

    /**
     * O health completo continua com o banco. A mudança é sobre QUEM a plataforma
     * consulta, não sobre deixar de observar o banco.
     */
    @Test
    @DisplayName("o health completo segue existindo")
    void theFullHealthStillExists() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
