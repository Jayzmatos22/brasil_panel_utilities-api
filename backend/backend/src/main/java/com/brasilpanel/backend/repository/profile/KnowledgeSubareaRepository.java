package com.brasilpanel.backend.repository.profile;

import com.brasilpanel.backend.model.KnowledgeSubarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeSubareaRepository extends JpaRepository<KnowledgeSubarea, Long> {

    List<KnowledgeSubarea> findAllByOrderByAreaIdAscSortOrderAscNameAsc();
}
