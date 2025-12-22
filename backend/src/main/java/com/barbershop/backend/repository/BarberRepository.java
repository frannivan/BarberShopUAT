package com.barbershop.backend.repository;

import com.barbershop.backend.model.Barber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BarberRepository extends JpaRepository<Barber, Long> {
    Optional<Barber> findByUserId(Long userId);

    java.util.List<Barber> findByActiveTrue();
}
