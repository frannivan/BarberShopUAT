package com.barbershop.backend.controller;

import com.barbershop.backend.model.AppointmentType;
import com.barbershop.backend.repository.AppointmentTypeRepository;
import com.barbershop.backend.payload.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointment-types")
public class AppointmentTypeController {

    @Autowired
    AppointmentTypeRepository appointmentTypeRepository;

    @GetMapping
    public List<AppointmentType> getAllTypes() {
        return appointmentTypeRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createType(@RequestBody AppointmentType type) {
        if (appointmentTypeRepository.findByName(type.getName()).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Type name already exists."));
        }
        appointmentTypeRepository.save(type);
        return ResponseEntity.ok(new MessageResponse("Appointment Type created successfully!"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteType(@PathVariable Long id) {
        if (!appointmentTypeRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Type not found."));
        }
        appointmentTypeRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("Appointment Type deleted successfully!"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateType(@PathVariable Long id, @RequestBody AppointmentType typeDetails) {
        return appointmentTypeRepository.findById(id)
                .map(type -> {
                    type.setName(typeDetails.getName());
                    type.setPrice(typeDetails.getPrice());
                    type.setDurationMinutes(typeDetails.getDurationMinutes());
                    type.setColor(typeDetails.getColor());
                    type.setDescription(typeDetails.getDescription());
                    appointmentTypeRepository.save(type);
                    return ResponseEntity.ok(new MessageResponse("Appointment Type updated successfully!"));
                })
                .orElse(ResponseEntity.badRequest().body(new MessageResponse("Error: Type not found.")));
    }
}
