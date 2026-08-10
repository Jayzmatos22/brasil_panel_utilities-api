package com.brasilpanel.backend.service.api.viaCep;

import com.brasilpanel.backend.dto.api.viaCep.EnderecoCepDTO;
import com.brasilpanel.backend.exception.customized.ViaCepException;
import com.brasilpanel.backend.exception.customized.ViaCepNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

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
              "unidade": "",
              "bairro": "Bela Vista",
              "localidade": "São Paulo",
              "uf": "SP",
              "estado": "São Paulo",
              "regiao": "Sudeste",
              "ibge": "3550308",
              "gia": "1004",
              "ddd": "11",
              "siafi": "7107"
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

    // ── CEP → endereço ───────────────────────────────────────────────────────

    @Test
    @DisplayName("CEP válido é mapeado para o DTO")
    void validCepIsMappedToDto() {
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(JSON_SP, MediaType.APPLICATION_JSON));

        EnderecoCepDTO resposta = viaCepService.getAddressByCep("01310100");

        assertThat(resposta.logradouro()).isEqualTo("Avenida Paulista");
        assertThat(resposta.municipio()).isEqualTo("São Paulo");
        assertThat(resposta.uf()).isEqualTo("SP");
        server.verify();
    }

    @Test
    @DisplayName("campos que o DTO antigo descartava chegam ao cliente")
    void enrichedFieldsAreExposed() {
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andRespond(withSuccess(JSON_SP, MediaType.APPLICATION_JSON));

        EnderecoCepDTO resposta = viaCepService.getAddressByCep("01310100");

        // O código IBGE é a ponte para ibge_cities.id — chega como Integer, não texto.
        assertThat(resposta.municipioId()).isEqualTo(3550308);
        assertThat(resposta.regiao()).isEqualTo("Sudeste");
        assertThat(resposta.siafi()).isEqualTo("7107");
        assertThat(resposta.gia()).isEqualTo("1004");
        assertThat(resposta.unidade()).isEmpty();
        server.verify();
    }

    @Test
    @DisplayName("código IBGE ausente vira null, não zero")
    void missingIbgeCodeBecomesNull() {
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andRespond(withSuccess("""
                        {"cep": "01310-100", "localidade": "São Paulo", "uf": "SP", "ibge": ""}
                        """, MediaType.APPLICATION_JSON));

        assertThat(viaCepService.getAddressByCep("01310100").municipioId()).isNull();
        server.verify();
    }

    @Test
    @DisplayName("máscara do CEP é normalizada antes da chamada")
    void maskedCepIsNormalized() {
        // A URL esperada não tem hífen: se a normalização falhar, o mock não casa.
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andRespond(withSuccess(JSON_SP, MediaType.APPLICATION_JSON));

        EnderecoCepDTO resposta = viaCepService.getAddressByCep("01310-100");

        assertThat(resposta.cep()).isEqualTo("01310-100");
        server.verify();
    }

    @Test
    @DisplayName("CEP com tamanho inválido falha antes de chamar a API")
    void invalidCepFailsBeforeCallingTheApi() {
        assertThatThrownBy(() -> viaCepService.getAddressByCep("123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8 dígitos");

        // Nenhuma requisição esperada foi registrada: verify() falharia se houvesse chamada.
        server.verify();
    }

    @Test
    @DisplayName("letras no CEP são descartadas e o que sobra é validado")
    void lettersAreStrippedAndRemainderValidated() {
        assertThatThrownBy(() -> viaCepService.getAddressByCep("abc01310"))
                .isInstanceOf(IllegalArgumentException.class);

        server.verify();
    }

    // ── O caso que devolvia 200 com endereço em branco ───────────────────────

    @Test
    @DisplayName("CEP inexistente vira 404, e não um DTO com campos nulos")
    void unknownCepBecomesNotFound() {
        // O ViaCEP responde 200 — o "erro" está no corpo, não no status.
        server.expect(requestTo("https://viacep.com.br/ws/99999999/json/"))
                .andRespond(withSuccess("{\"erro\": \"true\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> viaCepService.getAddressByCep("99999999"))
                .isInstanceOf(ViaCepNotFoundException.class)
                .hasMessageContaining("99999999");
        server.verify();
    }

    @Test
    @DisplayName("o formato antigo do erro (booleano) também é reconhecido")
    void legacyBooleanErrorIsRecognised() {
        server.expect(requestTo("https://viacep.com.br/ws/99999999/json/"))
                .andRespond(withSuccess("{\"erro\": true}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> viaCepService.getAddressByCep("99999999"))
                .isInstanceOf(ViaCepNotFoundException.class);
        server.verify();
    }

    @Test
    @DisplayName("erro da API externa vira ViaCepException (502), não 500 genérico")
    void upstreamErrorBecomesViaCepException() {
        server.expect(requestTo("https://viacep.com.br/ws/01310100/json/"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> viaCepService.getAddressByCep("01310100"))
                .isInstanceOf(ViaCepException.class)
                .hasMessageContaining("ViaCEP");
        server.verify();
    }

    // ── Busca reversa ────────────────────────────────────────────────────────

    @Test
    @DisplayName("busca por logradouro devolve a lista mapeada")
    void searchReturnsMappedList() {
        // Espaço e acento vão codificados na URL pela expansão do template.
        server.expect(requestTo("https://viacep.com.br/ws/SP/S%C3%A3o%20Paulo/Paulista/json/"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("[" + JSON_SP + "]", MediaType.APPLICATION_JSON));

        List<EnderecoCepDTO> resultado =
                viaCepService.searchAddresses("sp", "São Paulo", "Paulista");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).municipioId()).isEqualTo(3550308);
        server.verify();
    }

    @Test
    @DisplayName("busca sem resultado devolve lista vazia — não é erro")
    void emptySearchIsNotAnError() {
        server.expect(requestTo("https://viacep.com.br/ws/SP/S%C3%A3o%20Paulo/Inexistente/json/"))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        assertThat(viaCepService.searchAddresses("SP", "São Paulo", "Inexistente")).isEmpty();
        server.verify();
    }

    @Test
    @DisplayName("termo curto demais falha antes de chamar a API")
    void shortTermFailsBeforeCallingTheApi() {
        assertThatThrownBy(() -> viaCepService.searchAddresses("SP", "SP", "Paulista"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cidade");

        assertThatThrownBy(() -> viaCepService.searchAddresses("SP", "São Paulo", "Pa"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("logradouro");

        server.verify();
    }
}
