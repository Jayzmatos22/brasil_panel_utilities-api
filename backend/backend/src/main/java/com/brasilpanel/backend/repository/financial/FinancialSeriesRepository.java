package com.brasilpanel.backend.repository.financial;

import com.brasilpanel.backend.model.FinancialSeries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinancialSeriesRepository extends JpaRepository<FinancialSeries, Long> {

    Optional<FinancialSeries> findByCodeAndSource(String code, String source);

    boolean existsByCodeAndSource(String code, String source);
}
