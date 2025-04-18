import express from 'express'
import { Client } from 'ssh2'

const router = express.Router()

router.post('/configure', async (req, res) => {
  const { config, connectionId } = req.body

  if (!config || !connectionId) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parámetros de configuración'
    })
  }

  const ssh = new Client()
  let responded = false

  const sendResponse = (response: any) => {
    if (!responded) {
      responded = true
      res.json(response)
    }
  }

  ssh.on('ready', () => {
    // Aquí deberíamos construir el comando real basado en la configuración
    const command = 'echo "Aplicando configuración DHCP"'
    
    ssh.exec(command, (err, stream) => {
      if (err) {
        ssh.end()
        return sendResponse({
          success: false,
          message: 'Error ejecutando comando remoto',
          error: err.message
        })
      }

      let output = ''
      let errorOutput = ''

      stream.on('close', (code: number, signal: string) => {
        ssh.end()
        return sendResponse({
          success: code === 0,
          message: code === 0 ? 'Configuración DHCP aplicada correctamente' : 'Error al aplicar la configuración DHCP',
          output,
          errorOutput,
          code,
          signal
        })
      })

      stream.on('data', (data: Buffer) => {
        output += data.toString()
        console.log('STDOUT: ' + data)
      })

      stream.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
        console.error('STDERR: ' + data)
      })

      return
    })
  })

  ssh.on('error', (err) => {
    console.error('SSH Error:', err)
    return sendResponse({
      success: false,
      message: 'Error de conexión SSH',
      error: err.message
    })
  })

  try {
    ssh.connect({
      host: '127.0.0.1', // Esto debería venir de la base de datos o un mapa de connectionId
      username: 'usuario',
      password: 'contraseña',
      readyTimeout: 5000, // 5 segundos de timeout
    })
  } catch (err: any) {
    return sendResponse({
      success: false,
      message: 'Error al iniciar la conexión SSH',
      error: err.message
    })
  }
})

export default router
