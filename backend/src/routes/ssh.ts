import express from 'express'
import { connectToServer } from '../utils/ssh-utils'
import { z } from 'zod'

const router = express.Router()

// Almacenar conexiones activas
export const activeConnections = new Map()

// Schema para validación
const connectionSchema = z.object({
  host: z.string(),
  port: z.number().default(22),
  username: z.string(),
  password: z.string()
})

router.post('/connect', async (req, res) => {
  try {
    const data = connectionSchema.parse(req.body)
    console.log(`Intentando conectar a: ${data.host}:${data.port} como ${data.username}`)
    
    const result = await connectToServer(data)
    res.json(result)
  } catch (error) {
    console.error('Error en conexión SSH:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false, 
        message: 'Datos de conexión inválidos',
        details: error.errors 
      })
    } else {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error al establecer la conexión SSH'
      })
    }
  }
})

router.post('/disconnect/:connectionId', (req, res) => {
  const { connectionId } = req.params
  
  try {
    const connection = activeConnections.get(connectionId)
    if (connection) {
      connection.client.end()
      activeConnections.delete(connectionId)
      res.json({ success: true, message: 'Desconexión exitosa' })
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Conexión no encontrada' 
      })
    }
  } catch (error) {
    console.error('Error al desconectar:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al cerrar la conexión SSH'
    })
  }
})

// Cleanup de conexiones al cerrar el servidor
process.on('SIGINT', () => {
  console.log('Cerrando conexiones SSH activas...')
  for (const [id, connection] of activeConnections.entries()) {
    try {
      connection.client.end()
      console.log(`Conexión ${id} cerrada correctamente`)
    } catch (error) {
      console.error(`Error al cerrar conexión ${id}:`, error)
    }
  }
  activeConnections.clear()
  process.exit(0)
})

export default router