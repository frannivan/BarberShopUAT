package com.barbershop.backend.controller;

import com.barbershop.backend.model.Sale;
import com.barbershop.backend.model.SaleItem;
import com.barbershop.backend.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PosController {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private com.barbershop.backend.repository.UserRepository userRepository;

    @PostMapping("/sales")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_BARBER')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> createSale(@RequestBody Sale sale) {
        System.out.println("DEBUG: Received Sale Payload: " + sale);
        if (sale.getItems() != null) {
            sale.getItems().forEach(i -> System.out.println(
                    "DEBUG: Item: " + i.getItemName() + " | Price: " + i.getPrice() + " | Qty: " + i.getQuantity()));
        }
        try {
            // Get Current User
            org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                userRepository.findByEmail(email).ifPresent(sale::setCreatedBy);
            }

            // Ensure date is set serverside if missing
            if (sale.getDate() == null) {
                sale.setDate(LocalDateTime.now());
            }

            double calculatedTotal = 0;

            // Link items to sale (bidirectional) and validate
            if (sale.getItems() != null && !sale.getItems().isEmpty()) {
                for (SaleItem item : sale.getItems()) {
                    item.setSale(sale);

                    // Robust fallback for missing itemName
                    if (item.getItemName() == null || item.getItemName().trim().isEmpty()) {
                        if (item.getService() != null) {
                            item.setItemName("Servicio");
                        } else if (item.getProduct() != null) {
                            item.setItemName("Producto");
                        } else {
                            item.setItemName("Ítem Varios");
                        }
                    }

                    // Mandatory field validation for persistence robustness
                    if (item.getPrice() == null)
                        item.setPrice(0.0);
                    if (item.getQuantity() == null)
                        item.setQuantity(1);
                    if (item.getSubtotal() == null) {
                        item.setSubtotal(item.getPrice() * item.getQuantity());
                    }

                    calculatedTotal += item.getSubtotal();
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "La venta no tiene ítems."));
            }

            // Ensure total matches items
            if (sale.getTotalAmount() == null || sale.getTotalAmount() == 0) {
                sale.setTotalAmount(calculatedTotal);
            }

            Sale savedSale = saleRepository.save(sale);
            return ResponseEntity.ok(savedSale);
        } catch (Exception e) {
            System.err.println("ERROR CREATING SALE: " + e.getMessage());
            e.printStackTrace();
            String errorMsg = e.getMessage();
            if (e.getCause() != null) {
                errorMsg += " | Cause: " + e.getCause().getMessage();
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error creating sale",
                    "message", errorMsg,
                    "cause", (e.getCause() != null ? e.getCause().getMessage() : "N/A")));
        }
    }

    @GetMapping("/sales/today")
    public ResponseEntity<List<Sale>> getTodaySales() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return ResponseEntity.ok(saleRepository.findByDateBetweenOrderByDateDesc(startOfDay, endOfDay));
    }
}
