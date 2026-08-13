package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Subárea de conhecimento — o recorte específico dentro de uma {@link KnowledgeArea}
 * (ex: "Dados e IA" dentro de "Tecnologia"). É o passo "do todo para o específico"
 * da taxonomia.
 *
 * <p>O vínculo com a área é a coluna {@code area_id} (FK garantida no banco pela
 * migração). Não há relação JPA {@code @ManyToOne} de propósito: estes são dados
 * de referência estáticos, montados em memória pelo {@code ProfileService}, e o
 * id cru evita carregamento preguiçoso desnecessário.
 */
@Entity
@Table(name = "knowledge_subareas",
       indexes = @Index(name = "idx_subarea_area", columnList = "area_id"))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeSubarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK para {@link KnowledgeArea}. */
    @Column(name = "area_id", nullable = false)
    private Long areaId;

    /** Único dentro da árvore inteira — ex: "dados-e-ia". */
    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    /** Rótulo exibido — ex: "Dados e IA". */
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
