# AutoSubred - Calculadora de Subredes y Configuración DHCP

Una aplicación web completa para el cálculo de subredes y configuración automática de servidores DHCP. Incluye una interfaz de usuario moderna y un backend robusto.

## Visión General

Este proyecto está dividido en dos partes principales:

### Frontend (Next.js)
- Desarrollado con Next.js 15 y React 19
- TypeScript para tipo seguro
- Tailwind CSS para estilos
- Componentes UI modernos con shadcn/ui
- Validación de formularios con Zod
- React Hook Form para manejo de formularios

### Backend (Node.js)
- API REST con Express
- Conexiones SSH seguras con node-ssh
- Cálculos precisos con ip-subnet-calculator
- CORS habilitado para desarrollo
- Variables de entorno con dotenv

## Características Principales

- Calculadora de subredes simple
- Calculadora VLSM (Variable Length Subnet Masking)
- Configuración automática de servidores DHCP vía SSH
- Interfaz responsiva con tema claro/oscuro
- API RESTful documentada

## Estructura Detallada del Proyecto

```
autosubred/
├── frontend/
│   ├── app/             # App router de Next.js
│   ├── components/      # Componentes React
│   ├── lib/            # Utilidades y helpers
│   ├── public/         # Archivos estáticos
│   └── styles/         # Estilos CSS
│
├── backend/
│   ├── controllers/    # Controladores de la API
│   ├── routes/        # Rutas de la API
│   ├── services/      # Lógica de negocio
│   ├── utils/         # Utilidades
│   └── index.js       # Punto de entrada
│
└── README.md          # Este archivo
```

## API Endpoints

### Subnet
- `POST /api/subnet/calculate` - Calcula información de subredes

### DHCP
- `POST /api/dhcp/configure` - Configura servidor DHCP

### SSH
- `POST /api/ssh/connect` - Prueba conexión SSH

## Requisitos Previos

- Node.js 18 o superior
- pnpm (para el frontend)
- npm (para el backend)
- Git

## Inicio Rápido

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/autosubred.git
cd autosubred
```

2. Configura el backend:
```bash
cd backend
npm install
# Crea .env con:
# PORT=3001
npm run dev
```

3. Configura el frontend:
```bash
cd frontend
pnpm install
# Crea .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
pnpm dev
```

4. Abre http://localhost:3000 en tu navegador

## Componentes Principales del Frontend

- `SimpleSubnetCalculator` - Calculadora básica de subredes
- `VLSMCalculator` - Calculadora VLSM
- `SSHConnection` - Gestión de conexiones SSH
- `SubnetResults` - Visualización de resultados

## Docker

El proyecto incluye Dockerfiles para ambos servicios:

```bash
# Backend
cd backend
docker build -t autosubred-backend .
docker run -p 3001:3001 autosubred-backend

# Frontend
cd frontend
docker build -t autosubred-frontend .
docker run -p 3000:3000 autosubred-frontend
```

## Desarrollo

### Frontend
```bash
cd frontend
pnpm dev     # Desarrollo
pnpm build   # Construcción
pnpm start   # Producción
```

### Backend
```bash
cd backend
npm run dev   # Desarrollo con recarga automática
npm start     # Producción
```

## Contribuir

Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.