# IoT Web Application

Esta es una aplicación web IoT enfocada en el monitoreo y control remoto de dispositivos conectados. La plataforma está diseñada para permitir a los usuarios crear sus propios dashboards personalizados, monitorear datos en tiempo real, controlar dispositivos y generar reportes en formatos Excel y PDF. Es una excelente herramienta tanto para aprender desarrollo web como para desplegar aplicaciones manteniendo altos estándares de seguridad.

## Características principales

- **Monitoreo en tiempo real**: Supervisa datos y estados de dispositivos conectados al sistema.
- **Control remoto**: Permite la interacción y configuración de dispositivos desde cualquier lugar.
- **Dashboards personalizables**: Los usuarios pueden diseñar y gestionar sus propios paneles según sus necesidades.
- **Reportes automatizados**: Genera reportes en Excel y PDF con información detallada y precisa.
- **Seguridad avanzada**: 
  - Autenticación de usuarios mediante JSON Web Token (JWT).
  - Cifrado de contraseñas.
  - Autenticación de dispositivos con el broker MQTT.

## Tecnologías utilizadas

- **Frontend**: Nuxt.js
- **Backend**: Node.js y Express
- **Broker MQTT**: EMQX
- **Contenedores**: Docker
- **Infraestructura**: AWS

## Objetivo del proyecto

Este proyecto fue diseñado como un prototipo funcional para explorar y aprender sobre:

1. Desarrollo de aplicaciones web modernas y responsivas.
2. Implementación de estándares de seguridad en aplicaciones IoT.
3. Gestión y control eficiente de dispositivos conectados.
4. Despliegue de aplicaciones utilizando tecnologías avanzadas como Docker y AWS.

## Inspiración

Este proyecto está inspirado en el curso **IoTicos God Level App**, el cual fue una base fundamental para diseñar esta aplicación, integrando tecnologías avanzadas y buenas prácticas en el desarrollo de aplicaciones IoT. 

Repositorio original del curso: [ioticos_god_level_app](https://github.com/ioticos/ioticos_god_level_app.git)

## Instalación y configuración

### Requisitos previos

- Node.js (versión 14 o superior)
- Docker
- Cuenta de AWS para servicios de infraestructura (opcional, según configuración)

### Pasos de instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/usuario/repositorio-iot-web-app.git
   cd repositorio-iot-web-app
   ```

2. Instala las dependencias del frontend y backend:

   ```bash
   # En la carpeta raíz del proyecto
   cd frontend
   npm install

   cd ../backend
   npm install
   ```

3. Configura las variables de entorno:

   - Crea un archivo `.env` en la carpeta `backend` con las siguientes variables:

     ```env
     JWT_SECRET=tu_secreto_para_jwt
     MQTT_BROKER_URL=tcp://localhost:1883
     AWS_ACCESS_KEY_ID=tu_clave_de_acceso
     AWS_SECRET_ACCESS_KEY=tu_secreto_de_acceso
     ```

4. Inicia los servicios con Docker:

   ```bash
   docker-compose up
   ```

5. Accede a la aplicación:

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:4000](http://localhost:4000)

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas colaborar, por favor sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza los cambios y haz un commit (`git commit -m "Agregada nueva funcionalidad"`).
4. Envía tus cambios (`git push origin feature/nueva-funcionalidad`).
5. Crea un pull request.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

¡Gracias por explorar esta aplicación! Si tienes preguntas, no dudes en abrir un issue o contactarme directamente.
