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
            FinancialSeries series = findSeries(seriesCode, source);
            LocalDate date = LocalDate.parse(bcbDateStr, BCB_DATE);

            if (dataPointRepository.existsBySeriesAndReferenceDate(series, date)) {
                log.debug("Ponto já existe: série={} data={}", seriesCode, date);
                return;
            }

            FinancialDataPoint point = FinancialDataPoint.builder()
                    .series(series)
                    .referenceDate(date)
                    .value(BigDecimal.valueOf(value))
                    .secondaryValue(secondaryValue != null ? BigDecimal.valueOf(secondaryValue) : null)
                    .build();

            dataPointRepository.save(point);
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

    // ── privado ──────────────────────────────────────────────────────────

    private FinancialSeries findSeries(String code, String source) {
        return seriesRepository.findByCodeAndSource(code, source)
                .orElseThrow(() -> new IllegalStateException(
                        "Série não encontrada no banco: code=%s source=%s".formatted(code, source)));
    }
}
