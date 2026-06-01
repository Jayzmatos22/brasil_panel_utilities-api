package com.brasilpanel.backend.repository.static_data;

import com.brasilpanel.backend.model.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankRepository extends JpaRepository<Bank, Long> {

    Optional<Bank> findByCode(Integer code);

    List<Bank> findAllByOrderByCodeAsc();

    List<Bank> findByNameContainingIgnoreCaseOrderByCodeAsc(String name);

    boolean existsByCode(Integer code);
}
