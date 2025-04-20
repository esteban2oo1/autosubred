"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleSubnetCalculator } from "@/components/simple-subnet-calculator"
import { SshConnection } from "@/components/ssh-connection"
import { SubnetResults } from "@/components/subnet-results"
import { Server, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [calculationResults, setCalculationResults] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [serverInfo, setServerInfo] = useState<{ host: string; username: string }>({
    host: "",
    username: "",
  })

  const handleCalculation = (results: any) => {
    setCalculationResults(results)
  }

  const handleSshConnection = (connected: boolean, connectionInfo?: any) => {
    setIsConnected(connected)
    if (connectionInfo) {
      setServerInfo({
        host: connectionInfo.host,
        username: connectionInfo.username,
      })
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setServerInfo({
      host: "",
      username: "",
    })
    sessionStorage.removeItem("ssh_connection")
  }

  const handleConfigurationSuccess = () => {
    setIsConfigured(true)
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      {isConnected && (
        <header className="flex items-center h-14 px-4 border-b shrink-0 bg-green-50 justify-between">
          <div className="flex items-center">
            <Server className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium text-green-700">
              Conectado a {serverInfo.host} como {serverInfo.username}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-500">
            <LogOut className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        </header>
      )}

      <main className="flex min-h-[calc(100vh_-_theme(spacing.14))] bg-[#e8f4f4] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        {!isConnected ? (
          <div className="max-w-md w-full mx-auto">
            <h1 className="font-semibold text-3xl text-center mb-8">Calculadora de Subredes</h1>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Conexión al Servidor
                </CardTitle>
                <CardDescription>Conecta al servidor Ubuntu para configurar DHCP.</CardDescription>
              </CardHeader>
              <CardContent>
                <SshConnection onConnectionChange={handleSshConnection} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="max-w-6xl w-full mx-auto">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <SimpleSubnetCalculator onCalculate={handleCalculation} />
                </CardContent>
              </Card>

              {calculationResults && (
                <Card className="border-0 shadow-none bg-transparent mt-6">
                  <CardContent className="p-0">
                    <SubnetResults
                      results={calculationResults}
                      isConnected={isConnected}
                      onConfigureSuccess={handleConfigurationSuccess}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
