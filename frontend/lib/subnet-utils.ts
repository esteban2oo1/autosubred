// Función para validar una dirección IP
export function isValidIp(ip: string): boolean {
  const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  if (!ipPattern.test(ip)) return false

  const octets = ip.split(".").map(Number)
  return octets.every((octet) => octet >= 0 && octet <= 255)
}

// Función para validar una máscara de subred
export function isValidSubnetMask(mask: string): boolean {
  // Si es formato CIDR (ej. /24)
  if (mask.startsWith("/")) {
    const cidr = Number.parseInt(mask.substring(1))
    return cidr >= 0 && cidr <= 32
  }

  // Si es formato decimal (ej. 255.255.255.0)
  if (!isValidIp(mask)) return false

  const octets = mask.split(".").map(Number)
  let binary = ""
  octets.forEach((octet) => {
    binary += octet.toString(2).padStart(8, "0")
  })

  // Una máscara válida debe tener todos los 1s seguidos y luego todos los 0s
  return /^1*0*$/.test(binary)
}

// Convertir máscara a formato CIDR
export function maskToCidr(mask: string): number {
  if (mask.startsWith("/")) {
    return Number.parseInt(mask.substring(1))
  }

  const octets = mask.split(".").map(Number)
  let count = 0

  octets.forEach((octet) => {
    const bits = octet.toString(2).padStart(8, "0")
    count += (bits.match(/1/g) || []).length
  })

  return count
}

// Convertir CIDR a máscara
export function cidrToMask(cidr: number): string {
  const mask = []
  for (let i = 0; i < 4; i++) {
    if (cidr >= 8) {
      mask.push(255)
      cidr -= 8
    } else if (cidr > 0) {
      mask.push(256 - Math.pow(2, 8 - cidr))
      cidr = 0
    } else {
      mask.push(0)
    }
  }
  return mask.join(".")
}

// Convertir IP a formato numérico
export function ipToLong(ip: string): number {
  const octets = ip.split(".").map(Number)
  return (octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3]
}

// Convertir número a formato IP
export function longToIp(long: number): string {
  return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join(".")
}

// Calcular dirección de red
export function calculateNetworkAddress(ip: string, mask: string): string {
  const ipLong = ipToLong(ip)
  const cidr = maskToCidr(mask)
  const maskLong = -1 << (32 - cidr)
  return longToIp(ipLong & maskLong)
}

// Calcular dirección de broadcast
export function calculateBroadcastAddress(ip: string, mask: string): string {
  const ipLong = ipToLong(ip)
  const cidr = maskToCidr(mask)
  const maskLong = -1 << (32 - cidr)
  return longToIp(ipLong | ~maskLong)
}

// Calcular primera dirección utilizable
export function calculateFirstUsableAddress(networkAddress: string): string {
  const networkLong = ipToLong(networkAddress)
  return longToIp(networkLong + 1)
}

// Calcular última dirección utilizable
export function calculateLastUsableAddress(broadcastAddress: string): string {
  const broadcastLong = ipToLong(broadcastAddress)
  return longToIp(broadcastLong - 1)
}

// Calcular número de hosts
export function calculateNumberOfHosts(cidr: number): number {
  return Math.pow(2, 32 - cidr) - 2
}

// Modificar la función calculateSubnetInfo para corregir los cálculos
export function calculateSubnetInfo(ip: string, mask: string, numSubnets = 1, subnetRequirements: any[] = []): any[] {
  // Validate inputs
  if (!isValidIp(ip)) {
    throw new Error("Dirección IP inválida")
  }

  if (!isValidSubnetMask(mask)) {
    throw new Error("Máscara de subred inválida")
  }

  if (numSubnets < 1) {
    throw new Error("El número de subredes debe ser mayor que 0")
  }

  const cidr = maskToCidr(mask)
  const networkAddress = calculateNetworkAddress(ip, mask)

  // Calculate bits needed for subnets
  const bitsForSubnets = Math.ceil(Math.log2(numSubnets))
  const newCidr = cidr + bitsForSubnets

  if (newCidr > 30) {
    throw new Error("Demasiadas subredes para este rango de red")
  }

  const results = []
  const subnetSize = Math.pow(2, 32 - newCidr)
  const baseIpLong = ipToLong(networkAddress)
  const maxIpLong = ipToLong(calculateBroadcastAddress(networkAddress, "/" + cidr))

  for (let i = 0; i < numSubnets; i++) {
    const subnetIpLong = baseIpLong + i * subnetSize
    
    // Verify we don't exceed the network range
    if (subnetIpLong + subnetSize - 1 > maxIpLong) {
      throw new Error("No hay suficiente espacio para todas las subredes")
    }

    const subnetIp = longToIp(subnetIpLong)
    const subnetMask = cidrToMask(newCidr)
    const broadcastAddress = calculateBroadcastAddress(subnetIp, "/" + newCidr)
    const firstUsable = calculateFirstUsableAddress(subnetIp)
    const lastUsable = calculateLastUsableAddress(broadcastAddress)

    results.push({
      id: i + 1,
      networkAddress: subnetIp,
      subnetMask,
      cidr: newCidr,
      broadcastAddress,
      firstUsable,
      lastUsable,
      numHosts: calculateNumberOfHosts(newCidr)
    })
  }

  return results
}

export function calculateVlsmSubnets(networkAddress: string, networkMask: string, requirements: any[]): any[] {
  if (!isValidIp(networkAddress)) {
    throw new Error("Dirección de red inválida")
  }

  if (!isValidSubnetMask(networkMask)) {
    throw new Error("Máscara de red inválida")
  }

  const cidr = maskToCidr(networkMask)

  if (cidr >= 30) {
    throw new Error("La máscara de red es demasiado pequeña para VLSM")
  }

  let currentIpLong = ipToLong(networkAddress)
  const results = []

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i]
    const hostsNeeded = req.hosts + 2 // +2 para dirección de red y broadcast
    const hostBits = Math.ceil(Math.log2(hostsNeeded))
    const subnetCidr = 32 - hostBits

    if (subnetCidr <= cidr) {
      throw new Error(`La máscara de subred para ${req.name} es demasiado grande`)
    }

    const subnetIp = longToIp(currentIpLong)
    const subnetMask = cidrToMask(subnetCidr)
    const broadcastAddress = calculateBroadcastAddress(subnetIp, "/" + subnetCidr)
    const firstUsable = calculateFirstUsableAddress(subnetIp)
    const lastUsable = calculateLastUsableAddress(broadcastAddress)

    results.push({
      name: req.name,
      hostsRequired: req.hosts,
      networkAddress: subnetIp,
      subnetMask,
      cidr: subnetCidr,
      broadcastAddress,
      firstUsable,
      lastUsable,
      numHosts: calculateNumberOfHosts(subnetCidr),
    })

    currentIpLong = ipToLong(broadcastAddress) + 1
  }

  return results
}
