package com.brasilpanel.backend.config.webConfig;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

@Configuration
public class WebConfig {

    /** Padrão para APIs que respondem de um endereço só. */
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    /**
     * O DNS do ipeadata.gov.br devolve dois endereços e um deles nunca completa o
     * handshake TCP — medido: 45.171.102.13 conecta em 27ms e entrega a série em
     * 384ms, enquanto 177.15.137.13 fica pendurado além de 12s sem conectar.
     * Como o IpeaService percorre os endereços em sequência, cada candidato morto
     * custa um connect timeout inteiro, e é esse valor — não o read timeout — que
     * domina a latência da página. 2s é folgado para um host que conecta em 27ms.
     */
    private static final Duration IPEA_CONNECT_TIMEOUT = Duration.ofSeconds(2);

    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    @Bean
    @Primary
    public RestClient restClient() {
        return buildRestClient(CONNECT_TIMEOUT);
    }

    /**
     * Cliente exclusivo do IPEA, separado apenas pelo connect timeout mais curto.
     * Beans distintos porque o timeout é do {@code HttpClient}, não da requisição:
     * não há como encurtá-lo por chamada sobre um cliente compartilhado.
     */
    @Bean
    public RestClient ipeaRestClient() {
        return buildRestClient(IPEA_CONNECT_TIMEOUT);
    }

    private RestClient buildRestClient(Duration connectTimeout) {
        // BCB API retorna JSON com Content-Type: text/html — workaround necessário
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(List.of(
                MediaType.APPLICATION_JSON,
                MediaType.TEXT_HTML,
                MediaType.TEXT_PLAIN
        ));

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        // Read timeout é tão essencial quanto o connect timeout: APIs como IPEA e BCB
        // aceitam a conexão e depois demoram indefinidamente para responder. Sem este
        // limite, a thread do Tomcat fica presa até o cliente desistir — algumas
        // requisições assim esgotam o pool e derrubam o painel inteiro.
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(READ_TIMEOUT);

        return RestClient.builder()
                .requestFactory(requestFactory)
                .messageConverters(converters -> {
                    converters.removeIf(MappingJackson2HttpMessageConverter.class::isInstance);
                    converters.add(converter);
                })
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                .defaultHeader("Accept", "application/json, text/plain, */*")
                .defaultHeader("Accept-Language", "pt-BR,pt;q=0.9")
                .defaultHeader("Referer", "https://www.bcb.gov.br/")
                .build();
    }
}
