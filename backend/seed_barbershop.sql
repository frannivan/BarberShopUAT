-- ==========================================
-- SCRIPT DE DATOS INICIALES ("SEMILLA")
-- ==========================================
-- Ejecuta esto en Neon.tech después de crear las tablas.

SET search_path TO "barbershop";

-- 1. Insertar Usuarios (Password: 123456)
-- Generado con BCrypt: $2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS
INSERT INTO users (email, password, name, role) VALUES 
('admin@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Admin', 'ADMIN'),
('carlos@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Carlos', 'BARBER'),
('pepe@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Pepe', 'BARBER'),
('sarah@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Sarah', 'BARBER');

-- 2. Insertar Barberos (Vinculados a usuarios)
INSERT INTO barbers (name, photoUrl, active, user_id) VALUES 
('Carlos', 'assets/barbers/carlos.png', true, (SELECT id FROM users WHERE email='carlos@barbershop.com')),
('Pepe', 'assets/barbers/pepe.png', true, (SELECT id FROM users WHERE email='pepe@barbershop.com')),
('Sarah', 'assets/barbers/sarah.png', true, (SELECT id FROM users WHERE email='sarah@barbershop.com'));

-- 3. Insertar Tipos de Cita
INSERT INTO appointment_types (name, price, durationMinutes, color) VALUES 
('Corte Clásico', 15.00, 30, '#4CAF50'),
('Barba y Corte', 25.00, 45, '#2196F3'),
('Afeitado Premium', 20.00, 30, '#FFC107'),
('Tinte de Cabello', 35.00, 60, '#9C27B0');

-- 4. Confirmación
SELECT 'Datos iniciales cargados en schema barbershop' as mensaje;
