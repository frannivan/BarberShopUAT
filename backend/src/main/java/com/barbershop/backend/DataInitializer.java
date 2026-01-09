package com.barbershop.backend;

import com.barbershop.backend.model.*;
import com.barbershop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
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
    private LeadRepository leadRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=================================================");
        System.out.println("ALERTA: SINCRONIZACION FORZADA EN CURSO (V3)");
        System.out.println("=================================================");

        // Clean existing to be 100% sure
        opportunityRepository.deleteAll();
        leadRepository.deleteAll();
        barberRepository.deleteAll();
        appointmentTypeRepository.deleteAll();
        userRepository.deleteAll();

        System.out.println("DataInitializer: Re-creating Database for Demo...");

        // 1. Create Users
        User admin = createUser("Admin", "admin@barbershop.com", "ADMIN");
        User barberUser1 = createUser("Carlos G.", "carlos@barbershop.com", "BARBER");
        User barberUser2 = createUser("Mike R.", "mike@barbershop.com", "BARBER");
        createUser("Juan Pérez", "juan@test.com", "USER");

        // 2. Create Barbers
        createBarber("Carlos G.", "assets/barbers/carlos.png", barberUser1);
        createBarber("Mike R.", "assets/barbers/mike.png", barberUser2);

        // 3. Create Appointment Types
        AppointmentType t1 = createType("Corte Clásico", 15.00, 30, "#4CAF50");
        AppointmentType t2 = createType("Barba y Corte", 25.00, 45, "#2196F3");
        createType("Afeitado Premium", 20.00, 30, "#FFC107");

        // 4. Create Leads (Prospectos)
        Lead l1 = new Lead(null, "Roberto Gómez", "roberto@gmail.com", "555-0101", "Corte de boda", "CHATBOT",
                ELeadStatus.NEW, LocalDateTime.now().minusDays(2), "Interesado en pack familiar.");
        Lead l2 = new Lead(null, "Ana Martínez", "ana.m@outlook.com", "555-0102", "Tinte de cabello", "WEBSITE",
                ELeadStatus.CONTACTED, LocalDateTime.now().minusDays(1), "Llamar por la tarde.");
        Lead l3 = new Lead(null, "Sergio Ramos", "sergio@example.com", "555-0103", "Tratamiento facial", "CHATBOT",
                ELeadStatus.QUALIFIED, LocalDateTime.now().minusHours(5), "Usuario fidelizado.");

        leadRepository.save(l1);
        leadRepository.save(l2);
        leadRepository.save(l3);

        // 5. Create Opportunities
        Opportunity o1 = new Opportunity();
        o1.setLead(l3);
        o1.setServiceType(t1);
        o1.setEstimatedValue(new BigDecimal("50.00"));
        o1.setStatus(EOpportunityStatus.PENDING_APPOINTMENT);
        o1.setFollowUpNotes("Esperando confirmación de fecha.");
        opportunityRepository.save(o1);

        System.out.println("DataInitializer: --- FORCE SYNC COMPLETE ---");
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

    private AppointmentType createType(String name, double price, int duration, String color) {
        AppointmentType type = new AppointmentType();
        type.setName(name);
        type.setPrice(price);
        type.setDurationMinutes(duration);
        type.setColor(color);
        return appointmentTypeRepository.save(type);
    }
}
