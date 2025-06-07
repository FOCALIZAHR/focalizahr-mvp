'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X } from 'lucide-react'

interface Account {
  id: string
  companyName: string
  adminEmail: string
  adminName: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('focalizahr_token')
    const accountData = localStorage.getItem('focalizahr_account')

    if (!token || !accountData) {
      router.push('/login')
      return
    }

    try {
      const parsedAccount = JSON.parse(accountData)
      setAccount(parsedAccount)
    } catch (error) {
      console.error('Error parsing account data:', error)
      router.push('/login')
      return
    }

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('focalizahr_token')
    localStorage.removeItem('focalizahr_account')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      </div>
    )
  }

  if (!account) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y navegación móvil */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-muted"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Logo size="md" theme="gradient" className="ml-2 md:ml-0" />
            </div>

            {/* Información de la empresa y usuario */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {account.companyName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account.adminName}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut size={16} className="mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4">
            <div className="flex items-center justify-between mb-8">
              <Logo size="md" theme="gradient" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Navegación móvil */}
            <nav className="space-y-2">
              <a
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setSidebarOpen(false)}
              >
                Dashboard
              </a>
              <a
                href="/dashboard/campanas"
                className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                Campañas
              </a>
            </nav>

            {/* Info empresa en móvil */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium text-foreground">
                  {account.companyName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account.adminName}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}