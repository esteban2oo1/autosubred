# Frontend - Calculadora de Subredes

Interfaz de usuario para la calculadora de subredes y configuración DHCP. Desarrollada con Next.js y TypeScript.

## Tecnologías Utilizadas

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/ui (componentes)
- Zod (validación)
- React Hook Form

## Características

- Calculadora de subredes simple
- Calculadora VLSM (Variable Length Subnet Masking)
- Configuración de DHCP vía SSH
- Interfaz moderna y responsiva
- Tema claro/oscuro

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
```bash
pnpm install
```
3. Crea un archivo `.env.local` con las siguientes variables:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Desarrollo

Para ejecutar en modo desarrollo:
```bash
pnpm dev
```

## Producción

Para construir y ejecutar en producción:
```bash
pnpm build
pnpm start
```

## Docker

Para construir y ejecutar con Docker:
```bash
docker build -t autosubred-frontend .
docker run -p 3000:3000 autosubred-frontend
```

## Estructura del Proyecto

```
frontend/
├── app/             # App router de Next.js
├── components/      # Componentes React
├── lib/            # Utilidades y helpers
├── public/         # Archivos estáticos
└── styles/         # Estilos CSS
```

## Componentes Principales

- `SimpleSubnetCalculator` - Calculadora básica de subredes
- `VLSMCalculator` - Calculadora VLSM
- `SSHConnection` - Gestión de conexiones SSH
- `SubnetResults` - Visualización de resultados

## Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request