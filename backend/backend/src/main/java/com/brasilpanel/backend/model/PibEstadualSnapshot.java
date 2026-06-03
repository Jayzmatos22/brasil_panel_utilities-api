package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Snapshot do PIB por Unidade da Federação — dados do IBGE/SIDRA (tabela 5938, variável 37).
 * Um registro por ano + UF. Valor em reais absolutos (a API entrega em mil reais; convertemos).
 */
@Entity
@Table(name = "pib_estadual_snapshots",
       uniqueConstraints = @UniqueConstraint(name = "uk_pib_estadual_year_uf", columnNames = {"year", "uf_code"}),
       indexes = {
           @Index(name = "idx_pib_estadual_year", columnList = "year")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PibEstadualSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ano de referência — ex: 2023 */
    @Column(nullable = false)
    private Integer year;

    /** Código IBGE da UF — ex: 35 (SP) */
    @Column(name = "uf_code", nullable = false)
    private Integer ufCode;

    /** Nome da UF — ex: "São Paulo" */
    @Column(nullable = false, length = 60)
    private String uf;

    /** PIB em reais absolutos */
    @Column(nullable = false, precision = 23, scale = 2)
    private BigDecimal value;

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