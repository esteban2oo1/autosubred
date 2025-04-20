# AutoSubred - Calculadora de Subredes y Configuración DHCP

Una aplicación web completa para el cálculo de subredes y configuración automática de servidores DHCP. Incluye una interfaz de usuario moderna y un backend robusto.

## Visión General

Este proyecto está dividido en dos partes principales:

- **Frontend**: Una aplicación Next.js moderna con una interfaz de usuario intuitiva
- **Backend**: Una API REST en Node.js que maneja los cálculos y la configuración SSH

## Características Principales

- Calculadora de subredes simple
- Calculadora VLSM (Variable Length Subnet Masking)
- Configuración automática de servidores DHCP vía SSH
- Interfaz responsiva con tema claro/oscuro
- API RESTful documentada

## Estructura del Proyecto

```
autosubred/
├── frontend/       # Aplicación Next.js
├── backend/        # API REST en Node.js
└── README.md      # Este archivo
```

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
cp .env.example .env  # Configura las variables de entorno
npm run dev
```

3. Configura el frontend:
```bash
cd frontend
pnpm install
cp .env.example .env.local  # Configura las variables de entorno
pnpm dev
```

4. Abre http://localhost:3000 en tu navegador

## Documentación

- [Documentación del Frontend](frontend/README.md)
- [Documentación del Backend](backend/README.md)

## Docker

El proyecto incluye Dockerfiles tanto para el frontend como para el backend:

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

## Contribuir

Las contribuciones son bienvenidas! Por favor, lee las guías de contribución en cada subdirectorio antes de empezar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.