package com.barbershop.backend.payload.request;

import lombok.Data;

@Data
public class BarberRequest {
    private String name;
    private String photoUrl;
    private String email;
    private String password;
}
