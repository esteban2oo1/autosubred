"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InfoIcon, Save, FileText } from "lucide-react"
import { configureDhcp as apiConfigureDhcp } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SubnetResultsProps {
  results: any
  isConnected: boolean
  onConfigureSuccess: () => void
}

export function SubnetResults({ results, isConnected, onConfigureSuccess }: SubnetResultsProps) {
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [dhcpConfig, setDhcpConfig] = useState("")
  const [configApplied, setConfigApplied] = useState(false)

  // Interfaz para los objetos de subred
  interface SubnetInfo {
    name?: string;
    networkAddress?: string;
    network?: string;
    ip?: string;
    subnetMask?: string;
    mask?: string;
    netmask?: string;
    firstUsable?: string;
    firstHost?: string;
    firstAddress?: string;
    lastUsable?: string;
    lastHost?: string;
    lastAddress?: string;
    broadcastAddress?: string;
    broadcast?: string;
    numHosts?: number;
    hosts?: number;
    hostCount?: number;
    [key: string]: any; // Para otras propiedades que puedan existir
  }

  // Función para generar la configuración DHCP
  const generateDhcpConfig = () => {
    // Verificar si hay subredes disponibles
    if (!subnetsArray || subnetsArray.length === 0) {
      console.error("No hay subredes disponibles para generar la configuración DHCP");
      return "# No hay subredes disponibles para configurar";
    }
    
    console.log("Generando configuración DHCP con subredes:", subnetsArray);
    
    let config = "# Configuración DHCP generada automáticamente\n";
    config += "# Fecha: " + new Date().toLocaleString() + "\n\n";
    
    config += "default-lease-time 600;\n";
    config += "max-lease-time 7200;\n\n";
    
    config += "# Configuración global\n";
    config += "option domain-name-servers 8.8.8.8, 8.8.4.4;\n";
    config += "option domain-name \"example.org\";\n\n";
    
    // Agregar cada subred
    subnetsArray.forEach((subnet: SubnetInfo, index: number) => {
      const network = subnet.networkAddress || subnet.network || subnet.ip || null;
      const netmask = subnet.subnetMask || subnet.mask || subnet.netmask || null;
      const firstUsable = subnet.firstUsable || subnet.firstHost || subnet.firstAddress || null;
      const lastUsable = subnet.lastUsable || subnet.lastHost || subnet.lastAddress || null;
      const broadcast = subnet.broadcastAddress || subnet.broadcast || null;
      const name = subnet.name || `Subred ${index + 1}`;
      
      if (network && netmask) {
        config += `# ${name}\n`;
        config += `subnet ${network} netmask ${netmask} {\n`;
        
        if (firstUsable && lastUsable) {
          config += `  range ${firstUsable} ${lastUsable};\n`;
        }
        
        // Asumir que el router es la primera dirección utilizable
        if (firstUsable) {
          config += `  option routers ${firstUsable};\n`;
        }
        
        if (broadcast) {
          config += `  option broadcast-address ${broadcast};\n`;
        }
        
        config += "  option domain-name-servers 8.8.8.8, 8.8.4.4;\n";
        config += "}\n\n";
      }
    });
    
    return config;
  };

  // Manejar la previsualización de la configuración
  const handleShowPreview = () => {
    const config = generateDhcpConfig();
    setDhcpConfig(config);
    setShowPreview(true);
  };

  // Manejar la aplicación de la configuración
  const handleApplyConfig = async () => {
    if (!isConnected) {
      setError("Debes estar conectado a un servidor para aplicar la configuración");
      return;
    }

    try {
      setIsConfiguring(true);
      setError("");
      
      let configToApply = dhcpConfig;
      if (!configToApply) {
        configToApply = generateDhcpConfig();
        setDhcpConfig(configToApply);
      }
      
      // Recuperar la información de conexión del sessionStorage
      const connectionData = sessionStorage.getItem("ssh_connection");
      console.log("Datos de conexión almacenados:", connectionData);
      
      if (!connectionData) {
        throw new Error("No se encontró información de conexión SSH. Por favor, vuelve a conectarte al servidor.");
      }

      let connectionId, password;
      try {
        const parsedData = JSON.parse(connectionData);
        connectionId = parsedData.connectionId;
        password = parsedData.password;
        console.log("ID de conexión recuperado:", connectionId);
        
        if (!connectionId) {
          throw new Error("El ID de conexión no está presente en los datos almacenados");
        }

        if (!password) {
          throw new Error("La contraseña no está presente en los datos almacenados");
        }
      } catch (e) {
        console.error("Error al procesar los datos de conexión:", e);
        throw new Error("Error al recuperar la información de conexión SSH. Por favor, vuelve a conectarte al servidor.");
      }
      
      const payload = { 
        config: configToApply, 
        connectionId,
        password 
      };
      
      console.log("Enviando configuración DHCP con payload:", payload);
      
      const response = await apiConfigureDhcp(payload);
      console.log("Respuesta del servidor:", response);
      
      setConfigApplied(true);
      onConfigureSuccess();
    } catch (err: any) {
      console.error("Error al aplicar configuración DHCP:", err);
      setError(err.message || "Error al aplicar la configuración DHCP");
      setConfigApplied(false);
    } finally {
      setIsConfiguring(false);
    }
  };

  // Si no hay resultados, mostrar un mensaje
  if (!results || (Array.isArray(results) && results.length === 0)) {
    return (
      <div className="text-center p-4">
        <p>No hay resultados disponibles</p>
      </div>
    )
  }

  // Normalizar los resultados en un array
  const subnetsArray = Array.isArray(results.subnets) 
    ? results.subnets 
    : Array.isArray(results) 
      ? results 
      : results.subnets 
        ? Object.values(results.subnets) 
        : [];
        
  console.log("Subredes normalizadas:", subnetsArray);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Tabla de Subredes</TabsTrigger>
          <TabsTrigger value="dhcp" onClick={() => {
            // Auto-generar la configuración DHCP al cambiar a esta pestaña
            if (!dhcpConfig) {
              const config = generateDhcpConfig();
              setDhcpConfig(config);
              setShowPreview(true);
            }
          }}>Configuración DHCP</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Subred</TableHead>
                  <TableHead className="text-center">Hosts</TableHead>
                  <TableHead className="text-center">Dir. de Red</TableHead>
                  <TableHead className="text-center">Máscara</TableHead>
                  <TableHead className="text-center">Primera Utilizable</TableHead>
                  <TableHead className="text-center">Última Utilizable</TableHead>
                  <TableHead className="text-center">Broadcast</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subnetsArray.map((subnet: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-center font-mono">
                      {subnet.name || `Subred ${index + 1}`}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {subnet.numHosts || subnet.hosts || subnet.hostCount || "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {subnet.networkAddress || subnet.network || subnet.ip || "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {subnet.subnetMask || subnet.mask || subnet.netmask || "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {subnet.firstUsable || subnet.firstHost || subnet.firstAddress || "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {subnet.lastUsable || subnet.lastHost || subnet.lastAddress || "N/A"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {subnet.broadcastAddress || subnet.broadcast || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="dhcp" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Configuración del servidor DHCP</h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleShowPreview}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Ver configuración</span>
                </Button>
                <Button
                  onClick={handleApplyConfig}
                  disabled={!isConnected || isConfiguring}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isConfiguring ? "Aplicando..." : "Aplicar configuración"}</span>
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {configApplied && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  La configuración DHCP se ha aplicado correctamente al servidor.
                </AlertDescription>
              </Alert>
            )}

            {showPreview && (
              <div className="rounded-md border p-4 bg-black/5">
                <h4 className="font-medium mb-2">Vista previa de /etc/dhcp/dhcpd.conf:</h4>
                <Textarea 
                  value={dhcpConfig} 
                  readOnly 
                  className="font-mono text-sm h-[300px] bg-gray-900 text-gray-100" 
                  onChange={(e) => setDhcpConfig(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  <InfoIcon className="h-3 w-3 inline mr-1" />
                  Esta es una vista previa de la configuración DHCP basada en las subredes calculadas.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
