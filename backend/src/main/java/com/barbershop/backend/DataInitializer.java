package com.barbershop.backend;

import com.barbershop.backend.model.AppointmentType;
import com.barbershop.backend.model.Barber;
import com.barbershop.backend.model.User;
import com.barbershop.backend.repository.AppointmentTypeRepository;
import com.barbershop.backend.repository.BarberRepository;
import com.barbershop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BarberRepository barberRepository;

    @Autowired
    private AppointmentTypeRepository appointmentTypeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Only initialize if DB is empty
        if (userRepository.count() == 0) {
            System.out.println("Initializing Demo Data...");

            // 1. Users
            User admin = createUser("Admin", "admin@barbershop.com", "ADMIN");
            User carlos = createUser("Carlos", "carlos@barbershop.com", "BARBER");
            User pepe = createUser("Pepe", "pepe@barbershop.com", "BARBER");
            User sarah = createUser("Sarah", "sarah@barbershop.com", "BARBER");

            // 2. Barbers
            createBarber("Carlos", "assets/barbers/carlos.png", carlos);
            createBarber("Pepe", "assets/barbers/pepe.png", pepe);
            createBarber("Sarah", "assets/barbers/sarah.png", sarah);

            // 3. Appointment Types
            createType("Corte Clásico", 15.00, 30, "#4CAF50");
            createType("Barba y Corte", 25.00, 45, "#2196F3");
            createType("Afeitado Premium", 20.00, 30, "#FFC107");
            createType("Tinte de Cabello", 35.00, 60, "#9C27B0");

            System.out.println("Demo Data Initialized!");
        }
    }

    private User createUser(String name, String email, String role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("123456"));
        user.setRole(User.Role.valueOf(role));
        return userRepository.save(user);
    }

    private void createBarber(String name, String photoUrl, User user) {
        Barber barber = new Barber();
        barber.setName(name);
        barber.setPhotoUrl(photoUrl);
        barber.setActive(true);
        barber.setUser(user);
        barberRepository.save(barber);
    }

    private void createType(String name, double price, int duration, String color) {
        AppointmentType type = new AppointmentType();
        type.setName(name);
        type.setPrice(price);
        type.setDurationMinutes(duration);
        type.setColor(color);
        appointmentTypeRepository.save(type);
    }
}
