package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Banco brasileiro — dados da BrasilAPI.
 * ~260 registros. Carregado no startup e raramente muda.
 */
@Entity
@Table(name = "banks",
       indexes = @Index(name = "idx_bank_name", columnList = "name"))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código de compensação Bacen — ex: 1 (BB), 341 (Itaú), 237 (Bradesco) */
    @Column(unique = true, nullable = false)
    private Integer code;

    /** Nome curto — ex: "BCO DO BRASIL S.A." */
    @Column(nullable = false, length = 120)
    private String name;

    /** Nome completo — ex: "Banco do Brasil S.A." */
    @Column(length = 200)
    private String fullName;

    /** ISPB (Identificador de Sistema de Pagamentos Brasileiro) — 8 dígitos */
    @Column(length = 10)
    private String ispb;

    /** Quando sincronizamos com a BrasilAPI */
    @Column(nullable = false)
    private LocalDateTime syncedAt;

    @PrePersist
    void prePersist() {
        if (syncedAt == null) syncedAt = LocalDateTime.now();
    }
}
