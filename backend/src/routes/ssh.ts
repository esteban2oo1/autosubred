import express from 'express'
import { Client } from 'ssh2'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Almacenar conexiones activas
export const activeConnections = new Map<string, Client>()

router.post('/connect', (req, res) => {
  const { host, port, username, password } = req.body

  if (!host || !port || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parámetros de conexión'
    })
  }

  const connectionId = uuidv4()
  const client = new Client()
  let hasResponded = false

  const sendResponse = (response: any) => {
    if (!hasResponded) {
      hasResponded = true
      res.json(response)
    }
  }

  client.on('ready', () => {
    activeConnections.set(connectionId, client)
    sendResponse({
      success: true,
      connectionId,
      message: 'Conexión SSH establecida correctamente'
    })
  })

  client.on('error', (err) => {
    sendResponse({
      success: false,
      message: `Error al conectar: ${err.message}`
    })
  })

  try {
    client.connect({
      host,
      port,
      username,
      password
    })
    return // Adding explicit return after starting connection
  } catch (err: any) {
    sendResponse({
      success: false,
      message: `Error al conectar: ${err.message}`
    })
    return
  }
})

router.post('/disconnect', (req, res) => {
  const { connectionId } = req.body

  if (!connectionId) {
    return res.status(400).json({
      success: false,
      message: 'Falta el ID de conexión'
    })
  }

  const client = activeConnections.get(connectionId)
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Conexión no encontrada'
    })
  }

  try {
    client.end()
    activeConnections.delete(connectionId)
    return res.json({
      success: true,
      message: 'Conexión cerrada correctamente'
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Error al cerrar la conexión: ${err.message}`
    })
  }
})

export default router