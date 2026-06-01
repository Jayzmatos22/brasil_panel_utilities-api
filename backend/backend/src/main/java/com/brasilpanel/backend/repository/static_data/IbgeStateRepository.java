package com.brasilpanel.backend.repository.static_data;

import com.brasilpanel.backend.model.IbgeState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IbgeStateRepository extends JpaRepository<IbgeState, Integer> {

    Optional<IbgeState> findBySiglaIgnoreCase(String sigla);

    List<IbgeState> findAllByOrderByNomeAsc();

    List<IbgeState> findByRegiaoSiglaIgnoreCase(String regiaoSigla);
}
