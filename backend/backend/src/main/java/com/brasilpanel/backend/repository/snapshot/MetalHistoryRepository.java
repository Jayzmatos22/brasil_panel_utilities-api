package com.brasilpanel.backend.repository.snapshot;

import com.brasilpanel.backend.model.MetalHistorySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MetalHistoryRepository extends JpaRepository<MetalHistorySnapshot, Long> {

    /** Série dentro de um intervalo de datas, em ordem crescente (para o gráfico). */
    List<MetalHistorySnapshot> findByPriceDateBetweenOrderByPriceDateAsc(LocalDate start, LocalDate end);

    /** Ponto mais recente da série (para o controle de frescor do DB-first). */
    Optional<MetalHistorySnapshot> findTopByOrderByPriceDateDesc();
}