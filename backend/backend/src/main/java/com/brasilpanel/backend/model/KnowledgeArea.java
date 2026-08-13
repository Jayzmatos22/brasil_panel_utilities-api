package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Área de conhecimento — o nível mais amplo da taxonomia (ex: Tecnologia,
 * Saúde, Finanças). É reutilizada tanto pela profissão quanto pela formação do
 * usuário: a área de atuação e a de estudo costumam coincidir, então uma única
 * árvore evita duplicar o cadastro.
 *
 * <p>Dados de referência: populados pela migração {@code V3__user_profile.sql}
 * e raramente mudam. Seguem o mesmo padrão de {@link Bank} e {@link IbgeState}.
 */
@Entity
@Table(name = "knowledge_areas")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Identificador estável e legível — ex: "tecnologia". Usado como chave natural. */
    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    /** Rótulo exibido — ex: "Tecnologia". */
    @Column(nullable = false, length = 80)
    private String name;

    /** Ordem de exibição nos selects; menor aparece primeiro. */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
