package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Nível de carreira/senioridade — ex: Estagiário, Júnior, Pleno, Sênior, Gerência.
 *
 * <p>Vocabulário separado do {@link EducationLevel}. O {@code rank} ordena da
 * entrada na carreira ao topo; opções sem progressão linear (Autônomo,
 * Empresário, Estudante) recebem rank alto para ficarem ao final da lista.
 */
@Entity
@Table(name = "profession_levels")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfessionLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "rank", nullable = false)
    private int rank;
}
