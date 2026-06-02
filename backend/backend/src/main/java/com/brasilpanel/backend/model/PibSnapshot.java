package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Snapshot do PIB do Brasil — dados do World Bank (NY.GDP.MKTP.CD).
 * Um registro por ano. Valor em USD absoluto (ordem de trilhões), por isso
 * precision 23 — não cabe no FinancialDataPoint (precision 19).
 */
@Entity
@Table(name = "pib_snapshots",
       indexes = {
           @Index(name = "idx_pib_year", columnList = "year")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PibSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ano de referência — ex: 2023 */
    @Column(nullable = false, unique = true)
    private Integer year;

    /** PIB em valor absoluto da moeda (ex: USD) */
    @Column(nullable = false, precision = 23, scale = 2)
    private BigDecimal value;

    /** Moeda do valor — normalmente "USD" */
    @Column(length = 10)
    private String currency;

    /** Quando buscamos esse snapshot da API */
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
