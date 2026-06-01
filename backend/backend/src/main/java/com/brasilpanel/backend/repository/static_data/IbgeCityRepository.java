package com.brasilpanel.backend.repository.static_data;

import com.brasilpanel.backend.model.IbgeCity;
import com.brasilpanel.backend.model.IbgeState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IbgeCityRepository extends JpaRepository<IbgeCity, Integer> {

    List<IbgeCity> findByStateOrderByNomeAsc(IbgeState state);

    List<IbgeCity> findByStateAndNomeContainingIgnoreCaseOrderByNomeAsc(IbgeState state, String nome);

    boolean existsByState(IbgeState state);
}
