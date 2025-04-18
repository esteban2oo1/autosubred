"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Server, Key } from "lucide-react"
import { connectToServer as apiConnectToServer } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SshConnectionProps {
  onConnectionChange: (connected: boolean, connectionInfo?: any) => void
}

export function SshConnection({ onConnectionChange }: SshConnectionProps) {
  const [host, setHost] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState("")

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError("")

      // Validar que todos los campos estén llenos
      if (!host || !username || !password) {
        throw new Error("Por favor, complete todos los campos")
      }

      // Validar formato de IP
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
      if (!ipRegex.test(host)) {
        throw new Error("Por favor, ingrese una dirección IP válida")
      }

      const connectionParams = {
        host,
        port: 22,
        username,
        password,
      }

      // Intentar conexión al backend
      const result = await apiConnectToServer(connectionParams)

      if (result.success && result.connectionId) {
        // Guardar la información de conexión en sessionStorage
        const connectionInfo = {
          host,
          username,
          password, // Incluimos la contraseña para operaciones sudo
          connectionId: result.connectionId
        };
        
        // Guardar en sessionStorage
        // Nota: En un entorno de producción, se debería usar un método más seguro
        // para manejar credenciales, como tokens temporales o cookies HTTP-only
        sessionStorage.setItem("ssh_connection", JSON.stringify(connectionInfo));
        console.log("Conexión SSH establecida. ID:", result.connectionId);
        
        setIsConnected(true)
        onConnectionChange(true, connectionInfo)
      } else {
        throw new Error(result.message || "Error al conectar con el servidor")
      }
    } catch (err: any) {
      console.error("Error en la conexión SSH:", err);
      setError(err.message || "Error al conectar con el servidor")
      setIsConnected(false)
      onConnectionChange(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      sessionStorage.removeItem("ssh_connection");
      setIsConnected(false)
      onConnectionChange(false)
    } catch (err: any) {
      setError(err.message || "Error al desconectar del servidor")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="host">Dirección del Servidor</Label>
        <Input
          id="host"
          placeholder="192.168.1.100"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          disabled={isConnected}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          placeholder="ubuntu"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isConnected}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isConnected}
        />
      </div>

      {isConnected ? (
        <Button variant="destructive" className="w-full" onClick={handleDisconnect}>
          Desconectar
        </Button>
      ) : (
        <Button className="w-full" onClick={handleConnect} disabled={isConnecting || !host || !username || !password}>
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Server className="mr-2 h-4 w-4" />
              Conectar
            </>
          )}
        </Button>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <Alert className="bg-green-50 border-green-200">
          <Key className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Conectado a {host} como {username}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
