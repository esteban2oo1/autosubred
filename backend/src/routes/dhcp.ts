import express from 'express'
import { z } from 'zod'
import { configureDhcp } from '../utils/ssh-utils'
import { activeConnections } from './ssh'

const router = express.Router()

// Schema para validación
const configSchema = z.object({
  config: z.string(),
  connectionId: z.string(),
  password: z.string()
})

router.post('/configure', async (req, res) => {
  try {
    const data = configSchema.parse(req.body)
    
    if (!activeConnections.has(data.connectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Conexión SSH no encontrada. Por favor, establezca primero una conexión SSH.'
      })
    }

    await configureDhcp(data)
    return res.json({ success: true, message: 'Configuración DHCP aplicada correctamente' })
  } catch (error) {
    console.error('Error en configuración DHCP:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos de configuración inválidos',
        details: error.errors 
      })
    } else {
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Error al aplicar la configuración DHCP'
      })
    }
  }
})

export default router
