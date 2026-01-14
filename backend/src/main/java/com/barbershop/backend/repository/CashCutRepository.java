package com.barbershop.backend.repository;

import com.barbershop.backend.model.CashCut;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CashCutRepository extends JpaRepository<CashCut, Long> {
    Optional<CashCut> findTopByOrderByTimestampDesc();
}
