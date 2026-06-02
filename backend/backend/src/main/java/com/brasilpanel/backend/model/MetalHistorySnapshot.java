package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Série histórica diária de metais — dados do endpoint Metals Dev /v1/timeseries.
 * Um registro por dia (priceDate único), com todos os metais do dia em colunas.
 *
 * Tabela separada do metal_snapshots (cotação "latest") de propósito: o timeseries
 * sempre vem em USD/toz e representa fechamentos diários, enquanto metal_snapshots
 * guarda a cotação atual em BRL. Misturar as duas causaria o mesmo conflito de
 * frescor que tivemos nas ações.
 */
@Entity
@Table(name = "metal_history",
       indexes = {
           @Index(name = "idx_metal_history_price_date", columnList = "price_date")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetalHistorySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Dia de referência da série (chave natural única) */
    @Column(name = "price_date", nullable = false, unique = true)
    private LocalDate priceDate;

    /** Moeda dos preços — o timeseries entrega sempre "USD" */
    @Column(length = 10)
    private String currency;

    /** Unidade — o timeseries entrega sempre "toz" (troy ounce) */
    @Column(length = 10)
    private String unit;

    // ── Metais preciosos ────────────────────────────────────────────────
    @Column(precision = 19, scale = 6) private BigDecimal gold;
    @Column(precision = 19, scale = 6) private BigDecimal silver;
    @Column(precision = 19, scale = 6) private BigDecimal platinum;
    @Column(precision = 19, scale = 6) private BigDecimal palladium;

    // ── Metais industriais (podem não vir no timeseries) ────────────────
    @Column(precision = 19, scale = 6) private BigDecimal copper;
    @Column(precision = 19, scale = 6) private BigDecimal aluminum;
    @Column(precision = 19, scale = 6) private BigDecimal nickel;
    @Column(precision = 19, scale = 6) private BigDecimal zinc;

    /** Quando buscamos esse ponto da API */
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