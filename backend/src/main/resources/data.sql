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
-- Tipos de Cita (Forzando IDs para coincidir con POS Mock)
MERGE INTO appointment_types (id, name, price, duration_minutes, color) VALUES 
(1, 'Corte Clásico', 250.00, 30, '#4CAF50'),
(2, 'Barba', 150.00, 45, '#2196F3'),
(3, 'Tinte', 500.00, 60, '#9C27B0'),
(4, 'Mascarilla', 100.00, 15, '#FFC107'),
(5, 'Corte Niño', 200.00, 30, '#E91E63');

-- Productos (Mock IDs del Frontend)
MERGE INTO products (id, name, price, stock, image_url) VALUES 
(101, 'Cera Mate', 180.00, 50, 'assets/products/wax.png'),
(102, 'Gel Fijador', 150.00, 30, 'assets/products/gel.png'),
(103, 'Shampoo', 220.00, 20, 'assets/products/shampoo.png');
