package com.barbershop.backend.model;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne
    @JoinColumn(name = "barber_id")
    private Barber barber;

    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private Status status;

    // Guest info for appointments without user account
    private String guestName;
    private String guestEmail;
    private String guestPhone;

    // Additional appointment details
    private String notes;

    @ManyToOne
    @JoinColumn(name = "appointment_type_id")
    private AppointmentType appointmentType;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy; // User email or "SYSTEM" or "GUEST"
    private String creationSource; // e.g. "WEB", "MOBILE", "WALK_IN"

    public enum Status {
        BOOKED,
        COMPLETED,
        CANCELLED
    }

    // Helper method to get client name (works for both registered users and guests)
    public String getClientName() {
        if (user != null) {
            return user.getName();
        }
        return guestName;
    }

    public String getClientEmail() {
        if (user != null) {
            return user.getEmail();
        }
        return guestEmail;
    }
}
