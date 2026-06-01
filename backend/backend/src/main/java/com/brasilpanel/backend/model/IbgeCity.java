package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Município brasileiro — dados do IBGE.
 * ~5.570 registros. Carregado por estado sob demanda (lazy seeding).
 */
@Entity
@Table(name = "ibge_cities",
       indexes = {
           @Index(name = "idx_city_state",  columnList = "state_id"),
           @Index(name = "idx_city_nome",   columnList = "nome")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IbgeCity {

    /** ID numérico do IBGE — ex: 3550308 (São Paulo/SP) */
    @Id
    private Integer id;

    /** Nome do município */
    @Column(nullable = false, length = 100)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "state_id", nullable = false)
    private IbgeState state;

    /** Quando sincronizamos com o IBGE */
    @Column(nullable = false)
    private LocalDateTime syncedAt;

    @PrePersist
    void prePersist() {
        if (syncedAt == null) syncedAt = LocalDateTime.now();
    }
}
