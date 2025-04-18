import { Client } from 'ssh2';
import { activeConnections } from '../routes/ssh';

interface SshConnectionParams {
  host: string;
  port: number;
  username: string;
  password: string;
}

// Simulación de conexión SSH
export async function connectToServer(params: SshConnectionParams): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Validar parámetros
    if (!params.host || !params.username || !params.password) {
      reject(new Error("Faltan parámetros de conexión"));
      return;
    }

    // Simulamos un retraso de red
    setTimeout(() => {
      // Simulamos una conexión exitosa
      if (params.host && params.username && params.password) {
        resolve(true);
      } else {
        reject(new Error("Error al conectar con el servidor"));
      }
    }, 1500);
  });
}

interface DhcpConfigParams {
  config: string;
  connectionId: string;
  password: string;
}

// Función para configurar DHCP usando una conexión SSH existente
export async function configureDhcp(params: DhcpConfigParams): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Verificar que hay una configuración y todos los parámetros necesarios
    if (!params.config) {
      reject(new Error("Falta el parámetro de configuración DHCP"));
      return;
    }
    if (!params.connectionId) {
      reject(new Error("Falta el ID de conexión SSH"));
      return;
    }
    if (!params.password) {
      reject(new Error("Falta la contraseña para ejecutar comandos sudo"));
      return;
    }

    const sshClient = activeConnections.get(params.connectionId);
    if (!sshClient) {
      reject(new Error("Conexión SSH no encontrada. Por favor, establezca primero una conexión SSH."));
      return;
    }

    const escapedConfig = params.config.replace(/'/g, "'\\''");
    const updateScript = `#!/bin/bash
set -e
service isc-dhcp-server stop
cat > /etc/dhcp/dhcpd.conf << 'EOL'
${escapedConfig}
EOL
service isc-dhcp-server start
`;
    
    const command = `echo '${params.password}' | sudo -S bash -c "bash -s" << 'EOSUDO'
${updateScript}
EOSUDO`;

    sshClient.exec(command, (err, stream) => {
      if (err) {
        reject(new Error(`Error ejecutando comando remoto: ${err.message}`));
        return;
      }

      let errorOutput = '';

      stream.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      stream.on('close', (code: number) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Error al aplicar la configuración DHCP: ${errorOutput}`));
        }
      });
    });
  });
}