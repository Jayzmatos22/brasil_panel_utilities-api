package com.brasilpanel.backend.service.api.viaCep;

import com.brasilpanel.backend.dto.api.viaCep.ViaCepResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Serviço puramente HTTP — testado com {@link MockRestServiceServer}, e não com
 * Mockito.
 *
 * <p>Mockar o {@code RestClient} com Mockito exige encadear quatro stubs
 * ({@code get() → uri() → retrieve() → body()}) com tipos crus, porque
 * {@code uri()} devolve {@code RequestHeadersSpec<?>}. O teste resultante é
 * frágil e, pior, verifica apenas os próprios mocks: a desserialização do JSON
 * nunca é exercitada.
 *
 * <p>Aqui a requisição real é interceptada e respondida com JSON, então o que se
 * testa é o comportamento de verdade — inclusive o mapeamento para o record.
 */
class ViaCepServiceTest {

    private static final String JSON_SP = """
            {
              "cep": "01310-100",
              "logradouro": "Avenida Paulista",
              "complemento": "de 612 a 1510 - lado par",
              "bairro": "Bela Vista",
              "localidade": "São Paulo",
              "uf": "SP",
              "estado": "São Paulo",
              "ddd": "11"
            }
            """;

    private MockRestServiceServer server;
    private ViaCepService viaCepService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        viaCepService = new ViaCepService(builder.build());
    }

    @Test
    @DisplayName("CEP válido é mapeado para o DTO")
    void validCepIsMappedToDto() {
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(JSON_SP, MediaType.APPLICATION_JSON));

        ViaCepResponseDTO resposta = viaCepService.getAdressByCep("01310100");

        assertThat(resposta.logradouro()).isEqualTo("Avenida Paulista");
        assertThat(resposta.localidade()).isEqualTo("São Paulo");
        assertThat(resposta.uf()).isEqualTo("SP");
        server.verify();
    }

    @Test
    @DisplayName("máscara do CEP é normalizada antes da chamada")
    void maskedCepIsNormalized() {
        // A URL esperada não tem hífen: se a normalização falhar, o mock não casa.
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andRespond(withSuccess(JSON_SP, MediaType.APPLICATION_JSON));

        ViaCepResponseDTO resposta = viaCepService.getAdressByCep("01310-100");

        assertThat(resposta.cep()).isEqualTo("01310-100");
        server.verify();
    }

    @Test
    @DisplayName("CEP com tamanho inválido falha antes de chamar a API")
    void invalidCepFailsBeforeCallingTheApi() {
        assertThatThrownBy(() -> viaCepService.getAdressByCep("123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8 dígitos");

        // Nenhuma requisição esperada foi registrada: verify() falharia se houvesse chamada.
        server.verify();
    }

    @Test
    @DisplayName("letras no CEP são descartadas e o que sobra é validado")
    void lettersAreStrippedAndRemainderValidated() {
        assertThatThrownBy(() -> viaCepService.getAdressByCep("abc01310"))
                .isInstanceOf(IllegalArgumentException.class);

        server.verify();
    }

    @Test
    @DisplayName("erro da API externa é propagado, não silenciado")
    void upstreamErrorIsPropagated() {
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> viaCepService.getAdressByCep("01310100"))
                .isInstanceOf(Exception.class);
    }
}