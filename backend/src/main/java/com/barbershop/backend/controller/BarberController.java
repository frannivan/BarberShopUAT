package com.barbershop.backend.controller;

import com.barbershop.backend.model.Barber;
import com.barbershop.backend.repository.BarberRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.util.List;

@RestController
@RequestMapping("/api/barbers")
public class BarberController {

    @Autowired
    BarberRepository barberRepository;

    @org.springframework.web.bind.annotation.PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public org.springframework.http.ResponseEntity<?> createBarber(
            @org.springframework.web.bind.annotation.RequestBody Barber barber) {
        barberRepository.save(barber);
        return org.springframework.http.ResponseEntity
                .ok(new com.barbershop.backend.payload.response.MessageResponse("Barber created successfully!"));
    }

    @GetMapping
    public List<Barber> getAllBarbers() {
        return barberRepository.findByActiveTrue();
    }

    @GetMapping("/admin/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public List<Barber> getAllBarbersAdmin() {
        return barberRepository.findAll();
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public org.springframework.http.ResponseEntity<?> toggleBarberStatus(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        System.out.println("DEBUG: Toggling status for Barber ID: " + id);

        Barber barber = barberRepository.findById(id)
                .orElseThrow(() -> {
                    System.out.println("DEBUG: Barber not found for ID: " + id);
                    return new RuntimeException("Error: Barber not found.");
                });

        boolean newStatus = !barber.getActive();
        System.out.println("DEBUG: Current status: " + barber.getActive() + ". New status: " + newStatus);

        barber.setActive(newStatus);
        barberRepository.save(barber);

        return org.springframework.http.ResponseEntity
                .ok(new com.barbershop.backend.payload.response.MessageResponse("Barber status updated successfully!"));
    }
}
