import { Client, ConnectConfig, KexAlgorithm, CipherAlgorithm, ServerHostKeyAlgorithm, MacAlgorithm } from 'ssh2';
import { activeConnections } from '../routes/ssh';

interface SshConnectionParams {
  host: string;
  port: number;
  username: string;
  password: string;
}

// Configuración base de algoritmos SSH con tipos correctos
const baseAlgorithms = {
  kex: [
    'curve25519-sha256',
    'curve25519-sha256@libssh.org',
    'ecdh-sha2-nistp256',
    'ecdh-sha2-nistp384',
    'ecdh-sha2-nistp521',
    'diffie-hellman-group-exchange-sha256'
  ] as KexAlgorithm[],
  cipher: [
    'chacha20-poly1305@openssh.com',
    'aes128-ctr',
    'aes192-ctr',
    'aes256-ctr',
    'aes128-gcm@openssh.com',
    'aes256-gcm@openssh.com'
  ] as CipherAlgorithm[],
  serverHostKey: [
    'ssh-ed25519',
    'ecdsa-sha2-nistp256',
    'rsa-sha2-512',
    'rsa-sha2-256'
  ] as ServerHostKeyAlgorithm[],
  hmac: [
    'hmac-sha2-256-etm@openssh.com',
    'hmac-sha2-512-etm@openssh.com'
  ] as MacAlgorithm[]
};

export async function connectToServer(params: SshConnectionParams): Promise<{ success: boolean; connectionId?: string }> {
  return new Promise((resolve, reject) => {
    if (!params.host || !params.username || !params.password) {
      reject(new Error("Faltan parámetros de conexión"));
      return;
    }

    const client = new Client();
    const connectionId = Math.random().toString(36).substring(2);

    client.on('ready', () => {
      console.log('Cliente SSH conectado');
      activeConnections.set(connectionId, {
        client,
        host: params.host,
        port: params.port,
        username: params.username,
        password: params.password // Add password to match StoredConnection interface
      });
      resolve({ success: true, connectionId });
    });

    client.on('error', (err) => {
      console.error('Error SSH:', err);
      reject(err);
    });

    try {
      const config: ConnectConfig = {
        host: params.host,
        port: params.port || 22,
        username: params.username,
        password: params.password,
        readyTimeout: 30000,
        debug: (msg: string) => console.log('SSH Debug:', msg),
        algorithms: baseAlgorithms
      };

      client.connect(config);
    } catch (err) {
      reject(err);
    }
  });
}

interface DhcpConfigParams {
  config: string;
  connectionId: string;
  password: string;
}

interface StoredConnection {
  client: Client;
  host: string;
  port: number;
  username: string;
  password: string; // Add password to match the stored connection
}

export async function configureDhcp(params: DhcpConfigParams): Promise<boolean> {
  return new Promise((resolve, reject) => {
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

    // Obtener la información de conexión almacenada
    const storedConnection: StoredConnection | undefined = activeConnections.get(params.connectionId);
    if (!storedConnection) {
      reject(new Error("Conexión SSH no encontrada. Por favor, establezca primero una conexión SSH."));
      return;
    }

    console.log('Usando conexión SSH existente para configurar DHCP');
    const escapedConfig = params.config.replace(/'/g, "'\\''");
    const escapedPassword = params.password.replace(/'/g, "'\\''");
    
    // Separar los comandos para mejor control y manejo de errores
    const commands = [
      `echo '${escapedPassword}' | sudo -S true`,  // Verificar sudo primero
      `echo '${escapedConfig}' | sudo -S tee /etc/dhcp/dhcpd.conf > /dev/null`,
      'sudo service isc-dhcp-server restart'
    ];

    let currentCommandIndex = 0;
    const executeNextCommand = () => {
      if (currentCommandIndex >= commands.length) {
        console.log('Todos los comandos ejecutados exitosamente');
        resolve(true);
        return;
      }

      const command = commands[currentCommandIndex];
      console.log(`Ejecutando comando ${currentCommandIndex + 1}/${commands.length}`);

      storedConnection.client.exec(command, { pty: true }, (err, stream) => {
        if (err) {
          console.error('Error ejecutando comando:', err);
          reject(new Error(`Error ejecutando comando: ${err.message}`));
          return;
        }

        let errorOutput = '';
        let output = '';

        stream.stderr.on('data', (data: Buffer) => {
          const str = data.toString();
          errorOutput += str;
          if (!str.includes('password')) { // No loguear líneas que contengan 'password'
            console.error('STDERR:', str);
          }
        });

        stream.on('data', (data: Buffer) => {
          const str = data.toString();
          output += str;
          if (!str.includes('password')) { // No loguear líneas que contengan 'password'
            console.log('STDOUT:', str);
          }
        });

        stream.on('close', (code: number) => {
          if (code === 0) {
            console.log(`Comando ${currentCommandIndex + 1} ejecutado exitosamente`);
            currentCommandIndex++;
            executeNextCommand();
          } else {
            console.error(`Error ejecutando comando ${currentCommandIndex + 1}`);
            console.error('Error:', errorOutput);
            reject(new Error(`Error al ejecutar el comando: ${errorOutput}`));
          }
        });
      });
    };

    executeNextCommand();
  });
}