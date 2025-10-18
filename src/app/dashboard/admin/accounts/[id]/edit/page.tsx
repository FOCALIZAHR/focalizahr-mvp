// /app/dashboard/admin/accounts/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  Mail, 
  Package, 
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface AccountData {
  id: string;
  companyName: string;
  adminName: string;
  adminEmail: string;
  subscriptionTier: string;
  industry?: string;
  companySize?: string;
 companyLogo?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    totalCampaigns: number;
    totalParticipants: number;
  };
}

// Mapeo de estados a badges con colores
const statusConfig = {
  ACTIVE: { label: 'Activo', variant: 'default' as const, className: 'bg-green-500' },
  TRIAL: { label: 'Prueba', variant: 'secondary' as const, className: 'bg-blue-500' },
  SUSPENDED: { label: 'Suspendido', variant: 'destructive' as const, className: 'bg-red-500' },
  INACTIVE: { label: 'Inactivo', variant: 'outline' as const, className: 'bg-gray-500' }
};

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<AccountData>({
    id: '',
    companyName: '',
    adminName: '',
    adminEmail: '',
    subscriptionTier: 'basic',
    industry: '',
    companySize: '',
    companyLogo: '',
    status: 'ACTIVE'
  });

  // Cargar datos de la cuenta
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = localStorage.getItem('focalizahr_token');
        
        if (!token) {
          setError('No autorizado');
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/admin/accounts/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Cuenta no encontrada');
          }
          throw new Error('Error al cargar la cuenta');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setFormData(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId, router]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar cambios
// 🟢 ESTA ES LA FUNCIÓN CORREGIDA
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setError('');
  setSuccess('');

  try {
    const token = localStorage.getItem('focalizahr_token');
    if (!token) {
      throw new Error('No autorizado');
    }

    // Hacemos una copia de los datos para poder modificarlos de forma segura
    const { id, stats, createdAt, updatedAt, ...updateData } = formData;

    // ✅ ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE!
    // Si companyLogo es un string vacío, lo convertimos a null antes de enviar.
    if (updateData.companyLogo === '') {
      updateData.companyLogo = undefined;
    }

    const response = await fetch(`/api/admin/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();
    if (!response.ok) {
      // Si la API devuelve detalles de validación, los mostramos
      const errorDetails = result.details ? JSON.stringify(result.details) : '';
      throw new Error(result.error || 'Error al actualizar' + ` ${errorDetails}`);
    }

    setSuccess('Cuenta actualizada exitosamente');
    setTimeout(() => {
      router.push('/dashboard/admin/accounts');
    }, 2000);

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al guardar');
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/admin/accounts">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cuentas
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar Cuenta</h1>
            <p className="text-muted-foreground mt-2">
              Modifica la información de {formData.companyName}
            </p>
          </div>
          {formData.status && (
            <Badge 
              variant={statusConfig[formData.status as keyof typeof statusConfig]?.variant || 'default'}
              className={statusConfig[formData.status as keyof typeof statusConfig]?.className}
            >
              {statusConfig[formData.status as keyof typeof statusConfig]?.label || formData.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {formData.stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-4">
              <FileText className="h-8 w-8 text-muted-foreground mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Campañas Totales</p>
                <p className="text-2xl font-bold">{formData.stats.totalCampaigns}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-4">
              <Users className="h-8 w-8 text-muted-foreground mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Participantes Totales</p>
                <p className="text-2xl font-bold">{formData.stats.totalParticipants}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Información de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>
                Datos principales de la empresa cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Empresa ABC SpA"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industria</Label>
                  <Select 
                    value={formData.industry || ''} 
                    onValueChange={(value) => handleSelectChange('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar industria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="tecnologia">Tecnología</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="manufactura">Manufactura</SelectItem>
                      <SelectItem value="finanzas">Finanzas</SelectItem>
                      <SelectItem value="salud">Salud</SelectItem>
                      <SelectItem value="educacion">Educación</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="companySize">Tamaño de la Empresa</Label>
                  <Select 
                    value={formData.companySize || ''} 
                    onValueChange={(value) => handleSelectChange('companySize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">1-10 empleados</SelectItem>
                      <SelectItem value="pequeña">11-50 empleados</SelectItem>
                      <SelectItem value="mediana">51-200 empleados</SelectItem>
                      <SelectItem value="grande">201-500 empleados</SelectItem>
                      <SelectItem value="enterprise">500+ empleados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logoUrl">URL del Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyLogo"
                    name="companyLogo"
                    type="url"
                    value={formData.companyLogo || ''}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  {formData.companyLogo && (
                    <div className="w-10 h-10 rounded border flex items-center justify-center bg-muted">
                      {formData.companyLogo.startsWith('http') ? (
                        <img 
                          src={formData.companyLogo} 
                          alt="Logo" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Image className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  URL completa de la imagen del logo de la empresa
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Administrador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Administrador
              </CardTitle>
              <CardDescription>
                Datos de contacto del administrador principal
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="adminName">Nombre del Administrador *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="adminEmail">Email del Administrador *</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      required
                      placeholder="admin@empresa.com"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan y Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Plan y Estado
              </CardTitle>
              <CardDescription>
                Configuración de suscripción y estado de la cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subscriptionTier">Plan de Suscripción *</Label>
                  <Select 
                    value={formData.subscriptionTier} 
                    onValueChange={(value) => handleSelectChange('subscriptionTier', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic - 1 campaña activa</SelectItem>
                      <SelectItem value="pro">Pro - 3 campañas activas</SelectItem>
                      <SelectItem value="enterprise">Enterprise - Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Estado de la Cuenta</Label>
                  <Select 
                    value={formData.status || 'ACTIVE'} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          Activo
                        </span>
                      </SelectItem>
                      <SelectItem value="TRIAL">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          Periodo de Prueba
                        </span>
                      </SelectItem>
                      <SelectItem value="SUSPENDED">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                          Suspendido
                        </span>
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                          Inactivo
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Cambiar a "Suspendido" deshabilitará el acceso del cliente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Auditoría */}
          {(formData.createdAt || formData.updatedAt) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Información de Auditoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {formData.createdAt && (
                    <div>
                      <span className="text-muted-foreground">Creado:</span>{' '}
                      <span>{new Date(formData.createdAt).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {formData.updatedAt && (
                    <div>
                      <span className="text-muted-foreground">Última actualización:</span>{' '}
                      <span>{new Date(formData.updatedAt).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-between">
            <div>
              {formData.status === 'SUSPENDED' && (
                <p className="text-sm text-red-600">
                  ⚠️ Esta cuenta está suspendida y el cliente no puede acceder
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard/admin/accounts">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}