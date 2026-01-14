package com.barbershop.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex, WebRequest request) {
        ex.printStackTrace(); // PRINT TO CONSOLE
        Map<String, String> body = new HashMap<>();
        body.put("error", "Global Error: " + ex.getMessage());
        body.put("message", ex.getMessage()); // Added for snackbar consistency
        body.put("cause", ex.getCause() != null ? ex.getCause().getMessage() : "N/A");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
}
