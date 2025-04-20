const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SubnetCalculationRequest {
  ip: string;
  mask: string;
  numSubnets?: number;
  subnetRequirements?: Array<{
    name: string;
    hosts: number;
  }>;
}

interface SshConnectionRequest {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface SshConnectionResponse {
  success: boolean;
  message: string;
  connectionId?: string;
  password?: string;
}

interface DhcpConfigRequest {
  config: string;             // Configuración DHCP a aplicar
  connectionId: string;       // ID de conexión SSH necesario para aplicar la configuración
  password: string;           // Contraseña para ejecutar comandos sudo
}

export async function calculateSubnets(data: SubnetCalculationRequest) {
  const response = await fetch(`${API_BASE_URL}/api/subnets/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al calcular las subredes');
  }

  return response.json();
}

export async function connectToServer(data: SshConnectionRequest): Promise<SshConnectionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ssh/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Error al conectar con el servidor');
  }

  return result;
}

export async function configureDhcp(data: DhcpConfigRequest) {
  const response = await fetch(`${API_BASE_URL}/api/dhcp/configure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al configurar DHCP');
  }

  return response.json();
}