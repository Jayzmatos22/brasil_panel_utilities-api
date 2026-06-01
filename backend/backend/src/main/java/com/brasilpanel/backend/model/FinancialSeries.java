package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Representa uma série temporal financeira (ex: CDI, SELIC, IPCA, PIB).
 * Cada série agrupa N pontos de dados ao longo do tempo.
 *
 * Fonte de dados: BCB (Banco Central), IPEA, World Bank, etc.
 */
@Entity
@Table(name = "financial_series",
       uniqueConstraints = @UniqueConstraint(
               name = "uq_series_code_source",
               columnNames = {"code", "source"}
       ))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialSeries {

    // Campos
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código da série no sistema de origem — ex: "12" (CDI BCB), "432" (SELIC BCB) */
    @Column(nullable = false, length = 50)
    private String code;

    /** Nome legível — ex: "CDI Diário", "SELIC Meta" */
    @Column(nullable = false, length = 120)
    private String name;

    /** Fonte dos dados — ex: "BCB", "IPEA", "WORLDBANK", "IBGE" */
    @Column(nullable = false, length = 30)
    private String source;

    /** Unidade — ex: "% a.a.", "% a.m.", "R$", "USD" */
    @Column(length = 30)
    private String unit;

    /** Descrição longa opcional */
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "series", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FinancialDataPoint> dataPoints = new ArrayList<>();
}
