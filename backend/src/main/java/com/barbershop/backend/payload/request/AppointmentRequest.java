package com.barbershop.backend.payload.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {
    private Long userId; // nullable for guest bookings
    private Long barberId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Guest info for appointments without user account
    private String guestName;
    private String guestEmail;
    private String guestPhone;

    private String notes;
    private Long appointmentTypeId;
}
