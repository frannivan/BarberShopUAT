# Manual Técnico - BarberShop

Este documento detalla la arquitectura técnica, correcciones críticas y funcionalidades del sistema BarberShop.

## 🛠 Arquitectura
- **Backend**: Spring Boot 3.x, JPA, Spring Security, JWT.
- **Frontend**: Angular 17+ (Componentes Standalone).
- **Base de Datos**: H2 (Desarrollo) / PostgreSQL (Producción).

## 🐞 Registro de Bugs y Soluciones Críticas

### 1. Error 404 en Conversión de Leads (Enero 2026)
- **Problema**: Al intentar convertir un Lead a Cliente desde el Dashboard de CRM, el sistema devolvía un `404 Not Found` a pesar de que el controlador existía.
- **Causa**: Conflictos de mapeo en el `CRMController` que impedían que Spring registrara correctamente las rutas dinámicas bajo `/api/crm`.
- **Solución**: Se consolidaron los endpoints administrativos del CRM dentro del `AdminController` (bajo la ruta `/api/admin/crm`). Al ser un controlador ya validado y con permisos robustos, las rutas se estabilizaron inmediatamente.
- **Estado**: ✅ Resuelto.

### 2. Modal de Usuario no se cerraba tras Guardar (Enero 2026)
- **Problema**: En el Directorio de Clientes, al crear un nuevo usuario y presionar "Guardar", los datos se enviaban correctamente pero el modal permanecía abierto, confundiendo al usuario.
- **Causa**: Problema de **Change Detection** en Angular. Al ejecutarse dentro de un Observable asíncrono (`HttpClient.post`), Angular no siempre detectaba el cambio de estado de la variable `showUserModal` de forma inmediata.
- **Solución**: Se implementó una llamada explícita a `ChangeDetectorRef.detectChanges()` justo después de cerrar el modal en el bloque `next` de la suscripción. Esto garantiza que la UI se actualice en el mismo ciclo de ejecución del navegador.
- **Estado**: ✅ Resuelto.

### 3. Sincronización de Disponibilidad de Barberos
- **Funcionalidad**: Se añadió un sistema de "Estado" (Activo/Inactivo) para el personal.
- **Lógica**: Cuando un barbero se marca como "Inactivo", el backend filtra su perfil en la lista de disponibilidad de citas.
- **Componentes**: `BarberController` (Backend), `AdminService` y `AdminComponent` (Frontend).

---

## 📅 Roadmap Próximas Implementaciones

### Dossier de Clientes
- **Objetivo**: Ficha técnica individual para cada cliente.
- **Detalle**: Historial de cortes, fotos de referencia del cliente, productos comprados y notas del barbero (ej: "prefiere tijera sobre máquina").

### Dashboard de Reportes
- **Objetivo**: Métricas de negocio para la toma de decisiones.
- **Detalle**: Ingresos por servicio, ocupación por barbero y tasa de retorno de clientes.

## ☁️ Guía de Despliegue - Oracle Cloud (Free Tier)

### 1. Creación de Instancia (Compute Instance)
- **Shape**: `VM.Standard.A1.Flex` (ARM, hasta 4 OCPUs y 24GB RAM - Siempre Gratis) o `VM.Standard.E2.1.Micro` (x86, más limitado).
- **Imagen**: Oracle Linux 8/9 o Ubuntu 22.04 LTS.
- **SSH Keys**: Es crítico generar y bajar el par de claves (Private/Public Key) al crear la instancia. Sin la `.key` (privada) no se podrá acceder.

### 2. Configuración de Red (VCN)
- **VCN y Subnet**: Se crea una VCN con una Subnet pública para que la instancia tenga IP accesible desde internet.
- **Security List (Firewall)**: Se deben añadir "Ingress Rules" para permitir el tráfico:
    - **Puerto 22**: SSH (Acceso remoto).
    - **Puerto 80**: HTTP.
    - **Puerto 443**: HTTPS.
    - **Puerto 8080**: (Opcional) Si se despliega Spring Boot directamente sin proxy inverso inicialmente.

### 3. Conexión SSH
Para conectarse a la instancia desde la terminal local:
1.  Navegar a la carpeta donde está la llave: `cd /ruta/a/la/llave`
2.  Dar permisos correctos a la llave (solo lectura para el usuario): `chmod 400 ssh-key-XXXX.key`
3.  Ejecutar comando de conexión:
    ```bash
    ssh -i ssh-key-XXXX.key opc@IP_PUBLICA_INSTANCIA
    # Nota: El usuario por defecto suele ser 'opc' en Oracle Linux o 'ubuntu' en Ubuntu.
    ```
4.  **Confirmación de Fingerprint**: Al conectar por primera vez, el sistema preguntará:
    `Are you sure you want to continue connecting (yes/no/[fingerprint])?`
    - Se debe escribir `yes` y dar Enter para añadir el host a la lista de conocidos (`known_hosts`).


### 4. Preparación del Entorno (Ubuntu)
Una vez conectado por SSH, ejecutar los siguientes comandos para preparar el servidor:

1.  **Actualizar el sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Instalar Java 17, Maven y Nginx:**
    ```bash
    sudo apt install openjdk-17-jdk maven nginx -y
    ```

3.  **Verificar instalación:**
    ```bash
    java -version
    mvn -version
    nginx -v
    ```

### 5. Despliegue de Código
Sí, la estrategia recomendada es clonar el repositorio y construir en el servidor aprovechando sus recursos.

#### 5.1 Instalar Herramientas Adicionales
1.  **Instalar Git y Node.js (v20):**
    ```bash
    sudo apt install git -y
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    ```
2.  **Verificar versiones:**
    ```bash
    git --version
    node -v
    npm -v
    ```

#### 5.2 Clonar Repositorio
1.  Generar una SSH Key **en el servidor** (para GitHub/GitLab) o usar HTTPS con token.
    ```bash
    ssh-keygen -t ed25519 -C "servidor-oracle"
    cat /home/ubuntu/.ssh/id_ed25519.pub
    # Copiar esta clave pública y agregarla a las "Deploy Keys" de tu repositorio en GitHub/GitLab.
    ```
2.  Clonar el proyecto:
    ```bash
    git clone <URL_DEL_REPO_GIT>
    cd <NOMBRE_DEL_REPO>
    ```

#### 5.3 Construcción y Ejecución (Resumen)
- **Backend**:
  - `cd backend`
  - `mvn clean package -DskipTests`
  - Ejecutar: `java -jar target/barbershop-0.0.1-SNAPSHOT.jar`
- **Frontend**:
  - `cd ../frontend`
  - `npm install --legacy-peer-deps`
  - `npm run build`
  - Copiar archivos a Nginx: `sudo cp -r dist/barbershop-frontend/browser/* /var/www/html/`

### 6. Configuración de Servicio Backend (Systemd)
Para que el backend corra siempre en segundo plano (incluso si cierras la terminal) y arranque automáticamente:

1.  **Instalar editor de texto (si no está):**
    ```bash
    sudo apt install nano -y
    ```

2.  Crear archivo de servicio:
    ```bash
    sudo nano /etc/systemd/system/barbershop.service
    ```
2.  Pegar el siguiente contenido (Asegúrate de que la ruta del JAR sea la correcta):
    ```ini
    [Unit]
    Description=Barbershop Backend
    After=syslog.target network.target

    [Service]
    User=ubuntu
    # Ajusta la ruta /home/ubuntu/proyects/... si tu carpeta es diferente
    ExecStart=/usr/bin/java -jar /home/ubuntu/proyects/BarberShopUAT/backend/target/backend-0.0.1-SNAPSHOT.jar
    SuccessExitStatus=143
    Restart=always
    RestartSec=10

    [Install]
    WantedBy=multi-user.target
    ```
3.  Guardar: Presiona `Ctrl + O`, luego `Enter`.
4.  Salir: Presiona `Ctrl + X`.

5.  **Activar el servicio:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable barbershop
    sudo systemctl start barbershop
    ```
6.  **Verificar estado:**
    ```bash
    sudo systemctl status barbershop
    ```

### 7. Configuración de Firewall y Solución de Problemas
Si la aplicación no es accesible vía navegador (Timeout o Connection Refused), verificar ambos firewalls:

#### 7.1 Oracle Cloud (VCN Security List)
1.  En la consola de Oracle Cloud, ir a **Networking > Virtual Cloud Networks**.
2.  Seleccionar la VCN y luego la **Subnet**.
3.  Entrar a **Default Security List**.
4.  Agregar **Ingress Rule**:
    - Source: `0.0.0.0/0`
    - Protocol: `TCP`
    - Port Range: `80` (y `443` si usas SSL).

#### 7.2 Ubuntu Firewall (Iptables)
Las imágenes de Oracle a veces traen reglas estrictas (`REJECT`) preconfiguradas.
1.  **Verificar reglas:** `sudo iptables -L INPUT -n --line-numbers`
2.  **Abrir puerto 80 (HTTP):**
    IMPORTANTE: Usar `-I INPUT 5` para insertar la regla **antes** de la regla de REJECT (que suele ser la #6 o última).
    ```bash
    # Insertar regla en la posición 5 (antes del bloqueo)
    sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
    
    # Guardar cambios para que persistan tras reinicio
    sudo netfilter-persistent save
    ```

#### 7.3 Configuración de Proxy Inverso (Nginx)
Para conectar Frontend y Backend sin problemas de CORS, configurar Nginx para redirigir `/api` al backend (8080):

1.  Editar configuración: `sudo nano /etc/nginx/sites-available/default`
2.  Agregar dentro del bloque `server { ... }`:
    ```nginx
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    ```
3.  Reiniciar Nginx: `sudo systemctl restart nginx`


