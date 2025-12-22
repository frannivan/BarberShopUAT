package com.barbershop.backend.controller;

import com.barbershop.backend.model.Barber;
import com.barbershop.backend.model.User;
import com.barbershop.backend.payload.request.BarberRequest;
import com.barbershop.backend.payload.request.SignupRequest;
import com.barbershop.backend.payload.response.MessageResponse;
import com.barbershop.backend.repository.AppointmentRepository;
import com.barbershop.backend.repository.BarberRepository;
import com.barbershop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    AppointmentRepository appointmentRepository;

    @Autowired
    BarberRepository barberRepository;

    @Autowired
    PasswordEncoder encoder;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("users", userRepository.count());
        stats.put("appointments", appointmentRepository.count());
        stats.put("barbers", barberRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/barbers")
    public List<Barber> getBarbers() {
        return barberRepository.findAll();
    }

    @PostMapping("/barbers")
    public ResponseEntity<?> createBarber(@RequestBody BarberRequest barberRequest) {
        // Check if email already exists
        if (userRepository.existsByEmail(barberRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create user account for barber
        User user = new User();
        user.setName(barberRequest.getName());
        user.setEmail(barberRequest.getEmail());
        user.setPassword(encoder.encode(barberRequest.getPassword()));
        user.setRole(User.Role.BARBER);
        userRepository.save(user);

        // Create barber profile
        Barber barber = new Barber();
        barber.setName(barberRequest.getName());
        barber.setPhotoUrl(barberRequest.getPhotoUrl());
        barber.setUser(user);
        barberRepository.save(barber);

        return ResponseEntity.ok(new MessageResponse("Barber created successfully!"));
    }

    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@RequestBody SignupRequest signupRequest) {
        // Check if email already exists
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create admin account
        User user = new User();
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(encoder.encode(signupRequest.getPassword()));
        user.setRole(User.Role.ADMIN);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Admin created successfully!"));
    }
}
