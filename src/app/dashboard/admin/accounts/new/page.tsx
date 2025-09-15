// src/app/dashboard/admin/accounts/new/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Building2, UserPlus, Package, AlertCircle } from 'lucide-react'
import '@/styles/structure-wizard-premium.css'
import { registerSchema } from '@/lib/validations'
import { cn } from '@/lib/utils'

export default function NewAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    adminName: '',
    password: '',
    subscriptionTier: 'basic',
    industry: '',
    companySize: '',
    companyLogo: ''  // ← AGREGAR ESTA LÍNEA
  })

  // NO verificación de rol aquí - el middleware ya lo hizo

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const validation = registerSchema.safeParse({
      companyName: formData.companyName,
      adminEmail: formData.adminEmail,
      adminName: formData.adminName,
      password: formData.password
    })

    if (!validation.success) {
      validation.error.errors.forEach(error => {
        newErrors[error.path[0] as string] = error.message
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const token = localStorage.getItem('focalizahr_token')
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          adminEmail: formData.adminEmail,
          adminName: formData.adminName,
          password: formData.password,
          subscriptionTier: formData.subscriptionTier,
          industry: formData.industry || undefined,
          companySize: formData.companySize || undefined,
          companyLogo: formData.companyLogo || undefined  // AGREGADO: Incluir logo en el payload
        })
      })

      const data = await response.json()

      if (data.success) {
        // Mostrar mensaje de éxito temporal
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        successMessage.textContent = '✓ Cuenta creada exitosamente'
        document.body.appendChild(successMessage)
        
        setTimeout(() => {
          successMessage.remove()
          router.push('/dashboard/admin/accounts')
        }, 2000)
      } else {
        if (data.error === 'Email ya está registrado') {
          setErrors({ adminEmail: 'Este email ya está registrado en el sistema' })
        } else {
          setErrors({ general: data.error || 'Error al crear la cuenta' })
        }
      }
    } catch (error) {
      console.error('Error creando cuenta:', error)
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/admin/accounts')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a cuentas
          </Button>
          
          <h1 className="text-3xl font-bold">Crear Nueva Cuenta Cliente</h1>
          <p className="text-muted-foreground mt-2">
            Registra una nueva empresa en la plataforma FocalizaHR
          </p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Información de la Cuenta
            </CardTitle>
            <CardDescription>
              Completa los datos de la empresa y el administrador principal
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error general */}
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.general}
                </div>
              )}

              {/* Sección Empresa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Datos de la Empresa</h3>
                </div>

                <div>
                  <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Ej: Innovación Tecnológica SpA"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={cn(errors.companyName && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industria</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => handleInputChange('industry', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Seleccionar industria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tecnologia">Tecnología</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="servicios">Servicios</SelectItem>
                        <SelectItem value="manufactura">Manufactura</SelectItem>
                        <SelectItem value="salud">Salud</SelectItem>
                        <SelectItem value="educacion">Educación</SelectItem>
                        <SelectItem value="finanzas">Finanzas</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="companySize">Tamaño</Label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) => handleInputChange('companySize', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="companySize">
                        <SelectValue placeholder="Tamaño empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="micro">Micro (1-10)</SelectItem>
                        <SelectItem value="pequeña">Pequeña (11-50)</SelectItem>
                        <SelectItem value="mediana">Mediana (51-200)</SelectItem>
                        <SelectItem value="grande">Grande (201+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              {/* Campo para Logo URL */}
            <div>
              <Label htmlFor="companyLogo">URL del Logo (opcional)</Label>
              <Input
                id="companyLogo"
                type="url"
                placeholder="https://ejemplo.com/logo.png"
                value={formData.companyLogo}
                onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Proporciona una URL pública de la imagen del logo
              </p>
            </div>
          </div>

              {/* Sección Administrador */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Datos del Administrador</h3>
                </div>

                <div>
                  <Label htmlFor="adminName">Nombre Completo *</Label>
                  <Input
                    id="adminName"
                    type="text"
                    placeholder="Ej: María González"
                    value={formData.adminName}
                    onChange={(e) => handleInputChange('adminName', e.target.value)}
                    className={cn(errors.adminName && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.adminName && (
                    <p className="text-sm text-red-600 mt-1">{errors.adminName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminEmail">Email Corporativo *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="maria@empresa.com"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                    className={cn(errors.adminEmail && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.adminEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.adminEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Contraseña Temporal *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={cn(errors.password && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    El cliente deberá cambiar esta contraseña en su primer acceso
                  </p>
                </div>
              </div>

              {/* Sección Suscripción */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Plan de Suscripción</h3>
                </div>

                <div>
                  <Label htmlFor="subscriptionTier">Tipo de Plan *</Label>
                  <Select
                    value={formData.subscriptionTier}
                    onValueChange={(value) => handleInputChange('subscriptionTier', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="subscriptionTier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">
                        <div>
                          <div className="font-medium">Free</div>
                          <div className="text-sm text-muted-foreground">1 campaña, hasta 100 participantes</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="basic">
                        <div>
                          <div className="font-medium">Basic</div>
                          <div className="text-sm text-muted-foreground">3 campañas, hasta 500 participantes</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="professional">
                        <div>
                          <div className="font-medium">Professional</div>
                          <div className="text-sm text-muted-foreground">10 campañas, hasta 1000 participantes</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="enterprise">
                        <div>
                          <div className="font-medium">Enterprise</div>
                          <div className="text-sm text-muted-foreground">Ilimitado, soporte prioritario</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/admin/accounts')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}