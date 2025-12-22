package com.barbershop.backend.controller;

import com.barbershop.backend.model.Appointment;
import com.barbershop.backend.model.Barber;
import com.barbershop.backend.model.User;
import com.barbershop.backend.payload.request.AppointmentRequest;
import com.barbershop.backend.payload.response.MessageResponse;
import com.barbershop.backend.repository.AppointmentRepository;
import com.barbershop.backend.repository.BarberRepository;
import com.barbershop.backend.repository.UserRepository;
import com.barbershop.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    AppointmentRepository appointmentRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    BarberRepository barberRepository;

    @Autowired
    com.barbershop.backend.repository.AppointmentTypeRepository appointmentTypeRepository;

    @Autowired
    PasswordEncoder encoder;

    @PostConstruct
    public void init() {
        // Ensure admin user exists and has correct password
        java.util.Optional<User> adminOpt = userRepository.findByEmail("admin@test.com");
        if (adminOpt.isEmpty()) {
            User admin = new User(null, "admin@test.com", encoder.encode("password"), "Admin User", User.Role.ADMIN);
            userRepository.save(admin);
        } else {
            // Reset password for dev/test convenience if user exists
            User admin = adminOpt.get();
            admin.setPassword(encoder.encode("password"));
            userRepository.save(admin);
        }

        if (userRepository.count() == 0) {
            User user = new User(null, "test@test.com", encoder.encode("password"), "Test User", User.Role.USER);
            userRepository.save(user);
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Appointment> getUserAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"))) {
            return appointmentRepository.findAll();
        }
        return appointmentRepository.findByUserId(userDetails.getId());
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentRequest appointmentRequest) {
        // ... (rest of method is same)
        Barber barber = barberRepository.findById(appointmentRequest.getBarberId())
                .orElseThrow(() -> new RuntimeException("Error: Barber not found."));

        Appointment appointment = new Appointment();
        appointment.setBarber(barber);
        appointment.setStartTime(appointmentRequest.getStartTime());
        appointment.setEndTime(appointmentRequest.getStartTime().plusHours(1)); // Default 1 hour duration
        appointment.setStatus(Appointment.Status.BOOKED);

        // Check if it's a registered user or a guest
        if (appointmentRequest.getUserId() != null) {
            User user = userRepository.findById(appointmentRequest.getUserId())
                    .orElseThrow(() -> new RuntimeException("Error: User not found."));
            appointment.setUser(user);
        } else {
            // Guest booking - require guest info
            if (appointmentRequest.getGuestName() == null || appointmentRequest.getGuestEmail() == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Guest name and email are required for guest bookings."));
            }
            appointment.setGuestName(appointmentRequest.getGuestName());
            appointment.setGuestEmail(appointmentRequest.getGuestEmail());
            appointment.setGuestPhone(appointmentRequest.getGuestPhone());
        }

        appointment.setNotes(appointmentRequest.getNotes());

        if (appointmentRequest.getAppointmentTypeId() != null) {
            com.barbershop.backend.model.AppointmentType type = appointmentTypeRepository
                    .findById(appointmentRequest.getAppointmentTypeId())
                    .orElse(null); // Or default
            appointment.setAppointmentType(type);
        }

        appointmentRepository.save(appointment);

        return ResponseEntity.ok(new MessageResponse("Appointment booked successfully!"));
    }

    @GetMapping("/available-slots")
    public List<String> getAvailableSlots(
            @RequestParam Long barberId,
            @RequestParam String date) {
        // ... (method same)
        LocalDate selectedDate = LocalDate.parse(date);

        // Get all appointments for this barber on this date
        LocalDateTime startOfDay = selectedDate.atStartOfDay();
        LocalDateTime endOfDay = selectedDate.atTime(LocalTime.MAX);

        List<Appointment> bookedAppointments = appointmentRepository.findByBarberIdAndStartTimeBetween(
                barberId, startOfDay, endOfDay);

        // Business hours: 9am to 6pm, 1 hour slots
        List<String> allSlots = new ArrayList<>();
        for (int hour = 9; hour < 18; hour++) {
            LocalTime slotTime = LocalTime.of(hour, 0);
            LocalDateTime slotDateTime = selectedDate.atTime(slotTime);

            // Check if this slot is already booked
            boolean isBooked = bookedAppointments.stream()
                    .anyMatch(appt -> appt.getStartTime().equals(slotDateTime));

            // Don't show past slots for today
            if (selectedDate.equals(LocalDate.now()) && slotDateTime.isBefore(LocalDateTime.now())) {
                continue;
            }

            if (!isBooked) {
                allSlots.add(slotDateTime.toString());
            }
        }

        return allSlots;
    }

    @GetMapping("/barber/{barberId}")
    public List<Appointment> getBarberAppointments(@PathVariable Long barberId) {
        return appointmentRepository.findByBarberId(barberId);
    }

    @GetMapping("/all")
    public List<Appointment> getAllAppointmentsPublic() {
        return appointmentRepository.findAll();
    }

    @GetMapping("/my-barber-appointments")
    @PreAuthorize("hasAuthority('BARBER')")
    public List<Appointment> getMyBarberAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Find the barber associated with this user
        Barber barber = barberRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: Barber profile not found for this user."));

        return appointmentRepository.findByBarberId(barber.getId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Appointment not found."));

        return ResponseEntity.ok(appointment);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Appointment not found."));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Check if user is admin or the owner of the appointment
        boolean isAdmin = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));
        boolean isOwner = appointment.getUser() != null && appointment.getUser().getId().equals(userDetails.getId());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: You are not authorized to delete this appointment."));
        }

        appointmentRepository.delete(appointment);
        return ResponseEntity.ok(new MessageResponse("Appointment deleted successfully!"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateAppointment(@PathVariable Long id, @RequestBody AppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Appointment not found."));

        // Update barber if provided
        if (request.getBarberId() != null) {
            Barber barber = barberRepository.findById(request.getBarberId())
                    .orElseThrow(() -> new RuntimeException("Error: Barber not found."));
            appointment.setBarber(barber);
        }

        // Update time if provided
        if (request.getStartTime() != null) {
            appointment.setStartTime(request.getStartTime());
            appointment.setEndTime(request.getStartTime().plusHours(1));
        }

        // Update fields if provided in request
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }
        if (request.getAppointmentTypeId() != null) {
            com.barbershop.backend.model.AppointmentType type = appointmentTypeRepository
                    .findById(request.getAppointmentTypeId())
                    .orElseThrow(() -> new RuntimeException("Error: Appointment type not found."));
            appointment.setAppointmentType(type);
        }

        appointmentRepository.save(appointment);
        return ResponseEntity.ok(new MessageResponse("Appointment updated successfully!"));
    }
}
