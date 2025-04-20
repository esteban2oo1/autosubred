"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Save, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { configureDhcp } from "@/lib/api"

interface SubnetPreviewProps {
  subnets: any[]
  isConnected: boolean
  onConfigureSuccess: () => void
}

export function SubnetPreview({ subnets, isConnected, onConfigureSuccess }: SubnetPreviewProps) {
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [error, setError] = useState("")
  const [dhcpConfig, setDhcpConfig] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const generateDhcpConfig = () => {
    if (!subnets || subnets.length === 0) return ""

    let config = "# Configuración DHCP generada automáticamente\n\n"
    
    // Opciones globales
    config += "# Global configuration\n"
    config += "ddns-update-style none;\n"
    config += "default-lease-time 600;\n"
    config += "max-lease-time 7200;\n"
    config += "authoritative;\n\n"
    config += "# DNS configuration\n"
    config += "option domain-name \"example.com\";\n"
    config += "option domain-name-servers 8.8.8.8;\n\n"

    subnets.forEach((subnet, index) => {
      const name = subnet.name || `Subnet_${index + 1}`

      config += `# ${name}\n`
      config += `subnet ${subnet.networkAddress} netmask ${subnet.subnetMask} {\n`
      config += `  range ${subnet.firstUsable} ${subnet.lastUsable};\n`
      config += `  option subnet-mask ${subnet.subnetMask};\n`
      config += `  option routers ${subnet.firstUsable};\n`
      config += `  option broadcast-address ${subnet.broadcastAddress};\n`
      config += `  option domain-name-servers 8.8.8.8;\n`
      config += `}\n\n`
    })

    return config
  }

  const handlePreviewConfig = () => {
    const config = generateDhcpConfig()
    setDhcpConfig(config)
    setShowPreview(true)
  }

  const handleApplyConfig = async () => {
    try {
      setIsConfiguring(true)
      setError("")

      // Recuperar la información de conexión del sessionStorage
      const connectionData = sessionStorage.getItem("ssh_connection");
      if (!connectionData) {
        throw new Error("No se encontró información de conexión SSH. Por favor, vuelve a conectarte al servidor.");
      }

      const { connectionId, password } = JSON.parse(connectionData);
      if (!connectionId || !password) {
        throw new Error("Error al recuperar la información de conexión SSH. Por favor, vuelve a conectarte al servidor.");
      }

      await configureDhcp({
        config: dhcpConfig,
        connectionId,
        password
      });
      
      onConfigureSuccess()
    } catch (err: any) {
      setError(err.message || "Error al configurar DHCP")
    } finally {
      setIsConfiguring(false)
      setShowPreview(false)
    }
  }

  if (!subnets || subnets.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sin subredes</AlertTitle>
        <AlertDescription>Utiliza la calculadora para generar subredes.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección de Red</TableHead>
              <TableHead>Máscara</TableHead>
              <TableHead>Rango Utilizable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subnets.map((subnet, index) => (
              <TableRow key={index}>
                <TableCell>{subnet.name || `Subred ${index + 1}`}</TableCell>
                <TableCell>{subnet.networkAddress}</TableCell>
                <TableCell>{subnet.subnetMask}</TableCell>
                <TableCell>
                  {subnet.firstUsable} - {subnet.lastUsable}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={handlePreviewConfig} disabled={!subnets.length}>
              Vista Previa DHCP
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vista Previa de Configuración DHCP</DialogTitle>
              <DialogDescription>
                Esta configuración se aplicará al archivo /etc/dhcp/dhcpd.conf en el servidor.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Textarea value={dhcpConfig} onChange={(e) => setDhcpConfig(e.target.value)} className="font-mono h-80" />
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApplyConfig} disabled={isConfiguring || !isConnected}>
                {isConfiguring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Aplicar Configuración
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button onClick={handlePreviewConfig} disabled={!subnets.length || !isConnected}>
          Configurar DHCP
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No conectado</AlertTitle>
          <AlertDescription>Conecta al servidor SSH para aplicar la configuración DHCP.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
