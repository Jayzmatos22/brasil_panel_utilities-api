package com.brasilpanel.backend.repository.profile;

import com.brasilpanel.backend.model.KnowledgeArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeAreaRepository extends JpaRepository<KnowledgeArea, Long> {

    List<KnowledgeArea> findAllByOrderBySortOrderAscNameAsc();
}
