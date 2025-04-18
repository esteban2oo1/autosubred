import express from 'express'
import { calculateSubnetInfo } from '../utils/subnet-utils'
import { activeConnections } from './ssh'

const router = express.Router()

router.post('/calculate', async (req, res) => {
  const { ip, mask, numSubnets, subnetRequirements, connectionId, password } = req.body

  if (!ip || !mask || !connectionId || !password) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parámetros requeridos (ip, mask, connectionId, password)'
    })
  }

  // Validar que numSubnets sea un número válido
  if (numSubnets && typeof numSubnets !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'El número de subredes debe ser un valor numérico'
    })
  }

  const sshClient = activeConnections.get(connectionId)
  if (!sshClient) {
    return res.status(404).json({
      success: false,
      message: 'Conexión SSH no encontrada. Por favor, establezca primero una conexión SSH.'
    })
  }

  let responded = false

  const sendResponse = (response: any) => {
    if (!responded) {
      responded = true
      res.json(response)
    }
  }

  try {
    const subnets = calculateSubnetInfo(ip, mask, numSubnets, subnetRequirements)
    
    // Generar la configuración DHCP para las subredes calculadas
    let dhcpConfig = ''
    subnets.forEach(subnet => {
      dhcpConfig += `
subnet ${subnet.networkAddress} netmask ${subnet.subnetMask} {
  range ${subnet.firstUsable} ${subnet.lastUsable};
  option routers ${subnet.firstUsable};
  option subnet-mask ${subnet.subnetMask};
  option broadcast-address ${subnet.broadcastAddress};
}\n`
    })
 
// Aplicar la configuración usando sudo sin redirección directa (funciona con sudo tee)
const escapedConfig = dhcpConfig.replace(/'/g, "'\\''") // Escapar comillas simples para bash

const command = `echo '${escapedConfig}' | sudo tee /etc/dhcp/dhcpd.conf > /dev/null && sudo service isc-dhcp-server restart`

sshClient.exec(command, (err, stream) => {
  if (err) {
    return sendResponse({
      success: false,
      message: 'Error ejecutando comando remoto',
      error: err.message
    })
  }

  let output = ''
  let errorOutput = ''

  stream.on('close', (code: number, signal: string) => {
    return sendResponse({
      success: code === 0,
      message: code === 0
        ? 'Subredes calculadas y configuración DHCP aplicada correctamente'
        : 'Error al aplicar la configuración DHCP',
      subnets,
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
})
} catch (err: any) {
  console.error('Error en el cálculo de subredes:', err)
  return sendResponse({
    success: false,
    message: 'Error durante el cálculo de subredes',
    error: err.message
  })
}
})

export default router