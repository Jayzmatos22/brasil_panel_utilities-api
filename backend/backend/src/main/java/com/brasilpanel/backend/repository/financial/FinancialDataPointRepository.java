package com.brasilpanel.backend.repository.financial;

import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.model.FinancialSeries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialDataPointRepository extends JpaRepository<FinancialDataPoint, Long> {

    /** Último ponto de uma série */
    Optional<FinancialDataPoint> findTopBySeriesOrderByReferenceDateDesc(FinancialSeries series);

    /** Ponto exato de uma série para uma data */
    Optional<FinancialDataPoint> findBySeriesAndReferenceDate(FinancialSeries series, LocalDate referenceDate);

    /** Histórico de N meses de uma série, do mais recente ao mais antigo */
    List<FinancialDataPoint> findBySeriesOrderByReferenceDateDesc(FinancialSeries series);

    /** Verifica se já existe o ponto para evitar duplicatas */
    boolean existsBySeriesAndReferenceDate(FinancialSeries series, LocalDate referenceDate);
}
