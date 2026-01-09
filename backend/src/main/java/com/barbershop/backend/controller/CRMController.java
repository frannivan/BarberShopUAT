package com.barbershop.backend.controller;

import com.barbershop.backend.model.Lead;
import com.barbershop.backend.service.CRMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/crm")
public class CRMController {

    @Autowired
    private CRMService crmService;

    // Public endpoint for lead capture (Chatbot/Web)
    @PostMapping("/leads")
    public ResponseEntity<Lead> createLead(@RequestBody Lead lead) {
        return ResponseEntity.ok(crmService.createLead(lead));
    }
}
