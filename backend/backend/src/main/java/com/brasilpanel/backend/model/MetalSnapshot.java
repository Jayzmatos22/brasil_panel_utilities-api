package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Snapshot dos preços de metais preciosos e industriais — dados do Metals Dev.
 * Um registro por chamada à API: contém todos os metais disponíveis no mesmo timestamp.
 *
 * Preços em USD por troy ounce (ouro, prata, platina, paládio)
 * ou USD por libra-peso (cobre, alumínio, níquel, zinco) — conforme a API.
 */
@Entity
@Table(name = "metal_snapshots",
       indexes = {
           @Index(name = "idx_metal_reference_ts", columnList = "reference_ts")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetalSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Timestamp de referência retornado pela API (lastUpdated) */
    @Column(name = "reference_ts", nullable = false, unique = true)
    private Instant referenceTs;

    /** Moeda dos preços — normalmente "USD" */
    @Column(length = 10)
    private String currency;

    // ── Metais preciosos (troy oz) ──────────────────────────────────────

    @Column(precision = 19, scale = 6)
    private BigDecimal gold;

    @Column(precision = 19, scale = 6)
    private BigDecimal silver;

    @Column(precision = 19, scale = 6)
    private BigDecimal platinum;

    @Column(precision = 19, scale = 6)
    private BigDecimal palladium;

    // ── Metais industriais ──────────────────────────────────────────────

    @Column(precision = 19, scale = 6)
    private BigDecimal copper;

    @Column(precision = 19, scale = 6)
    private BigDecimal aluminum;

    @Column(precision = 19, scale = 6)
    private BigDecimal nickel;

    @Column(precision = 19, scale = 6)
    private BigDecimal zinc;

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
