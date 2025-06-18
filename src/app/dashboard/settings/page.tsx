'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
// Switch component no disponible - usando Button como toggle
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Globe,
  Save,
  ArrowLeft
} from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    mobile: true
  });

  const toggleNotification = (key: 'email' | 'browser' | 'mobile') => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen layout-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="neural-dashboard main-layout min-h-screen">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="layout-between mb-8">
          <div>
            <h1 className="text-3xl font-bold focalizahr-gradient-text">Configuración</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu cuenta y preferencias del sistema
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="focus-ring"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="professional-card">
            <CardHeader>
              <div className="flex items-center">
                <User className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Configuración de Perfil</CardTitle>
                  <CardDescription className="text-white/70">
                    Actualiza tu información personal y de contacto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-white">Nombre Completo</Label>
                  <Input 
                    placeholder="Tu nombre completo"
                    className="mt-2 form-input"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-white">Email</Label>
                  <Input 
                    type="email"
                    placeholder="tu@email.com"
                    className="mt-2 form-input"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-white">Empresa</Label>
                <Input 
                  placeholder="Nombre de tu empresa"
                  className="mt-2 form-input"
                />
              </div>
              
              <div className="pt-4">
                <Button className="btn-gradient focus-ring">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Company Settings */}
          <Card className="professional-card">
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
          <Card className="professional-card">
            <CardHeader>
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Notificaciones</CardTitle>
                  <CardDescription className="text-white/70">
                    Configura cómo y cuándo recibir notificaciones
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Notificaciones por Email</Label>
                  <p className="text-sm text-white/60">
                    Recibe actualizaciones importantes por correo
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant={notifications.email ? "default" : "outline"}
                  onClick={() => toggleNotification('email')}
                  className="focus-ring"
                >
                  {notifications.email ? "Activado" : "Desactivado"}
                </Button>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Notificaciones del Navegador</Label>
                  <p className="text-sm text-white/60">
                    Alertas emergentes en tiempo real
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant={notifications.browser ? "default" : "outline"}
                  onClick={() => toggleNotification('browser')}
                  className="focus-ring"
                >
                  {notifications.browser ? "Activado" : "Desactivado"}
                </Button>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Notificaciones Móviles</Label>
                  <p className="text-sm text-white/60">
                    Push notifications en dispositivos móviles
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant={notifications.mobile ? "default" : "outline"}
                  onClick={() => toggleNotification('mobile')}
                  className="focus-ring"
                >
                  {notifications.mobile ? "Activado" : "Desactivado"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="professional-card">
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Seguridad</CardTitle>
                  <CardDescription className="text-white/70">
                    Gestiona tu contraseña y configuraciones de seguridad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Cambiar Contraseña</Label>
                  <p className="text-sm text-white/60">
                    Actualiza tu contraseña de acceso
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Cambiar</Button>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Autenticación de Dos Factores</Label>
                  <p className="text-sm text-white/60">
                    Añade una capa extra de seguridad
                  </p>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">Próximamente</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="professional-card">
            <CardHeader>
              <div className="flex items-center">
                <Database className="h-5 w-5 text-primary mr-3" />
                <div>
                  <CardTitle className="text-white">Gestión de Datos</CardTitle>
                  <CardDescription className="text-white/70">
                    Controla tus datos y configuraciones de privacidad
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white">Exportar Datos</Label>
                  <p className="text-sm text-white/60">
                    Descarga todos tus datos en formato CSV/JSON
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Exportar</Button>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-white text-destructive">Eliminar Cuenta</Label>
                  <p className="text-sm text-white/60">
                    Elimina permanentemente tu cuenta y todos los datos
                  </p>
                </div>
                <Button variant="destructive" size="sm">Eliminar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}