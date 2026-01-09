package com.barbershop.backend.service;

import com.barbershop.backend.model.*;
import com.barbershop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CRMService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private AppointmentTypeRepository serviceTypeRepository;

    // Leads logic
    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public Lead createLead(Lead lead) {
        if (lead.getCreatedAt() == null) {
            lead.setCreatedAt(LocalDateTime.now());
        }
        if (lead.getStatus() == null) {
            lead.setStatus(ELeadStatus.NEW);
        }
        return leadRepository.save(lead);
    }

    @Transactional
    public Opportunity convertLeadToOpportunity(Long leadId, Long serviceTypeId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));
        AppointmentType serviceType = serviceTypeRepository.findById(serviceTypeId)
                .orElseThrow(() -> new RuntimeException("Tipo de servicio no encontrado"));

        lead.setStatus(ELeadStatus.QUALIFIED);
        leadRepository.save(lead);

        Opportunity opp = new Opportunity();
        opp.setLead(lead);
        opp.setServiceType(serviceType);
        opp.setStatus(EOpportunityStatus.PENDING_APPOINTMENT);
        opp.setUpdatedAt(LocalDateTime.now());

        return opportunityRepository.save(opp);
    }

    @Transactional
    public Lead updateLeadStatus(Long id, ELeadStatus status) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));
        lead.setStatus(status);
        return leadRepository.save(lead);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder encoder;

    @Transactional
    public User convertLeadToClient(Long leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));

        if (userRepository.existsByEmail(lead.getEmail())) {
            throw new RuntimeException("El email ya está registrado como usuario");
        }

        User user = new User();
        user.setName(lead.getName());
        user.setEmail(lead.getEmail());
        user.setPhone(lead.getPhone());
        user.setRole(User.Role.CLIENTE);
        user.setPassword(encoder.encode("password123")); // Default password

        User savedUser = userRepository.save(user);

        lead.setStatus(ELeadStatus.CONVERTED);
        leadRepository.save(lead);

        return savedUser;
    }

    // Opportunity logic
    public List<Opportunity> getAllOpportunities() {
        return opportunityRepository.findAll();
    }

    public Opportunity updateOpportunity(Long id, Opportunity oppData) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Oportunidad no encontrada"));

        opp.setStatus(oppData.getStatus());
        opp.setFollowUpNotes(oppData.getFollowUpNotes());
        opp.setEstimatedValue(oppData.getEstimatedValue());
        opp.setUpdatedAt(LocalDateTime.now());

        return opportunityRepository.save(opp);
    }
}
