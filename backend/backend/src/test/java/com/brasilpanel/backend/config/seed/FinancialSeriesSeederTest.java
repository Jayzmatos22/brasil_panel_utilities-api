package com.brasilpanel.backend.config.seed;

import com.brasilpanel.backend.model.FinancialSeries;
import com.brasilpanel.backend.repository.financial.FinancialSeriesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * O catálogo de séries é uma lista longa mantida à mão, montada por
 * copiar-e-colar de blocos quase idênticos. As duas coisas que podem dar errado
 * são exatamente as que nenhum compilador pega: duplicar um par (code, source)
 * e recriar séries que já existem a cada boot.
 */
class FinancialSeriesSeederTest {

    private FinancialSeriesRepository repository;
    private FinancialSeriesSeeder seeder;

    @BeforeEach
    void setUp() {
        repository = mock(FinancialSeriesRepository.class);
        seeder = new FinancialSeriesSeeder(repository);
    }

    /** Roda o seeder com o banco vazio e devolve tudo que ele tentou salvar. */
    private List<FinancialSeries> seriesPersistidas() {
        when(repository.existsByCodeAndSource(anyString(), anyString())).thenReturn(false);

        seeder.run(null);

        ArgumentCaptor<FinancialSeries> captor = ArgumentCaptor.forClass(FinancialSeries.class);
        verify(repository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues();
    }

    @Test
    @DisplayName("nenhum par (código, fonte) aparece duas vezes no catálogo")
    void catalogo_naoTemDuplicatas() {
        Map<String, Long> ocorrencias = seriesPersistidas().stream()
                .collect(Collectors.groupingBy(
                        s -> s.getSource() + ":" + s.getCode(),
                        Collectors.counting()));

        List<String> duplicados = ocorrencias.entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(Map.Entry::getKey)
                .toList();

        assertThat(duplicados)
                .as("séries duplicadas no catálogo — o segundo save viola a unicidade de (code, source)")
                .isEmpty();
    }

    @Test
    @DisplayName("toda série tem código, fonte e nome preenchidos")
    void catalogo_semCamposObrigatoriosVazios() {
        assertThat(seriesPersistidas()).allSatisfy(s -> {
            assertThat(s.getCode()).as("código").isNotBlank();
            assertThat(s.getSource()).as("fonte de " + s.getCode()).isNotBlank();
            assertThat(s.getName()).as("nome de " + s.getCode()).isNotBlank();
        });
    }

    @Test
    @DisplayName("é idempotente: com tudo já no banco, nada é salvo")
    void bancoJaPopulado_naoSalvaNada() {
        when(repository.existsByCodeAndSource(anyString(), anyString())).thenReturn(true);

        seeder.run(null);

        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("salva apenas as séries que faltam, não o catálogo inteiro")
    void bancoParcial_salvaSomenteAsFaltantes() {
        // Só a SELIC Meta (4390/BCB) ainda não existe.
        when(repository.existsByCodeAndSource(anyString(), anyString())).thenReturn(true);
        when(repository.existsByCodeAndSource("4390", "BCB")).thenReturn(false);

        seeder.run(null);

        ArgumentCaptor<FinancialSeries> captor = ArgumentCaptor.forClass(FinancialSeries.class);
        verify(repository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getCode()).isEqualTo("4390");
    }

    @Test
    @DisplayName("o catálogo cobre as fontes que os serviços consultam")
    void catalogo_cobreAsFontesEsperadas() {
        Map<String, List<FinancialSeries>> porFonte = seriesPersistidas().stream()
                .collect(Collectors.groupingBy(FinancialSeries::getSource));

        assertThat(porFonte).containsKeys("BCB", "IPEA");
        assertThat(porFonte.get("BCB"))
                .extracting(FinancialSeries::getCode)
                .contains("432", "433", "4390");   // SELIC diária, IPCA mensal, SELIC meta
    }
}