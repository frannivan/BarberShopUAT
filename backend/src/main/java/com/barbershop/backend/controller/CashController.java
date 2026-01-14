package com.barbershop.backend.controller;

import com.barbershop.backend.model.*;
import com.barbershop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cash")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class CashController {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private CashWithdrawalRepository withdrawalRepository;

    @Autowired
    private CashCutRepository cutRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance() {
        // Find last cut
        Optional<CashCut> lastCutOpt = cutRepository.findTopByOrderByTimestampDesc();
        LocalDateTime startDate = lastCutOpt.map(CashCut::getTimestamp).orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        // Sum Sales (CASH only ideally, but user asked for "everything paid", let's
        // separate)
        // For "Cash in Box" (Caja), usually only CASH matters.
        // Let's return a detailed object.

        List<Sale> sales = saleRepository.findByDateAfter(startDate);
        List<CashWithdrawal> withdrawals = withdrawalRepository.findByTimestampAfter(startDate);

        double totalCashSales = sales.stream()
                .filter(s -> "CASH".equalsIgnoreCase(s.getPaymentMethod()))
                .mapToDouble(Sale::getTotalAmount).sum();

        double totalOtherSales = sales.stream()
                .filter(s -> !"CASH".equalsIgnoreCase(s.getPaymentMethod()))
                .mapToDouble(Sale::getTotalAmount).sum();

        double totalWithdrawals = withdrawals.stream().mapToDouble(CashWithdrawal::getAmount).sum();

        double cashBalance = totalCashSales - totalWithdrawals;

        Map<String, Object> response = new HashMap<>();
        response.put("cashBalance", cashBalance);
        response.put("totalRevenue", totalCashSales + totalOtherSales);
        response.put("totalWithdrawals", totalWithdrawals);
        response.put("lastCutDate", lastCutOpt.map(CashCut::getTimestamp).orElse(null));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody CashWithdrawal withdrawal) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        withdrawal.setPerformedBy(user);
        withdrawal.setTimestamp(LocalDateTime.now());

        withdrawalRepository.save(withdrawal);
        return ResponseEntity.ok(Map.of("message", "Withdrawal registered successfully"));
    }

    @PostMapping("/cut")
    public ResponseEntity<?> performCut(@RequestBody Map<String, Object> payload) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        // recalculate expected amount to verify
        // Find last cut
        Optional<CashCut> lastCutOpt = cutRepository.findTopByOrderByTimestampDesc();
        LocalDateTime startDate = lastCutOpt.map(CashCut::getTimestamp).orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        List<Sale> sales = saleRepository.findByDateAfter(startDate);
        List<CashWithdrawal> withdrawals = withdrawalRepository.findByTimestampAfter(startDate);

        double totalCashSales = sales.stream()
                .filter(s -> "CASH".equalsIgnoreCase(s.getPaymentMethod()))
                .mapToDouble(Sale::getTotalAmount).sum();
        double totalWithdrawals = withdrawals.stream().mapToDouble(CashWithdrawal::getAmount).sum();
        double expectedAmount = totalCashSales - totalWithdrawals;

        CashCut cut = new CashCut();
        cut.setTimestamp(LocalDateTime.now());
        cut.setPerformedBy(user);
        cut.setTotalCalculatedAmount(expectedAmount);

        if (payload.containsKey("totalActualAmount")) {
            cut.setTotalActualAmount(Double.valueOf(payload.get("totalActualAmount").toString()));
        }
        if (payload.containsKey("notes")) {
            cut.setNotes((String) payload.get("notes"));
        }

        cutRepository.save(cut);
        return ResponseEntity.ok(Map.of("message", "Cash Cut performed successfully", "cut", cut));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        // Return mixed list of latest 50 actions?
        // Or all actions since last cut?
        // Let's return all actions since last cut for the "Current Register" view
        // And maybe an endpoint for "Past Cuts".

        Optional<CashCut> lastCutOpt = cutRepository.findTopByOrderByTimestampDesc();
        LocalDateTime startDate = lastCutOpt.map(CashCut::getTimestamp).orElse(LocalDateTime.of(2000, 1, 1, 0, 0));

        List<Sale> sales = saleRepository.findByDateAfter(startDate);
        List<CashWithdrawal> withdrawals = withdrawalRepository.findByTimestampAfter(startDate);

        List<Map<String, Object>> history = new ArrayList<>();

        for (Sale s : sales) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "SALE");
            item.put("id", s.getId());
            item.put("amount", s.getTotalAmount());
            item.put("date", s.getDate());
            StringBuilder desc = new StringBuilder("Venta #" + s.getId() + ": ");
            if (s.getItems() != null && !s.getItems().isEmpty()) {
                String itemSummary = s.getItems().stream()
                        .map(i -> i.getItemName() + (i.getBarber() != null ? " (" + i.getBarber().getName() + ")" : ""))
                        .collect(Collectors.joining(", "));
                desc.append(itemSummary);
            }
            if (s.getClient() != null) {
                desc.append(" | Cliente: ").append(s.getClient().getName());
            } else if (s.getGuestName() != null && !s.getGuestName().isEmpty()) {
                desc.append(" | Cliente: ").append(s.getGuestName());
            }
            item.put("description", desc.toString());
            item.put("paymentMethod", s.getPaymentMethod());
            item.put("user", s.getCreatedBy() != null ? s.getCreatedBy().getName() : "Sistema");
            history.add(item);
        }

        for (CashWithdrawal w : withdrawals) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "WITHDRAWAL");
            item.put("id", w.getId());
            item.put("amount", -w.getAmount()); // Negative for display
            item.put("date", w.getTimestamp());
            item.put("description", w.getDescription());
            item.put("user", w.getPerformedBy() != null ? w.getPerformedBy().getName() : "Sistema");
            history.add(item);
        }

        history.sort((a, b) -> ((LocalDateTime) b.get("date")).compareTo((LocalDateTime) a.get("date")));

        return ResponseEntity.ok(history);
    }
}
