package com.barbershop.backend.repository;

import com.barbershop.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);

    List<Appointment> findByBarberId(Long barberId);

    List<Appointment> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByBarberIdAndStartTimeBetween(Long barberId, LocalDateTime start, LocalDateTime end);
}
