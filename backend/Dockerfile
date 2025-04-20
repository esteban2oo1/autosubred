# Usar una imagen oficial de Node.js como base
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json primero para aprovechar el cache de Docker
COPY package*.json ./

# Instalar dependencias en modo producción
RUN npm ci --omit=dev

# Copiar el resto de los archivos de la app
COPY . .

# Crear y usar un usuario no root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Exponer el puerto de la app
EXPOSE 3000

# Comando para iniciar la app
CMD ["node", "index.js"]
