-- Insertar Usuarios (Password: 123456)
-- Hash BCrypt para '123456'
-- Usamos 'INSERT INTO users' sin especificar ID para que lo maneje el autoincremento de H2
MERGE INTO users (email, password, name, role) KEY(email) VALUES 
('admin@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Admin', 'ADMIN');

-- Barberos
MERGE INTO users (email, password, name, role) KEY(email) VALUES 
('carlos@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Carlos', 'BARBER'),
('mike@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Mike', 'BARBER'),
('sarah@barbershop.com', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdU9OOfWvXidC6DCp/9jS', 'Sarah', 'BARBER');

INSERT INTO barbers (name, photo_url, active, user_id) VALUES 
('Carlos', 'assets/barbers/carlos.png', true, (SELECT id FROM users WHERE email='carlos@barbershop.com')),
('Mike', 'assets/barbers/mike.png', true, (SELECT id FROM users WHERE email='mike@barbershop.com')),
('Sarah', 'assets/barbers/sarah.png', true, (SELECT id FROM users WHERE email='sarah@barbershop.com'));

-- Tipos de Cita
INSERT INTO appointment_types (name, price, duration_minutes, color) VALUES 
('Corte Clásico', 15.00, 30, '#4CAF50'),
('Barba y Corte', 25.00, 45, '#2196F3'),
('Afeitado Premium', 20.00, 30, '#FFC107'),
('Tinte de Cabello', 35.00, 60, '#9C27B0');
