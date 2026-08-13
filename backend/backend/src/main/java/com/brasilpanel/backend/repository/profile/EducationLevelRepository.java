package com.brasilpanel.backend.repository.profile;

import com.brasilpanel.backend.model.EducationLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationLevelRepository extends JpaRepository<EducationLevel, Long> {

    List<EducationLevel> findAllByOrderByRankAsc();
}
