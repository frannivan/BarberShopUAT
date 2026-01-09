package com.barbershop.backend.payload.request;

import lombok.Data;

@Data
public class BarberRequest {
    private String name;
    private String email;
    private String password;
    private String photoUrl;
    private Long userId;
    private String color;
}
