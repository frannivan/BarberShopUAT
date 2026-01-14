package com.barbershop.backend.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cash_cuts")
public class CashCut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Double totalCalculatedAmount; // The system-calculated amount at time of cut

    @Column(nullable = true)
    private Double totalActualAmount; // Optional: what user actually counted

    @Column(length = 500)
    private String notes;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User performedBy;

    public CashCut() {
        this.timestamp = LocalDateTime.now();
    }

    public CashCut(Double totalCalculatedAmount, Double totalActualAmount, String notes, User performedBy) {
        this.totalCalculatedAmount = totalCalculatedAmount;
        this.totalActualAmount = totalActualAmount;
        this.notes = notes;
        this.performedBy = performedBy;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Double getTotalCalculatedAmount() {
        return totalCalculatedAmount;
    }

    public void setTotalCalculatedAmount(Double totalCalculatedAmount) {
        this.totalCalculatedAmount = totalCalculatedAmount;
    }

    public Double getTotalActualAmount() {
        return totalActualAmount;
    }

    public void setTotalActualAmount(Double totalActualAmount) {
        this.totalActualAmount = totalActualAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(User performedBy) {
        this.performedBy = performedBy;
    }
}
