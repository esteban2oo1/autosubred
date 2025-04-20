"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calculateSubnetInfo } from "@/lib/subnet-utils"

interface SubnetCalculatorProps {
  onCalculate: (subnets: any[]) => void
}

export function SubnetCalculator({ onCalculate }: SubnetCalculatorProps) {
  const [ipAddress, setIpAddress] = useState("")
  const [subnetMask, setSubnetMask] = useState("")
  const [numSubnets, setNumSubnets] = useState("1")
  const [subnetInfo, setSubnetInfo] = useState<any[]>([])
  const [error, setError] = useState("")

  const handleCalculate = () => {
    try {
      setError("")
      if (!ipAddress || !subnetMask) {
        throw new Error("Por favor, complete todos los campos")
      }
      const result = calculateSubnetInfo(ipAddress, subnetMask, Number.parseInt(numSubnets))
      setSubnetInfo(result)
      onCalculate(result)
    } catch (err: any) {
      setError(err.message || "Error al calcular la información de subred")
      setSubnetInfo([])
      onCalculate([])
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ip-address">Dirección IP</Label>
          <Input
            id="ip-address"
            placeholder="Ej: 192.168.1.0"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subnet-mask">Máscara de Subred</Label>
          <Input
            id="subnet-mask"
            placeholder="Ej: 255.255.255.0"
            value={subnetMask}
            onChange={(e) => setSubnetMask(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="num-subnets">Número de Subredes</Label>
          <Input
            id="num-subnets"
            type="number"
            min="1"
            placeholder="Ej: 2"
            value={numSubnets}
            onChange={(e) => setNumSubnets(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}

      <Button onClick={handleCalculate} className="w-full">
        Calcular
      </Button>

      {subnetInfo.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Resultados:</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subred</TableHead>
                  <TableHead>Dirección de Red</TableHead>
                  <TableHead>Máscara</TableHead>
                  <TableHead>Rango Utilizable</TableHead>
                  <TableHead>Broadcast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subnetInfo.map((subnet, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{subnet.networkAddress}</TableCell>
                    <TableCell>
                      {subnet.subnetMask} (/{subnet.cidr})
                    </TableCell>
                    <TableCell>
                      {subnet.firstUsable} - {subnet.lastUsable}
                    </TableCell>
                    <TableCell>{subnet.broadcastAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
