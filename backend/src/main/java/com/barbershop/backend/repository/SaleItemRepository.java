package com.barbershop.backend.repository;

import com.barbershop.backend.model.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findByBarber_IdAndSale_DateBetween(Long barberId, LocalDateTime start, LocalDateTime end);
}
