package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Snapshot do fixing oficial LBMA — dados do Metals Dev /v1/metal/authority?authority=lbma.
 * Preços em USD/toz. Ouro, platina e paládio têm dois fixings diários (AM/PM);
 * a prata tem fixing único. Um registro por timestamp de referência (idempotente).
 */
@Entity
@Table(name = "lbma_fixings",
       indexes = {
           @Index(name = "idx_lbma_reference_ts", columnList = "reference_ts")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LbmaFixingSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Timestamp de referência retornado pela API */
    @Column(name = "reference_ts", nullable = false, unique = true)
    private Instant referenceTs;

    /** Moeda dos preços — normalmente "USD" */
    @Column(length = 10)
    private String currency;

    @Column(precision = 19, scale = 6) private BigDecimal goldAm;
    @Column(precision = 19, scale = 6) private BigDecimal goldPm;
    @Column(precision = 19, scale = 6) private BigDecimal silver;
    @Column(precision = 19, scale = 6) private BigDecimal platinumAm;
    @Column(precision = 19, scale = 6) private BigDecimal platinumPm;
    @Column(precision = 19, scale = 6) private BigDecimal palladiumAm;
    @Column(precision = 19, scale = 6) private BigDecimal palladiumPm;

    /** Quando buscamos esse fixing da API */
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
