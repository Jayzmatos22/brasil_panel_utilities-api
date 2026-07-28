package com.brasilpanel.backend.service.financial;

import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.model.FinancialSeries;
import com.brasilpanel.backend.repository.financial.FinancialDataPointRepository;
import com.brasilpanel.backend.repository.financial.FinancialSeriesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Teste de persistência de verdade: roda contra H2, com as entidades mapeadas e
 * as consultas derivadas do Spring Data realmente executadas.
 *
 * <p>{@code replace = NONE} mantém o datasource do perfil {@code test}, que
 * declara {@code NON_KEYWORDS=VALUE,YEAR}. Sem isso o H2 recusaria criar as
 * tabelas — `value` e `year` são reservadas nele, mas não no PostgreSQL.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(FinancialDataService.class)
@ActiveProfiles("test")
class FinancialDataServiceTest {

    private static final String CODIGO = "432";
    private static final String FONTE = "BCB";

    @Autowired private FinancialDataService service;
    @Autowired private FinancialSeriesRepository seriesRepository;
    @Autowired private FinancialDataPointRepository dataPointRepository;

    @BeforeEach
    void setUp() {
        dataPointRepository.deleteAll();
        seriesRepository.deleteAll();
        seriesRepository.save(FinancialSeries.builder()
                .code(CODIGO)
                .name("SELIC Meta")
                .source(FONTE)
                .unit("% a.a.")
                .build());
    }

    // ── Gravação ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("grava um ponto novo")
    void savesANewPoint() {
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 15.0, null);

        var ponto = service.getLastPoint(CODIGO, FONTE);
        assertThat(ponto).isPresent();
        assertThat(ponto.get().getValue().doubleValue()).isEqualTo(15.0);
    }

    @Test
    @DisplayName("repetir o mesmo valor na mesma data não duplica")
    void repeatingTheSameValueDoesNotDuplicate() {
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 15.0, null);
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 15.0, null);

        // Idempotência importa: o scheduler reprocessa as mesmas datas com frequência.
        assertThat(dataPointRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("valor diferente na mesma data atualiza, em vez de inserir")
    void differentValueOnSameDateUpdates() {
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 15.0, null);
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 14.75, null);

        assertThat(dataPointRepository.count()).isEqualTo(1);
        assertThat(service.getLastPoint(CODIGO, FONTE).orElseThrow()
                .getValue().doubleValue()).isEqualTo(14.75);
    }

    @Test
    @DisplayName("aceita a data no formato do BCB (dd/MM/yyyy)")
    void parsesBcbDateFormat() {
        service.savePoint(CODIGO, FONTE, "20/07/2026", 15.0, null);

        assertThat(service.getLastPoint(CODIGO, FONTE).orElseThrow()
                .getReferenceDate()).isEqualTo(LocalDate.of(2026, 7, 20));
    }

    @Test
    @DisplayName("data malformada não derruba a requisição")
    void malformedDateDoesNotBreakTheRequest() {
        // A persistência é secundária: falhar aqui não pode impedir a resposta ao usuário.
        assertThatCode(() -> service.savePoint(CODIGO, FONTE, "2026-07-20", 15.0, null))
                .doesNotThrowAnyException();

        assertThat(dataPointRepository.count()).isZero();
    }

    @Test
    @DisplayName("série inexistente falha em silêncio, sem persistir")
    void unknownSeriesFailsSilently() {
        // findSeries lança, mas savePoint captura e apenas registra em log.
        // Comportamento intencional — documentado aqui para não regredir por engano.
        assertThatCode(() -> service.savePoint("999", "FONTE-INEXISTENTE",
                LocalDate.of(2026, 7, 20), 1.0, null))
                .doesNotThrowAnyException();

        assertThat(dataPointRepository.count()).isZero();
    }

    // ── Leitura ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getLastPoint devolve o ponto mais recente, não o último inserido")
    void lastPointIsTheMostRecentByDate() {
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 15.0, null);
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 10), 13.0, null);

        assertThat(service.getLastPoint(CODIGO, FONTE).orElseThrow()
                .getReferenceDate()).isEqualTo(LocalDate.of(2026, 7, 20));
    }

    @Test
    @DisplayName("getRecentPoints devolve os N mais recentes em ordem cronológica")
    void recentPointsComeBackChronologically() {
        for (int dia = 1; dia <= 5; dia++) {
            service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, dia), dia, null);
        }

        List<FinancialDataPoint> recentes = service.getRecentPoints(CODIGO, FONTE, 3);

        // Os 3 mais recentes (03, 04, 05), do mais antigo para o mais novo —
        // é a ordem que os cálculos de acumulado esperam.
        assertThat(recentes).hasSize(3);
        assertThat(recentes.stream().map(p -> p.getReferenceDate().getDayOfMonth()))
                .containsExactly(3, 4, 5);
    }

    @Test
    @DisplayName("série sem pontos devolve lista vazia, não erro")
    void seriesWithoutPointsReturnsEmptyList() {
        assertThat(service.getRecentPoints(CODIGO, FONTE, 12)).isEmpty();
        assertThat(service.getLastPoint(CODIGO, FONTE)).isEmpty();
    }

    @Test
    @DisplayName("série inexistente devolve vazio na leitura")
    void unknownSeriesReturnsEmptyOnRead() {
        assertThat(service.getRecentPoints("999", "NADA", 12)).isEmpty();
        assertThat(service.getLastPoint("999", "NADA")).isEmpty();
    }

    @Test
    @DisplayName("guarda o valor secundário quando informado")
    void storesSecondaryValueWhenProvided() {
        service.savePoint(CODIGO, FONTE, LocalDate.of(2026, 7, 20), 0.05, 13.65);

        assertThat(service.getLastPoint(CODIGO, FONTE).orElseThrow()
                .getSecondaryValue().doubleValue()).isEqualTo(13.65);
    }
}