package com.barbershop.backend.controller;

import com.barbershop.backend.model.User;
import com.barbershop.backend.payload.request.LoginRequest;
import com.barbershop.backend.payload.request.SignupRequest;
import com.barbershop.backend.payload.response.JwtResponse;
import com.barbershop.backend.payload.response.MessageResponse;
import com.barbershop.backend.repository.UserRepository;
import com.barbershop.backend.security.JwtUtils;
import com.barbershop.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    com.barbershop.backend.repository.BarberRepository barberRepository;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // ... (signin logic remains same)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));

        String strRole = signUpRequest.getRole();
        if (strRole == null || strRole.isEmpty()) {
            user.setRole(User.Role.USER);
        } else {
            try {
                user.setRole(User.Role.valueOf(strRole.toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(User.Role.USER);
            }
        }

        user = userRepository.save(user);

        // If role is BARBER, create a Barber entity
        if (user.getRole() == User.Role.BARBER) {
            com.barbershop.backend.model.Barber barber = new com.barbershop.backend.model.Barber();
            barber.setName(user.getName());
            barber.setUser(user);
            barber.setActive(true); // Default to active
            // Default photo url or leave null
            barber.setPhotoUrl("https://via.placeholder.com/150");
            barberRepository.save(barber);
        }

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/users")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @DeleteMapping("/users/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found!"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
    }
}
