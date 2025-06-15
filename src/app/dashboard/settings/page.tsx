'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Building, 
  Mail, 
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  Save,
  Edit
} from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import '../dashboard.css'; // Estilos corporativos

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [router]);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="neural-dashboard">
      <DashboardNavigation />
      
      <div className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Configuración
            </h1>
            <p className="text-white/70">
              Administra tu perfil y preferencias de la plataforma.
            </p>
          </div>

          {/* Account Information */}
          <Card className="professional-card mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <CardTitle className="text-white">Información de Cuenta</CardTitle>
                    <CardDescription className="text-white/70">
                      Gestiona tu perfil y datos de contacto
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminName" className="text-white/80">Nombre Completo</Label>
                  <Input 
                    id="adminName"
                    value={user.adminName || ''}
                    disabled={!isEditing}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail" className="text-white/80">Email</Label>
                  <Input 
                    id="adminEmail"
                    type="email"
                    value={user.adminEmail || ''}
                    disabled={!isEditing}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyName" className="text-white/80">Empresa</Label>
                <Input 
                  id="companyName"
                  value={user.companyName || ''}
                  disabled={!isEditing}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Settings */}
          <Card className="professional-card mb-6">
            <CardHeader>
              <div className="flex items-center">
                <Building className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Configuración de Empresa</CardTitle>
                  <CardDescription className="text-white/70">
                    Personaliza las configuraciones para tu organización
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Branding Personalizado</Label>
                  <p className="text-sm text-white/60">
                    Usa los colores y logo de tu empresa en las encuestas
                  </p>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">Próximamente</Badge>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Dominios de Email</Label>
                  <p className="text-sm text-white/60">
                    Restricciones de dominio para participantes
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Configurar</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="professional-card mb-6">
            <CardHeader>
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Notificaciones</CardTitle>
                  <CardDescription className="text-white/70">
                    Controla cómo y cuándo recibir notificaciones
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Campañas Completadas</Label>
                  <p className="text-sm text-gray-500">
                    Notificar cuando una campaña termine
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Recordatorios de Participación</Label>
                  <p className="text-sm text-gray-500">
                    Alertas sobre baja participación
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Reportes Semanales</Label>
                  <p className="text-sm text-gray-500">
                    Resumen semanal de actividad
                  </p>
                </div>
                <input type="checkbox" className="rounded" />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="professional-card mb-6">
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Datos y Privacidad</CardTitle>
                  <CardDescription className="text-white/70">
                    Gestiona tus datos y configuraciones de privacidad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Exportar Datos</Label>
                  <p className="text-sm text-gray-500">
                    Descarga todos tus datos en formato CSV
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Eliminar Cuenta</Label>
                  <p className="text-sm text-gray-500">
                    Eliminar permanentemente tu cuenta y datos
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="professional-card border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-cyan-400">
                    ¿Necesitas ayuda?
                  </h3>
                  <p className="text-sm text-white/70 mt-1">
                    Contacta a nuestro equipo de soporte para resolver dudas.
                  </p>
                </div>
                <Button className="btn-gradient">
                  <Mail className="h-4 w-4 mr-2" />
                  Contactar Soporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}