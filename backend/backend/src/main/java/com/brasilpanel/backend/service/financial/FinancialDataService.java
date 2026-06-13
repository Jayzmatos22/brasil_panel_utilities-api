package com.brasilpanel.backend.service.financial;

import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.model.FinancialSeries;
import com.brasilpanel.backend.repository.financial.FinancialDataPointRepository;
import com.brasilpanel.backend.repository.financial.FinancialSeriesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Persiste pontos de dados financeiros no banco.
 * Usado pelo BcbService (e futuramente IpeaService, WorldBankService)
 * para salvar os valores buscados das APIs externas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialDataService {

    private static final DateTimeFormatter BCB_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final FinancialSeriesRepository seriesRepository;
    private final FinancialDataPointRepository dataPointRepository;

    /**
     * Salva (ou atualiza) um ponto de dado para uma série identificada por código + fonte.
     * Se o ponto da data já existir, não faz nada (idempotente).
     *
     * @param seriesCode   código da série (ex: "12" para CDI)
     * @param source       fonte (ex: "BCB")
     * @param bcbDateStr   data no formato BCB "dd/MM/yyyy"
     * @param value        valor principal
     * @param secondaryValue valor secundário opcional (ex: taxa anualizada)
     */
    @Transactional
    public void savePoint(String seriesCode, String source,
                          String bcbDateStr, double value, Double secondaryValue) {
        try {
            LocalDate date = LocalDate.parse(bcbDateStr, BCB_DATE);
            savePoint(seriesCode, source, date, value, secondaryValue);
        } catch (Exception e) {
            // Não deixa falha de persistência derrubar a resposta ao usuário
            log.warn("Falha ao persistir ponto da série {} ({}): {}", seriesCode, source, e.getMessage());
        }
    }

    /**
     * Variante que recebe a data já parseada como {@link LocalDate}.
     * Usada por fontes cujas datas não vêm no formato BCB "dd/MM/yyyy" (ex: IPEA).
     */
    @Transactional
    public void savePoint(String seriesCode, String source,
                          LocalDate date, double value, Double secondaryValue) {
        try {
            FinancialSeries series = findSeries(seriesCode, source);

            // 1. Busca o ponto exato no banco pela série e data
            Optional<FinancialDataPoint> existingPoint = dataPointRepository.findBySeriesAndReferenceDate(series, date);

            if (existingPoint.isPresent()) {
                FinancialDataPoint point = existingPoint.get();

                // 2. Se o valor for diferente, fazemos o UPDATE
                if (point.getValue().doubleValue() != value) {
                    point.setValue(BigDecimal.valueOf(value));

                    if (secondaryValue != null) {
                        point.setSecondaryValue(BigDecimal.valueOf(secondaryValue));
                    } else {
                        point.setSecondaryValue(null);
                    }

                    dataPointRepository.save(point);
                    log.debug("Ponto atualizado: série={} data={} novo_valor={}", seriesCode, date, value);
                } else {
                    // 3. Se for exatamente o mesmo valor, ignoramos para poupar o banco
                    log.debug("Ponto ignorado (já existe com o mesmo valor): série={} data={}", seriesCode, date);
                }
                return;
            }

            // 4. Se não existe registro para esta data, fazemos o INSERT
            FinancialDataPoint newPoint = FinancialDataPoint.builder()
                    .series(series)
                    .referenceDate(date)
                    .value(BigDecimal.valueOf(value))
                    .secondaryValue(secondaryValue != null ? BigDecimal.valueOf(secondaryValue) : null)
                    .build();

            dataPointRepository.save(newPoint);
            log.debug("Ponto salvo: série={} data={} valor={}", seriesCode, date, value);

        } catch (Exception e) {
            // Não deixa falha de persistência derrubar a resposta ao usuário
            log.warn("Falha ao persistir ponto da série {} ({}): {}", seriesCode, source, e.getMessage());
        }
    }

    /**
     * Retorna o último ponto salvo de uma série (para exibir "última atualização").
     */
    @Transactional(readOnly = true)
    public Optional<FinancialDataPoint> getLastPoint(String seriesCode, String source) {
        return seriesRepository.findByCodeAndSource(seriesCode, source)
                .flatMap(dataPointRepository::findTopBySeriesOrderByReferenceDateDesc);
    }

    /**
     * Retorna todos os pontos de uma série em ordem cronológica (mais antigo → mais recente).
     * Vazio se a série não existir ou não tiver pontos.
     */
    @Transactional(readOnly = true)
    public List<FinancialDataPoint> getAllPoints(String seriesCode, String source) {
        return seriesRepository.findByCodeAndSource(seriesCode, source)
                .map(dataPointRepository::findBySeriesOrderByReferenceDateAsc)
                .orElseGet(List::of);
    }

    /**
     * Retorna os N pontos mais recentes de uma série em ordem cronológica (mais antigo → mais recente),
     * como a API da BCB devolve em /ultimos/N. Usado para reconstruir agregados (acumulado/composição).
     * Vazio se a série não existir ou não tiver pontos.
     */
    @Transactional(readOnly = true)
    public List<FinancialDataPoint> getRecentPoints(String seriesCode, String source, int n) {
        List<FinancialDataPoint> recentDesc = seriesRepository.findByCodeAndSource(seriesCode, source)
                .map(dataPointRepository::findBySeriesOrderByReferenceDateDesc)
                .orElseGet(List::of)
                .stream()
                .limit(n)
                .toList();

        List<FinancialDataPoint> chronological = new ArrayList<>(recentDesc);
        Collections.reverse(chronological);
        return chronological;
    }

    // ── privado ──────────────────────────────────────────────────────────

    private FinancialSeries findSeries(String code, String source) {
        return seriesRepository.findByCodeAndSource(code, source)
                .orElseThrow(() -> new IllegalStateException(
                        "Série não encontrada no banco: code=%s source=%s".formatted(code, source)));
    }
}
