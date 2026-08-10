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

    /**
     * Código de compensação COMPE — ex: 1 (BB), 341 (Itaú), 237 (Bradesco).
     *
     * <p>Nem toda instituição do SFN possui um: a BrasilAPI devolve {@code null}
     * para as que operam só via ISPB. O {@code StaticDataSeeder} descarta essas
     * de propósito — a página de bancos lista instituições consultáveis por
     * código. Mudar essa decisão significa remover o filtro lá e afrouxar o
     * {@code nullable} aqui.
     */
    @Column(unique = true, nullable = false)
    private Integer code;

    /** Nome curto — ex: "BCO DO BRASIL S.A." */
    @Column(nullable = false, length = 120)
    private String name;

    /** Nome completo — ex: "Banco do Brasil S.A." */
    @Column(length = 200)
    private String fullName;

    /**
     * ISPB (Identificador de Sistema de Pagamentos Brasileiro) — sempre 8
     * dígitos, presente em toda instituição. É a chave natural da BrasilAPI, e o
     * front o usa como chave de lista: precisa ser único e obrigatório.
     */
    @Column(length = 8, nullable = false, unique = true)
    private String ispb;

    /** Quando sincronizamos com a BrasilAPI */
    @Column(nullable = false)
    private LocalDateTime syncedAt;

    @PrePersist
    void prePersist() {
        if (syncedAt == null) syncedAt = LocalDateTime.now();
    }
}
