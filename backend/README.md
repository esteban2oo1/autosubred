# Backend - Calculadora de Subredes y Configuración DHCP

Este es el backend para la aplicación de cálculo de subredes y configuración DHCP. Proporciona APIs REST para realizar cálculos de subredes y configurar servidores DHCP a través de SSH.

## Tecnologías Utilizadas

- Node.js
- Express
- node-ssh (para conexiones SSH)
- ip-subnet-calculator (para cálculos de subredes)
- cors (para manejo de CORS)
- dotenv (para variables de entorno)

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
```bash
npm install
```
3. Crea un archivo `.env` con las siguientes variables:
```
PORT=3001
```

## Desarrollo

Para ejecutar en modo desarrollo con recarga automática:
```bash
npm run dev
```

## Producción

Para ejecutar en producción:
```bash
npm start
```

## Estructura del Proyecto

```
backend/
├── controllers/      # Controladores de la API
├── routes/          # Rutas de la API
├── services/        # Lógica de negocio
├── utils/           # Utilidades
└── index.js         # Punto de entrada
```

## API Endpoints

- `POST /api/subnet/calculate` - Calcula información de subredes
- `POST /api/dhcp/configure` - Configura servidor DHCP
- `POST /api/ssh/connect` - Prueba conexión SSH

## Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request