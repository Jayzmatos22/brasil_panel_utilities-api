package com.brasilpanel.backend.config.seed;

import com.brasilpanel.backend.model.Bank;
import com.brasilpanel.backend.model.IbgeState;
import com.brasilpanel.backend.repository.static_data.BankRepository;
import com.brasilpanel.backend.repository.static_data.IbgeStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Este seeder roda no boot de produção e fala com duas APIs externas. A
 * propriedade que mais importa não é carregar os dados: é <b>não derrubar a
 * aplicação</b> quando a BrasilAPI ou o IBGE estiverem fora do ar.
 */
class StaticDataSeederTest {

    private static final String URL_BANCOS  = "https://brasilapi.com.br/api/banks/v1";
    private static final String URL_ESTADOS = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

    private static final String JSON_BANCOS = """
            [
              {"ispb": "00000000", "name": "BANCO TESTE", "code": 1, "fullName": "Banco de Teste S.A."},
              {"ispb": "11111111", "name": "OUTRO BANCO", "code": 33, "fullName": "Outro Banco S.A."}
            ]
            """;

    /** Casos que a BrasilAPI realmente devolve: entradas sem código e sem nome. */
    private static final String JSON_BANCOS_SUJOS = """
            [
              {"ispb": "00000000", "name": "BANCO VALIDO", "code": 1, "fullName": "Banco Valido S.A."},
              {"ispb": "22222222", "name": "SEM CODIGO", "code": null, "fullName": "Sem Codigo S.A."},
              {"ispb": "33333333", "name": null, "code": 99, "fullName": "Sem Nome S.A."},
              {"ispb": "44444444", "name": "CODIGO ZERO", "code": 0, "fullName": "Codigo Zero S.A."}
            ]
            """;

    private static final String JSON_ESTADOS = """
            [
              {"id": 11, "sigla": "RO", "nome": "Rondonia",
               "regiao": {"id": 1, "sigla": "N", "nome": "Norte"}},
              {"id": 35, "sigla": "SP", "nome": "Sao Paulo",
               "regiao": {"id": 3, "sigla": "SE", "nome": "Sudeste"}}
            ]
            """;

    private MockRestServiceServer server;
    private BankRepository bankRepository;
    private IbgeStateRepository stateRepository;
    private StaticDataSeeder seeder;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();

        bankRepository = mock(BankRepository.class);
        stateRepository = mock(IbgeStateRepository.class);
        seeder = new StaticDataSeeder(builder.build(), bankRepository, stateRepository);
    }

    // ── Bancos ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("carrega os bancos quando a tabela está vazia")
    void bancos_tabelaVazia_carregaDaApi() {
        when(bankRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_BANCOS))
                .andRespond(withSuccess(JSON_BANCOS, MediaType.APPLICATION_JSON));

        seeder.seedBanks();

        ArgumentCaptor<List<Bank>> captor = ArgumentCaptor.forClass(List.class);
        verify(bankRepository).saveAll(captor.capture());
        assertThat(captor.getValue())
                .extracting(Bank::getCode)
                .containsExactly(1, 33);
        server.verify();
    }

    @Test
    @DisplayName("tabela já populada não gera chamada à BrasilAPI")
    void bancos_tabelaPopulada_naoChamaApi() {
        when(bankRepository.count()).thenReturn(300L);

        seeder.seedBanks();

        server.verify();   // nenhuma requisição esperada = nenhuma feita
        verify(bankRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("descarta bancos sem código, sem nome e com código zero")
    void bancos_descartaEntradasInvalidas() {
        when(bankRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_BANCOS))
                .andRespond(withSuccess(JSON_BANCOS_SUJOS, MediaType.APPLICATION_JSON));

        seeder.seedBanks();

        ArgumentCaptor<List<Bank>> captor = ArgumentCaptor.forClass(List.class);
        verify(bankRepository).saveAll(captor.capture());
        assertThat(captor.getValue())
                .as("só o banco válido deve sobrar")
                .extracting(Bank::getName)
                .containsExactly("BANCO VALIDO");
    }

    @Test
    @DisplayName("lista vazia não persiste nada")
    void bancos_listaVazia_naoPersiste() {
        when(bankRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_BANCOS))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        seeder.seedBanks();

        verify(bankRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("BrasilAPI fora do ar não derruba o boot")
    void bancos_apiFalha_naoPropagaExcecao() {
        when(bankRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_BANCOS)).andRespond(withServerError());

        assertThatCode(() -> seeder.seedBanks()).doesNotThrowAnyException();
        verify(bankRepository, never()).saveAll(anyList());
    }

    // ── Estados ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("carrega os estados com a região achatada na entidade")
    void estados_tabelaVazia_carregaDaApi() {
        when(stateRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_ESTADOS))
                .andRespond(withSuccess(JSON_ESTADOS, MediaType.APPLICATION_JSON));

        seeder.seedStates();

        ArgumentCaptor<List<IbgeState>> captor = ArgumentCaptor.forClass(List.class);
        verify(stateRepository).saveAll(captor.capture());
        List<IbgeState> estados = captor.getValue();

        assertThat(estados).extracting(IbgeState::getSigla).containsExactly("RO", "SP");
        assertThat(estados.get(1).getRegiaoSigla()).isEqualTo("SE");
        assertThat(estados.get(1).getRegiaoNome()).isEqualTo("Sudeste");
        server.verify();
    }

    @Test
    @DisplayName("tabela já populada não gera chamada ao IBGE")
    void estados_tabelaPopulada_naoChamaApi() {
        when(stateRepository.count()).thenReturn(27L);

        seeder.seedStates();

        server.verify();
        verify(stateRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("IBGE fora do ar não derruba o boot")
    void estados_apiFalha_naoPropagaExcecao() {
        when(stateRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_ESTADOS)).andRespond(withServerError());

        assertThatCode(() -> seeder.seedStates()).doesNotThrowAnyException();
        verify(stateRepository, never()).saveAll(anyList());
    }

    // ── Orquestração ────────────────────────────────────────────────────────

    @Test
    @DisplayName("run() cobre as duas fontes, mesmo com a primeira falhando")
    void run_primeiraFonteFalha_aindaCarregaASegunda() {
        when(bankRepository.count()).thenReturn(0L);
        when(stateRepository.count()).thenReturn(0L);
        server.expect(requestTo(URL_BANCOS)).andRespond(withServerError());
        server.expect(requestTo(URL_ESTADOS))
                .andRespond(withSuccess(JSON_ESTADOS, MediaType.APPLICATION_JSON));

        assertThatCode(() -> seeder.run(null)).doesNotThrowAnyException();

        verify(bankRepository, never()).saveAll(anyList());
        verify(stateRepository).saveAll(anyList());
        server.verify();
    }
}