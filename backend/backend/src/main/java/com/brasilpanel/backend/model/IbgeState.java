package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Estado brasileiro — dados do IBGE.
 * 27 registros (26 estados + DF). A região está embutida para simplificar.
 */
@Entity
@Table(name = "ibge_states")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IbgeState {

    /** ID numérico do IBGE — ex: 35 (SP), 33 (RJ), 31 (MG) */
    @Id
    private Integer id;

    /** Sigla — ex: "SP", "RJ", "MG" */
    @Column(nullable = false, length = 2, unique = true)
    private String sigla;

    /** Nome completo — ex: "São Paulo" */
    @Column(nullable = false, length = 60)
    private String nome;

    // ── Região (embutida — evita tabela extra para 5 registros) ──────────

    @Column(name = "regiao_id", nullable = false)
    private Integer regiaoId;

    @Column(name = "regiao_sigla", nullable = false, length = 2)
    private String regiaoSigla;

    @Column(name = "regiao_nome", nullable = false, length = 20)
    private String regiaoNome;

    /** Quando sincronizamos com o IBGE */
    @Column(nullable = false)
    private LocalDateTime syncedAt;

    @OneToMany(mappedBy = "state", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IbgeCity> cities = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (syncedAt == null) syncedAt = LocalDateTime.now();
    }
}
