package com.barbershop.backend.controller;

import com.barbershop.backend.model.*;
import com.barbershop.backend.payload.request.BarberRequest;
import com.barbershop.backend.payload.request.SignupRequest;
import com.barbershop.backend.payload.response.MessageResponse;
import com.barbershop.backend.repository.AppointmentRepository;
import com.barbershop.backend.repository.BarberRepository;
import com.barbershop.backend.repository.UserRepository;
import com.barbershop.backend.repository.LeadRepository;
import com.barbershop.backend.repository.OpportunityRepository;
import com.barbershop.backend.service.CRMService;
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
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    AppointmentRepository appointmentRepository;

    @Autowired
    BarberRepository barberRepository;

    @Autowired
    LeadRepository leadRepository;

    @Autowired
    OpportunityRepository opportunityRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    private CRMService crmService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("users", userRepository.count());
        stats.put("appointments", appointmentRepository.count());
        stats.put("barbers", barberRepository.count());
        stats.put("leads", leadRepository.count());
        stats.put("opportunities", opportunityRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/barbers")
    public List<Barber> getBarbers() {
        return barberRepository.findAll();
    }

    @PostMapping("/users")
    public ResponseEntity<?> saveUser(@RequestBody SignupRequest request) {
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Email already in use!"));
            }

            // Create User
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(encoder.encode(request.getPassword()));
            user.setPhone(request.getPhone());
            user.setGender(request.getGender());
            user.setAge(request.getAge());

            // Determine Role
            User.Role roleVal = User.Role.USER;
            if (request.getRole() != null) {
                String roleStr = request.getRole().toUpperCase();
                if (roleStr.equals("CLIENT") || roleStr.equals("CLIENTE")) {
                    roleVal = User.Role.CLIENTE;
                } else {
                    roleVal = User.Role.valueOf(roleStr);
                }
            }
            user.setRole(roleVal);
            user = userRepository.save(user);

            // If Role is BARBER or ADMIN_BARBER, create Barber entity
            if (roleVal == User.Role.BARBER || roleVal == User.Role.ADMIN_BARBER) {
                Barber barber = new Barber();
                barber.setName(user.getName());
                barber.setUser(user);
                barber.setPhotoUrl(request.getPhotoUrl());
                barber.setColor(request.getColor()); // Assign color
                barberRepository.save(barber);
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error saving user: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody SignupRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        user.setName(request.getName());
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            // In a real app update duplicate check
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword()));
        }
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getGender() != null)
            user.setGender(request.getGender());
        if (request.getAge() != null)
            user.setAge(request.getAge());

        if (request.getObservations() != null)
            user.setObservations(request.getObservations());

        // Update Role
        User.Role newRole = user.getRole();
        if (request.getRole() != null) {
            try {
                String r = request.getRole().toUpperCase();
                if (r.equals("CLIENT"))
                    r = "CLIENTE";
                newRole = User.Role.valueOf(r);
                user.setRole(newRole);
            } catch (Exception e) {
                System.err.println("Error parsing role: " + request.getRole());
            }
        }
        userRepository.save(user);

        // Handle Barber Entity
        boolean isBarberRole = (newRole == User.Role.BARBER || newRole == User.Role.ADMIN_BARBER);
        Barber existingBarber = barberRepository.findByUserId(user.getId()).orElse(null);

        if (isBarberRole) {
            if (existingBarber == null) {
                // Create if missing
                Barber newBarber = new Barber();
                newBarber.setName(user.getName());
                newBarber.setUser(user);
                newBarber.setPhotoUrl(request.getPhotoUrl());
                newBarber.setColor(request.getColor());
                barberRepository.save(newBarber);
            } else {
                // Update existing
                existingBarber.setName(user.getName()); // Sync name
                if (request.getPhotoUrl() != null)
                    existingBarber.setPhotoUrl(request.getPhotoUrl());
                if (request.getColor() != null)
                    existingBarber.setColor(request.getColor());
                barberRepository.save(existingBarber);
            }
        } else {
            // If formerly a barber but now not, we might want to deactivate or delete?
            // For now, let's keep the profile but deactivate it, or just leave it.
            // User requirement didn't specify, but safer to keep history.
        }

        return ResponseEntity.ok(new MessageResponse("User updated successfully!"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        // 1. Unlink appointments where this user is the client
        List<Appointment> clientAppointments = appointmentRepository.findByUserId(id);
        for (Appointment apt : clientAppointments) {
            apt.setUser(null);
            appointmentRepository.save(apt);
        }

        // 2. If user is a barber, unlink appointments where they are the provider
        barberRepository.findByUserId(id).ifPresent(barber -> {
            List<Appointment> barberAppointments = appointmentRepository.findByBarberId(barber.getId());
            for (Appointment apt : barberAppointments) {
                apt.setBarber(null);
                appointmentRepository.save(apt);
            }
            barberRepository.delete(barber);
        });

        // 3. Delete the user
        userRepository.delete(user);
        return ResponseEntity.ok(
                new MessageResponse("User deleted successfully! Associated appointments preserved as unlinked/guest."));
    }

    // CRM Endpoints Consolidated here for reliability
    @GetMapping("/crm/leads")
    public List<Lead> getAllLeads() {
        return crmService.getAllLeads();
    }

    @PutMapping("/crm/leads/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam ELeadStatus status) {
        try {
            return ResponseEntity.ok(crmService.updateLeadStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/crm/leads/{id}/convert-to-client")
    public ResponseEntity<?> convertToClient(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(crmService.convertLeadToClient(id));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/crm/opportunities")
    public List<Opportunity> getAllOpportunities() {
        return crmService.getAllOpportunities();
    }

    @PutMapping("/crm/opportunities/{id}")
    public ResponseEntity<Opportunity> updateOpportunity(@PathVariable Long id, @RequestBody Opportunity opportunity) {
        return ResponseEntity.ok(crmService.updateOpportunity(id, opportunity));
    }
}
