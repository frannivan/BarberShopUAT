# BarberShop UAT

Proyecto de gestión para una Barbería, compuesto por un Backend en Spring Boot y un Frontend en Angular.

## Requisitos Previos

- **Java**: 11
- **Maven**: 3.9.6 o superior
- **Node.js**: v18 o superior
- **Angular CLI**: v17 o superior

## Ejecución del Proyecto

### Backend (Spring Boot)

Para levantar el servidor del backend, sigue estos pasos:

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Ejecuta el comando de Maven:
   ```bash
   mvn spring-boot:run
   ```

El backend estará disponible usualmente en `http://localhost:8080`.

### Frontend (Angular)

Para levantar la aplicación del frontend:

1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias (si es la primera vez):
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```

El frontend estará disponible en `http://localhost:4200`.

## Documentación de la API

Una vez que el backend esté corriendo, puedes acceder a la documentación de Swagger en:
`http://localhost:8080/swagger-ui/index.html`
