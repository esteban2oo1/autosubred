import express from 'express'
import cors from 'cors'
import sshRoutes from './routes/ssh'
import dhcpRoutes from './routes/dhcp'
import subnetRoutes from './routes/subnet'

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/ssh', sshRoutes)
app.use('/api/dhcp', dhcpRoutes)
app.use('/api/subnets', subnetRoutes)

// Manejo de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

app.listen(port, () => {
  console.log(`Servidor backend ejecutándose en el puerto ${port}`)
})