package com.barbershop.backend.model;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "appointment_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private Double price;

    private Integer durationMinutes; // Standard duration

    private String color; // Hex code for UI display
}
