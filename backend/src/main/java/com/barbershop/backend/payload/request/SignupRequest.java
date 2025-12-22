package com.barbershop.backend.payload.request;

import lombok.Data;

import java.util.Set;

@Data
public class SignupRequest {
    private String name;
    private String email;
    private String role;
    private String password;
}
