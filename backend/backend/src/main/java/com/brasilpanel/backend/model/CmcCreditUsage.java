package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Consumo mensal de créditos da CoinMarketCap — um registro por mês.
 *
 * <p>Persistido em banco, e não em memória, de propósito: o teto de 15.000 créditos/mês
 * é do mês inteiro, então um redeploy no dia 20 não pode zerar a contagem e liberar
 * gastar tudo de novo.
 */
@Entity
@Table(name = "cmc_credit_usage",
       uniqueConstraints = @UniqueConstraint(name = "uk_cmc_credit_month", columnNames = "reference_month"))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmcCreditUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Mês de referência no formato ISO — ex: "2026-07".
     * A coluna se chama reference_month porque "year_month" é palavra reservada em
     * alguns bancos e quebraria o DDL gerado.
     */
    @Column(name = "reference_month", nullable = false, length = 7)
    private String yearMonth;

    /** Soma dos credit_count devolvidos pela API no mês */
    @Column(name = "credits_used", nullable = false)
    private Integer creditsUsed;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
        if (creditsUsed == null) creditsUsed = 0;
    }
}