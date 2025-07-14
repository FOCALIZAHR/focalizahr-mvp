'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Star,
  Loader2,
  Users,
  BarChart3,
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  Home
} from 'lucide-react';

export default function DesignSystemDemo() {
  const [rating, setRating] = useState(0);
  const [rangeRating, setRangeRating] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    department: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular validación
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'El nombre es requerido';
    if (!formData.email) newErrors.email = 'El email es requerido';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setTimeout(() => {
      setErrors(newErrors);
      setIsLoading(false);
      if (Object.keys(newErrors).length === 0) {
        alert('Formulario enviado correctamente!');
      }
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navegación Demo */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">FocalizaHR Design System</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Config
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Sistema de Diseño FocalizaHR
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Demostración completa de componentes UI de primer nivel para la plataforma de análisis organizacional
          </p>
        </div>

        {/* Contenedores de Contexto */}
        <Card>
          <CardHeader>
            <CardTitle>Contenedores de Contexto</CardTitle>
            <CardDescription>
              Componentes para mostrar información contextual con iconos y colores temáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-r">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">Información</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    Este es un mensaje informativo que proporciona contexto adicional al usuario.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-r">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Advertencia</h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                    Este es un mensaje de advertencia para alertar sobre posibles problemas.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4 rounded-r">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">Error</h3>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                    Este es un mensaje de error que indica que algo ha salido mal.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-4 rounded-r">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-200">Éxito</h3>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                    Este es un mensaje de éxito que confirma que la acción se completó correctamente.
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Componentes de Rating */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes de Rating</CardTitle>
            <CardDescription>
              Sistemas de calificación con estrellas interactivas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Rating con Radio Buttons */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rating con Estrellas Interactivas</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Rating seleccionado: {rating}/5
              </p>
            </div>

            {/* Rating con Range Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rating con Slider</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={rangeRating}
                  onChange={(e) => setRangeRating(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl ${star <= rangeRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Rating: {rangeRating}/5
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Cards de Métricas Simuladas */}
        <Card>
          <CardHeader>
            <CardTitle>Cards de Métricas - Dashboard Style</CardTitle>
            <CardDescription>
              Ejemplo de cards de métricas como aparecerían en el dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Total Campañas</h3>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-primary">24</div>
                  <p className="text-xs text-muted-foreground">
                    +3 desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Participación</h3>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">87.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% vs promedio
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Activas</h3>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">6</div>
                  <p className="text-xs text-muted-foreground">
                    En progreso ahora
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Completadas</h3>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">18</div>
                  <p className="text-xs text-muted-foreground">
                    Finalizadas exitosamente
                  </p>
                </CardContent>
              </Card>

            </div>
          </CardContent>
        </Card>

        {/* Formulario Completo de Demostración */}
        <Card>
          <CardHeader>
            <CardTitle>Formulario de Demostración</CardTitle>
            <CardDescription>
              Ejemplo completo con validación, estados de error y botón de loading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campos de texto */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium block mb-2">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </div>
                  {errors.name && (
                    <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="text-sm font-medium block mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Campos adicionales */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="text-sm font-medium block mb-2">
                    Empresa
                  </label>
                  <Input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="text-sm font-medium block mb-2">
                    Departamento
                  </label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecciona un departamento</option>
                    <option value="rrhh">Recursos Humanos</option>
                    <option value="marketing">Marketing</option>
                    <option value="ventas">Ventas</option>
                    <option value="desarrollo">Desarrollo</option>
                    <option value="operaciones">Operaciones</option>
                  </select>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label htmlFor="message" className="text-sm font-medium block mb-2">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Escribe tu mensaje aquí..."
                  rows={4}
                />
              </div>

              {/* Botones de demostración */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isLoading ? 'Procesando...' : 'Enviar Formulario'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLoading(!isLoading)}
                >
                  {isLoading ? 'Detener Loading' : 'Probar Loading'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      company: '',
                      message: '',
                      department: ''
                    });
                    setErrors({});
                    setRating(0);
                    setRangeRating(3);
                  }}
                >
                  Limpiar Formulario
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Badges y Estados */}
        <Card>
          <CardHeader>
            <CardTitle>Badges y Estados</CardTitle>
            <CardDescription>
              Diferentes tipos de badges para estados y categorías
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-green-500 hover:bg-green-600">Éxito</Badge>
              <Badge className="bg-yellow-500 hover:bg-yellow-600">Advertencia</Badge>
              <Badge className="bg-blue-500 hover:bg-blue-600">Info</Badge>
              <Badge className="bg-gradient-to-r from-primary to-secondary">Gradiente</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Footer de la demo */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Sistema de Diseño FocalizaHR
            </h3>
            <p className="text-muted-foreground mb-4">
              Componentes de UI de primer nivel listos para implementación
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline">
                Documentación
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                Implementar
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}