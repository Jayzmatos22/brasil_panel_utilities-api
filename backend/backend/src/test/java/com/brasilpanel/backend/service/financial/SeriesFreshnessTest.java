package com.brasilpanel.backend.service.financial;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Datas de referência destes testes:
 * 06/08/2026 quinta, 07/08 sexta, 08/08 sábado, 09/08 domingo, 10/08 segunda, 11/08 terça.
 * São as mesmas do incidente que originou a regra — em 08/08/2026 a API do IPEA ainda
 * parava em 06/08, sem a sexta 07/08.
 */
class SeriesFreshnessTest {

    private static final LocalDate QUINTA = LocalDate.parse("2026-08-06");
    private static final LocalDate SABADO = LocalDate.parse("2026-08-08");
    private static final LocalDate TERCA = LocalDate.parse("2026-08-11");

    @Nested
    @DisplayName("séries de pregão (DIARIA_UTIL)")
    class DiariaUtil {

        @ParameterizedTest(name = "em {0} ({1}) a série de 06/08 ainda vale")
        @CsvSource({
                "2026-08-07, sexta",
                "2026-08-08, sabado",
                "2026-08-09, domingo",
                "2026-08-10, segunda"
        })
        @DisplayName("não vence enquanto a fonte não teve como publicar dado novo")
        void naoVenceNoFimDeSemana(String hoje, String diaDaSemana) {
            boolean vencido = SeriesFreshness.isStale(
                    QUINTA, SeriesPeriodicity.DIARIA_UTIL, LocalDate.parse(hoje));

            assertThat(vencido)
                    .as("vencer em %s faria cada expiração de cache rebaixar a série inteira "
                            + "e gravar zero pontos, porque a B3 não publica nesse dia", diaDaSemana)
                    .isFalse();
        }

        @Test
        @DisplayName("vence na terça, quando a sexta já deveria estar publicada")
        void venceQuandoAFonteJaDeveriaTerPublicado() {
            boolean vencido = SeriesFreshness.isStale(QUINTA, SeriesPeriodicity.DIARIA_UTIL, TERCA);

            assertThat(vencido)
                    .as("passados dois pregões desde 06/08, faltar a sexta é atraso real e "
                            + "precisa disparar a busca")
                    .isTrue();
        }

        @Test
        @DisplayName("detecta série parada há meses")
        void detectaSerieParadaHaMeses() {
            boolean vencido = SeriesFreshness.isStale(
                    LocalDate.parse("2026-03-10"), SeriesPeriodicity.DIARIA_UTIL, TERCA);

            assertThat(vencido)
                    .as("é o caso que passava despercebido no BCB: sem checar idade, um ponto "
                            + "de março era servido como se fosse atual, sem erro e sem log")
                    .isTrue();
        }

        @Test
        @DisplayName("a folga é de exatamente um pregão, não mais")
        void folgaEDeUmPregaoApenas() {
            // Terça 11/08: o último pregão publicado esperado é a sexta 07/08.
            assertThat(SeriesFreshness.isStale(
                    LocalDate.parse("2026-08-07"), SeriesPeriodicity.DIARIA_UTIL, TERCA))
                    .as("com a sexta no banco a série está em dia na terça")
                    .isFalse();
            assertThat(SeriesFreshness.isStale(
                    LocalDate.parse("2026-08-06"), SeriesPeriodicity.DIARIA_UTIL, TERCA))
                    .as("um pregão antes disso já é atraso — a folga não pode virar tolerância infinita")
                    .isTrue();
        }
    }

    @Nested
    @DisplayName("séries mensais (MENSAL)")
    class Mensal {

        @Test
        @DisplayName("o mês anterior ainda vale")
        void mesAnteriorAindaVale() {
            boolean vencido = SeriesFreshness.isStale(
                    LocalDate.parse("2026-07-01"), SeriesPeriodicity.MENSAL, SABADO);

            assertThat(vencido)
                    .as("IPCA e salário mínimo saem com um mês de defasagem; cobrar o mês "
                            + "corrente faria a leitura bater na fonte todo dia à toa")
                    .isFalse();
        }

        @Test
        @DisplayName("dois meses atrás já venceu")
        void doisMesesAtrasJaVenceu() {
            boolean vencido = SeriesFreshness.isStale(
                    LocalDate.parse("2026-06-01"), SeriesPeriodicity.MENSAL, SABADO);

            assertThat(vencido).isTrue();
        }

        @Test
        @DisplayName("não usa dia útil — série mensal não tem pregão")
        void naoAplicaRegraDePregao() {
            // 01/08/2026 é sábado. Numa série mensal isso é irrelevante.
            boolean vencido = SeriesFreshness.isStale(
                    LocalDate.parse("2026-08-01"), SeriesPeriodicity.MENSAL, SABADO);

            assertThat(vencido)
                    .as("a data cair no fim de semana não muda nada para uma série mensal")
                    .isFalse();
        }
    }

    @Nested
    @DisplayName("séries anuais (ANUAL)")
    class Anual {

        /** Último ponto real do Gini no banco em 11/08/2026 — o caso que originou a regra. */
        private static final LocalDate GINI_2025 = LocalDate.parse("2025-01-01");

        @Test
        @DisplayName("o ano anterior ainda vale")
        void anoAnteriorAindaVale() {
            boolean vencido = SeriesFreshness.isStale(GINI_2025, SeriesPeriodicity.ANUAL, TERCA);

            assertThat(vencido)
                    .as("a PNAD do ano Y só é publicada em Y+1; cobrar o ano corrente marcaria "
                            + "como vencida uma série que está em dia")
                    .isFalse();
        }

        @Test
        @DisplayName("a mesma série vencia pela régua mensal — o defeito corrigido")
        void reguaMensalMarcavaComoVencida() {
            // Antes do ANUAL, Gini, pobreza e renda média caíam no padrão mensal e
            // ficavam permanentemente vencidos: cada expiração de cache virava uma ida
            // à fonte por um valor que não existe, sem gravar nada.
            boolean pelaReguaMensal =
                    SeriesFreshness.isStale(GINI_2025, SeriesPeriodicity.MENSAL, TERCA);
            boolean pelaReguaAnual =
                    SeriesFreshness.isStale(GINI_2025, SeriesPeriodicity.ANUAL, TERCA);

            assertThat(pelaReguaMensal)
                    .as("é assim que a série se comportava antes da correção")
                    .isTrue();
            assertThat(pelaReguaAnual).isFalse();
        }

        @Test
        @DisplayName("dois anos atrás já venceu")
        void doisAnosAtrasJaVenceu() {
            boolean vencido = SeriesFreshness.isStale(
                    LocalDate.parse("2024-01-01"), SeriesPeriodicity.ANUAL, TERCA);

            assertThat(vencido)
                    .as("a folga é de um ano; passado isso, espera-se dado novo publicado")
                    .isTrue();
        }

        @Test
        @DisplayName("a folga é de exatamente um ano, não mais")
        void folgaEDeUmAnoApenas() {
            // 31/12/2024 é um dia antes do limite (01/01/2025) — já vencido.
            assertThat(SeriesFreshness.isStale(
                    LocalDate.parse("2024-12-31"), SeriesPeriodicity.ANUAL, TERCA)).isTrue();
            assertThat(SeriesFreshness.isStale(
                    LocalDate.parse("2025-01-01"), SeriesPeriodicity.ANUAL, TERCA)).isFalse();
        }

        @Test
        @DisplayName("projeção populacional com data futura nunca vence")
        void projecaoFuturaNuncaVence() {
            // As séries DEPIS_* projetam até 2070 — o ponto mais recente está no futuro.
            boolean vencido = SeriesFreshness.isStale(
                    LocalDate.parse("2070-01-01"), SeriesPeriodicity.ANUAL, TERCA);

            assertThat(vencido).isFalse();
        }
    }

    @Nested
    @DisplayName("dia útil anterior")
    class DiaUtilAnterior {

        @ParameterizedTest(name = "anterior a {0} é {1}")
        @CsvSource({
                "2026-08-10, 2026-08-07",  // segunda -> sexta, pula o fim de semana
                "2026-08-09, 2026-08-07",  // domingo -> sexta
                "2026-08-08, 2026-08-07",  // sabado  -> sexta
                "2026-08-07, 2026-08-06"   // sexta   -> quinta
        })
        @DisplayName("pula sábado e domingo")
        void pulaFimDeSemana(String data, String esperado) {
            assertThat(SeriesFreshness.diaUtilAnterior(LocalDate.parse(data)))
                    .isEqualTo(LocalDate.parse(esperado));
        }

        @Test
        @DisplayName("nunca devolve a própria data")
        void nuncaDevolveAPropriaData() {
            LocalDate data = LocalDate.parse("2026-08-10");

            assertThat(SeriesFreshness.diaUtilAnterior(data))
                    .as("devolver a própria data faria a série se considerar em dia para sempre")
                    .isBefore(data);
        }
    }

    @Nested
    @DisplayName("ausência de dado")
    class SemDado {

        @ParameterizedTest
        @EnumSource(SeriesPeriodicity.class)
        @DisplayName("data nula vence em qualquer periodicidade")
        void dataNulaVence(SeriesPeriodicity periodicidade) {
            boolean vencido = SeriesFreshness.isStale(null, periodicidade, SABADO);

            assertThat(vencido)
                    .as("banco vazio precisa mandar buscar; quem decide se a falha sobe ou "
                            + "degrada é o chamador, olhando se há algo para servir")
                    .isTrue();
        }
    }

    @Nested
    @DisplayName("sobrecarga sem data explícita")
    class SemDataExplicita {

        @Test
        @DisplayName("usa o relógio do sistema")
        void usaORelogioDoSistema() {
            assertThat(SeriesFreshness.isStale(LocalDate.parse("2000-01-01"), SeriesPeriodicity.MENSAL))
                    .as("uma data de 2000 está vencida em qualquer 'hoje' plausível")
                    .isTrue();
            assertThat(SeriesFreshness.isStale(LocalDate.now().plusYears(1), SeriesPeriodicity.MENSAL))
                    .as("uma data no futuro nunca está vencida")
                    .isFalse();
        }
    }
}