"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2 } from "lucide-react"
import { calculateSubnets } from "@/lib/api"
import { calculateSubnetInfo, calculateVlsmSubnets } from "@/lib/subnet-utils"

interface SimpleSubnetCalculatorProps {
  onCalculate: (results: any) => void
}

export function SimpleSubnetCalculator({ onCalculate }: SimpleSubnetCalculatorProps) {
  const [ipAddress, setIpAddress] = useState("")
  const [prefixLength, setPrefixLength] = useState("")
  const [numSubnets, setNumSubnets] = useState("")
  const [subnets, setSubnets] = useState([
    { id: 1, hosts: 14 },
    { id: 2, hosts: 14 },
  ])
  const [ipValid, setIpValid] = useState<boolean | null>(null)
  const [prefixValid, setPrefixValid] = useState<boolean | null>(null)
  const [numSubnetsValid, setNumSubnetsValid] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validateIp = (ip: string) => {
    const isValid = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip)
    if (isValid) {
      const parts = ip.split(".").map(Number)
      return parts.every((part) => part >= 0 && part <= 255)
    }
    return false
  }

  const validatePrefix = (prefix: string) => {
    const num = Number(prefix)
    return !isNaN(num) && num >= 1 && num <= 32
  }

  const validateNumSubnets = (num: string) => {
    const n = Number(num)
    return !isNaN(n) && n >= 1 && n <= 100
  }

  const handleIpChange = (value: string) => {
    setIpAddress(value)
    if (value) {
      setIpValid(validateIp(value))
    } else {
      setIpValid(null)
    }
  }

  const handlePrefixChange = (value: string) => {
    setPrefixLength(value)
    if (value) {
      setPrefixValid(validatePrefix(value))
    } else {
      setPrefixValid(null)
    }
  }

  const handleNumSubnetsChange = (value: string) => {
    const num = Number(value)
    setNumSubnets(value)

    if (value) {
      const isValid = validateNumSubnets(value)
      setNumSubnetsValid(isValid)

      if (isValid && num !== subnets.length) {
        if (num > subnets.length) {
          // Add more subnets
          const newSubnets = [...subnets]
          for (let i = subnets.length + 1; i <= num; i++) {
            newSubnets.push({ id: i, hosts: 10 })
          }
          setSubnets(newSubnets)
        } else {
          // Remove excess subnets
          setSubnets(subnets.slice(0, num))
        }
      }
    } else {
      setNumSubnetsValid(null)
    }
  }

  const handleHostsChange = (id: number, value: string) => {
    const hosts = Number(value)
    if (!isNaN(hosts) && hosts > 0) {
      setSubnets(subnets.map((subnet) => (subnet.id === id ? { ...subnet, hosts } : subnet)))
    }
  }

  const handleCalculate = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Validate inputs
      if (!ipAddress || !prefixLength || !numSubnets) {
        throw new Error("Por favor complete todos los campos");
      }

      const cidr = parseInt(prefixLength);
      const numSubnetsValue = parseInt(numSubnets);

      let results;
      
      try {
        // Intentar llamar a la API primero
        results = await calculateSubnets({
          ip: ipAddress,
          mask: `/${prefixLength}`,
          numSubnets: numSubnetsValue,
          subnetRequirements: subnets.map(subnet => ({
            name: `Subred ${subnet.id}`,
            hosts: subnet.hosts
          }))
        });
        
        // Verificar si los resultados son válidos
        if (!results || !Array.isArray(results)) {
          throw new Error("Formato de respuesta inválido");
        }
      } catch (apiError) {
        console.warn("Error en la API, usando cálculo local:", apiError);
        
        // Si la API falla, usar el cálculo local como respaldo
        if (subnets.length > 0 && subnets.some(s => s.hosts > 0)) {
          // Usar VLSM si hay hosts específicos por subred
          results = calculateVlsmSubnets(
            ipAddress, 
            `/${prefixLength}`, 
            subnets.map(subnet => ({
              name: `Subred ${subnet.id}`,
              hosts: subnet.hosts
            }))
          );
        } else {
          // Usar cálculo de subredes uniforme
          results = calculateSubnetInfo(
            ipAddress,
            `/${prefixLength}`,
            numSubnetsValue
          );
        }
      }

      // Llamar a onCalculate con los resultados
      onCalculate(results);
      
    } catch (error: any) {
      console.error("Error al calcular subredes:", error);
      setError(error.message || "Error al calcular las subredes");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert CIDR to subnet mask
  const cidrToMask = (cidr: number): string => {
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

  // Helper function to calculate broadcast address
  const calculateBroadcastAddress = (ip: string, mask: string): string => {
    const cidr = Number(mask.substring(1))
    const ipLong = ipToLong(ip)
    const maskLong = -1 << (32 - cidr)
    return longToIp(ipLong | ~maskLong)
  }

  // Helper function to convert IP to long
  const ipToLong = (ip: string): number => {
    const parts = ip.split(".").map(Number)
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
  }

  // Helper function to convert long to IP
  const longToIp = (long: number): string => {
    return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join(".")
  }

  return (
    <div className="bg-[#e8f4f4] p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="ip-address" className="text-gray-700">
            Dirección IP
          </Label>
          <Input
            id="ip-address"
            placeholder="192.168.100.0"
            value={ipAddress}
            onChange={(e) => handleIpChange(e.target.value)}
            className={`bg-[#f5f9f9] border-gray-200 ${
              ipValid === false ? "border-red-500" : ipValid === true ? "border-green-500" : ""
            }`}
          />
          {ipValid === false && <p className="text-red-500 text-xs mt-1">Dirección IP inválida</p>}
          {ipValid === true && <p className="text-green-500 text-xs mt-1">¡Correcto!</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prefix-length" className="text-gray-700">
            Prefijo de red
          </Label>
          <Input
            id="prefix-length"
            placeholder="24"
            value={prefixLength}
            onChange={(e) => handlePrefixChange(e.target.value)}
            className={`bg-[#f5f9f9] border-gray-200 ${
              prefixValid === false ? "border-red-500" : prefixValid === true ? "border-green-500" : ""
            }`}
          />
          <p className="text-gray-500 text-xs mt-1">Rango (1-32)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="num-subnets" className="text-gray-700">
            Número de subredes
          </Label>
          <Input
            id="num-subnets"
            placeholder="2"
            value={numSubnets}
            onChange={(e) => handleNumSubnetsChange(e.target.value)}
            className={`bg-[#f5f9f9] border-gray-200 ${
              numSubnetsValid === false ? "border-red-500" : numSubnetsValid === true ? "border-green-500" : ""
            }`}
          />
          {numSubnetsValid === true && <p className="text-green-500 text-xs mt-1">¡Correcto!</p>}
        </div>
      </div>

      <div className="mt-6">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d5c2f] text-white">
                <th className="py-3 px-4 text-center font-medium">Subred</th>
                <th className="py-3 px-4 text-center font-medium">Número de Hosts</th>
              </tr>
            </thead>
            <tbody>
              {subnets.map((subnet, index) => (
                <tr key={subnet.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-3 px-4 text-center">{subnet.id}</td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      min="1"
                      value={subnet.hosts}
                      onChange={(e) => handleHostsChange(subnet.id, e.target.value)}
                      className="w-24 mx-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleCalculate}
          disabled={!ipValid || !prefixValid || !numSubnetsValid || isLoading}
          className="bg-[#0d5c2f] hover:bg-[#0d5c2f]/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              Calcular
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
