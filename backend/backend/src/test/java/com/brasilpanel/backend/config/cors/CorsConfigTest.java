package com.brasilpanel.backend.config.cors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private static CorsConfiguration configFor(String allowedOrigins) {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", allowedOrigins);

        UrlBasedCorsConfigurationSource source =
                (UrlBasedCorsConfigurationSource) corsConfig.corsConfigurationSource();
        return source.getCorsConfigurations().get("/**");
    }

    @Test
    @DisplayName("origem única é preservada como está")
    void origemUnica() {
        assertThat(configFor("https://painel.exemplo.com").getAllowedOrigins())
                .containsExactly("https://painel.exemplo.com");
    }

    /**
     * "https://a, https://b" é a grafia natural de uma env var com várias origens.
     * Sem trim(), a segunda virava " https://b" e nunca casava com o header Origin —
     * falha silenciosa, sem erro nenhum no boot.
     */
    @Test
    @DisplayName("espaços em volta das origens são removidos")
    void espacosSaoRemovidos() {
        assertThat(configFor("https://a.exemplo.com, https://b.exemplo.com").getAllowedOrigins())
                .containsExactly("https://a.exemplo.com", "https://b.exemplo.com");
    }

    @Test
    @DisplayName("entradas vazias são descartadas em vez de virar origem em branco")
    void entradasVaziasSaoDescartadas() {
        assertThat(configFor("https://a.exemplo.com,,  ,https://b.exemplo.com").getAllowedOrigins())
                .containsExactly("https://a.exemplo.com", "https://b.exemplo.com");
    }

    @Test
    @DisplayName("credenciais habilitadas, e nenhuma origem coringa")
    void credenciaisSemCoringa() {
        CorsConfiguration config = configFor("https://painel.exemplo.com");

        assertThat(config.getAllowCredentials()).isTrue();
        assertThat(config.getAllowedOrigins()).doesNotContain("*");
    }
}
