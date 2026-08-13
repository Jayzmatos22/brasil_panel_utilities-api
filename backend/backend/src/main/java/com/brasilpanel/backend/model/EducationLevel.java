package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Nível de formação acadêmica — ex: Ensino Médio, Tecnólogo, Mestrado.
 *
 * <p>Vocabulário separado do {@link ProfessionLevel}: os níveis de estudo
 * (fundamental → doutorado) não se confundem com os de carreira (estagiário →
 * diretoria). O {@code rank} define a ordem natural de progressão.
 */
@Entity
@Table(name = "education_levels")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(nullable = false, length = 80)
    private String name;

    /** Ordem de progressão — menor é mais básico. */
    @Column(name = "rank", nullable = false)
    private int rank;
}
