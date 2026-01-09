package com.barbershop.backend.security;

import com.barbershop.backend.model.User;
import com.barbershop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("UserDetailsServiceImpl: Searching for email: [" + email + "]");
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> {
                    System.err.println("UserDetailsServiceImpl: ERROR - User not found: [" + email + "]");
                    return new UsernameNotFoundException("User Not Found with email: " + email);
                });

        return UserDetailsImpl.build(user);
    }
}
