"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { calculateVlsmSubnets } from "@/lib/subnet-utils"

interface VlsmCalculatorProps {
  onCalculate: (subnets: any[]) => void
}

export function VlsmCalculator({ onCalculate }: VlsmCalculatorProps) {
  const [networkAddress, setNetworkAddress] = useState("")
  const [networkMask, setNetworkMask] = useState("")
  const [requirements, setRequirements] = useState([{ name: "Subred 1", hosts: 10 }])
  const [vlsmResults, setVlsmResults] = useState<any[]>([])
  const [error, setError] = useState("")

  const addRequirement = () => {
    setRequirements([...requirements, { name: `Subred ${requirements.length + 1}`, hosts: 10 }])
  }

  const removeRequirement = (index: number) => {
    const newRequirements = [...requirements]
    newRequirements.splice(index, 1)
    setRequirements(newRequirements)
  }

  const updateRequirement = (index: number, field: string, value: string | number) => {
    const newRequirements = [...requirements]
    newRequirements[index] = {
      ...newRequirements[index],
      [field]: field === "hosts" ? Number.parseInt(value as string) : value,
    }
    setRequirements(newRequirements)
  }

  const handleCalculate = () => {
    try {
      setError("")
      const sortedRequirements = [...requirements].sort((a, b) => b.hosts - a.hosts)
      const results = calculateVlsmSubnets(networkAddress, networkMask, sortedRequirements)
      setVlsmResults(results)
      onCalculate(results)
    } catch (err: any) {
      setError(err.message || "Error al calcular subredes VLSM")
      setVlsmResults([])
      onCalculate([])
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="network-address">Dirección de Red</Label>
          <Input
            id="network-address"
            placeholder="192.168.1.0"
            value={networkAddress}
            onChange={(e) => setNetworkAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="network-mask">Máscara de Red</Label>
          <Input
            id="network-mask"
            placeholder="255.255.255.0 o /24"
            value={networkMask}
            onChange={(e) => setNetworkMask(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Requerimientos de Subredes</Label>
          <Button variant="outline" size="sm" onClick={addRequirement}>
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Nombre de subred"
                value={req.name}
                onChange={(e) => updateRequirement(index, "name", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                placeholder="Hosts"
                value={req.hosts}
                onChange={(e) => updateRequirement(index, "hosts", e.target.value)}
                className="w-24"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRequirement(index)}
                disabled={requirements.length === 1}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleCalculate} className="w-full">
        Calcular VLSM
      </Button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {vlsmResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Resultados VLSM:</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Hosts Req.</TableHead>
                  <TableHead>Dirección de Red</TableHead>
                  <TableHead>Máscara</TableHead>
                  <TableHead>Rango Utilizable</TableHead>
                  <TableHead>Broadcast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vlsmResults.map((subnet, index) => (
                  <TableRow key={index}>
                    <TableCell>{subnet.name}</TableCell>
                    <TableCell>{subnet.hostsRequired}</TableCell>
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
