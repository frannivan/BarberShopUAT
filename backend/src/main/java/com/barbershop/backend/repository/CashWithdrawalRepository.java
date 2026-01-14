package com.barbershop.backend.repository;

import com.barbershop.backend.model.CashWithdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDateTime;

public interface CashWithdrawalRepository extends JpaRepository<CashWithdrawal, Long> {
    List<CashWithdrawal> findByTimestampAfter(LocalDateTime timestamp);
}
