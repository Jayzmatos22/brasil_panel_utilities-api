package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Ponto de dado de uma série financeira.
 * Ex: CDI do dia 01/06/2026 = 0.0534 (diário) / 14.65 (anual)
 */
@Entity
@Table(name = "financial_data_points",
       indexes = {
           @Index(name = "idx_fdp_series_date", columnList = "series_id, reference_date"),
           @Index(name = "idx_fdp_reference_date", columnList = "reference_date")
       },
       uniqueConstraints = @UniqueConstraint(
               name = "uq_fdp_series_date",
               columnNames = {"series_id", "reference_date"}
       ))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialDataPoint {

    // Campos
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "series_id", nullable = false)
    private FinancialSeries series;

    /** Data de referência do dado — ex: 2026-06-01 */
    @Column(nullable = false)
    private LocalDate referenceDate;

    /**
     * Valor principal — ex: 0.0534 (CDI diário) ou 14.65 (SELIC % a.a.)
     * Precisão 19,8 para suportar valores com muitas casas decimais.
     */
    @Setter
    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal value;

    /**
     * Valor secundário opcional — ex: taxa anual calculada a partir da diária.
     * Permite salvar CDI diário + CDI anualizado no mesmo ponto.
     */
    @Column(precision = 19, scale = 8)
    @Setter
    private BigDecimal secondaryValue;

    /** Quando o ponto foi inserido/atualizado no banco */
    @Column(nullable = false)
    private LocalDateTime fetchedAt;

    @PrePersist
    void prePersist() {
        if (fetchedAt == null) fetchedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        fetchedAt = LocalDateTime.now();
    }


}
