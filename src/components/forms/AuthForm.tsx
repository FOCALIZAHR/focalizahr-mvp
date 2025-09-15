'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/common/Logo'
import { registerSchema, loginSchema } from '@/lib/validations'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSuccess?: () => void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    adminName: '',
    password: '',
    confirmPassword: '',
    email: ''
  })

  const isRegister = mode === 'register'

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (isRegister) {
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

      // Validar confirmación de contraseña
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }
    } else {
      const validation = loginSchema.safeParse({
        email: formData.email,
        password: formData.password
      })

      if (!validation.success) {
        validation.error.errors.forEach(error => {
          newErrors[error.path[0] as string] = error.message
        })
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister 
        ? {
            companyName: formData.companyName,
            adminEmail: formData.adminEmail,
            adminName: formData.adminName,
            password: formData.password
          }
        : {
            email: formData.email,
            password: formData.password
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin' // Importante: permite que el servidor establezca cookies
      })

      const data = await response.json()

      if (data.success) {
        // Guardar token en localStorage (para compatibilidad con código existente)
        // El token viene del body de la respuesta como siempre
        localStorage.setItem('focalizahr_token', data.token)
        localStorage.setItem('focalizahr_account', JSON.stringify(data.user || data.account))
        
        // NO creamos cookie aquí - el servidor ya la estableció como HttpOnly
        
        // Callback de éxito si fue proporcionado
        onSuccess?.()
        
        // Obtener URL de redirección del parámetro 'from' o usar dashboard por defecto
        const redirectTo = searchParams?.get('from') || '/dashboard'
        
        // Pequeño delay para asegurar que el navegador procese la cookie del servidor
        setTimeout(() => {
          router.push(redirectTo)
        }, 100)
        
      } else {
        setErrors({ general: data.error || 'Error en la autenticación' })
      }
    } catch (error) {
      console.error('Error en autenticación:', error)
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" theme="gradient" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </CardTitle>
            <CardDescription>
              {isRegister 
                ? 'Registra tu empresa para comenzar con Pulso de Bienestar'
                : 'Accede a tu cuenta de FocalizaHR'
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error general */}
            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Campos específicos del registro */}
            {isRegister && (
              <>
                <div>
                  <Label htmlFor="companyName">Nombre de la empresa</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Ej: Empresa Innovadora SpA"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={cn(errors.companyName && 'border-red-500')}
                    disabled={loading}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminName">Tu nombre completo</Label>
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
                  <Label htmlFor="adminEmail">Email corporativo</Label>
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
              </>
            )}

            {/* Campo email para login */}
            {!isRegister && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(errors.email && 'border-red-500')}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            )}

            {/* Contraseña */}
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder={isRegister ? 'Mínimo 8 caracteres, 1 mayúscula, 1 número' : 'Tu contraseña'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={cn(errors.password && 'border-red-500')}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirmar contraseña solo en registro */}
            {isRegister && (
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={cn(errors.confirmPassword && 'border-red-500')}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Botón submit */}
            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Procesando...' : (isRegister ? 'Crear cuenta' : 'Iniciar sesión')}
            </Button>

            {/* Link para cambiar modo */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => router.push(isRegister ? '/login' : '/register')}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                {isRegister ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthForm