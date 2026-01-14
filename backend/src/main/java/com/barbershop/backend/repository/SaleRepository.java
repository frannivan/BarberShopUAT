package com.barbershop.backend.repository;

import com.barbershop.backend.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByDateBetweenOrderByDateDesc(LocalDateTime start, LocalDateTime end);

    List<Sale> findByClient_IdOrderByDateDesc(Long clientId);

    List<Sale> findByDateAfter(LocalDateTime date);
}
