# Backend for Subnet Calculator

Este backend proporciona una API para realizar cálculos de subredes y simular conexiones SSH para configuración DHCP.

## Requisitos

- Node.js 14.x o superior
- npm 6.x o superior

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

## Desarrollo

Para ejecutar el servidor en modo desarrollo:
```bash
npm run dev
```

## Producción

Para compilar y ejecutar en producción:
```bash
npm run build
npm start
```

## Endpoints

### POST /api/subnets/calculate

Calcula información de subredes basada en una IP y máscara.

**Request:**
```json
{
  "ip": "192.168.1.0",
  "mask": "/24",
  "numSubnets": 4,
  "subnetRequirements": [
    {
      "name": "Red 1",
      "hosts": 50
    },
    {
      "name": "Red 2",
      "hosts": 30
    }
  ]
}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Red 1",
    "hostsRequired": 50,
    "networkAddress": "192.168.1.0",
    "subnetMask": "255.255.255.192",
    "cidr": 26,
    "broadcastAddress": "192.168.1.63",
    "firstUsable": "192.168.1.1",
    "lastUsable": "192.168.1.62",
    "numHosts": 62
  }
]
```

### POST /api/ssh/connect

Simula una conexión SSH a un servidor.

**Request:**
```json
{
  "host": "192.168.1.1",
  "port": 22,
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/dhcp/configure

Simula la configuración de DHCP en un servidor.

**Request:**
```json
{
  "config": "subnet 192.168.1.0 netmask 255.255.255.0 {\n  range 192.168.1.10 192.168.1.50;\n}"
}
```

**Response:**
```json
{
  "success": true
}
```

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
PORT=3001
``` 