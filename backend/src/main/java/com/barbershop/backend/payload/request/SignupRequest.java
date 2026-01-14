package com.barbershop.backend.payload.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    private String name;
    private String email;
    private String role;
    private String password;
    private String phone;
    private String gender;
    private Integer age;

    // For Barber/Staff
    private String color;
    private String photoUrl;

    // For Client Dossier
    private String observations;
}
