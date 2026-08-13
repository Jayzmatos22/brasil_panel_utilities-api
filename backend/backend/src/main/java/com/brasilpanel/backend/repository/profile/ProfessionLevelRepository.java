package com.brasilpanel.backend.repository.profile;

import com.brasilpanel.backend.model.ProfessionLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfessionLevelRepository extends JpaRepository<ProfessionLevel, Long> {

    List<ProfessionLevel> findAllByOrderByRankAsc();
}
