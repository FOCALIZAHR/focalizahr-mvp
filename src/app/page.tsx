'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Users, Activity, TrendingUp, ArrowRight, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  if (!mounted) {
    return null; // Evita hydration issues
  }

  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center">
        <div className="container mx-auto max-w-4xl">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
              FocalizaHR
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Gestión de Personas Basada en Datos
            </p>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl md:text-4xl font-semibold text-foreground mb-6">
            Transformamos los datos de tu empresa en decisiones estratégicas
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Soluciones integrales en datos, gestión y cultura organizacional. 
            Desbloqueamos el potencial de tu equipo para impulsar resultados extraordinarios.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              Comenzar Ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/about')}
            >
              Conocer Más
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Tres Pilares de Transformación
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* FocalizaData */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-cyan-500" />
                </div>
                <CardTitle className="text-xl">FocalizaData</CardTitle>
                <CardDescription>
                  Inteligencia de Datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Decisiones informadas basadas en análisis avanzado con IA. 
                  Correlaciona datos de clima con KPIs de negocio.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Análisis predictivo de rotación</li>
                  <li>• Patrones ocultos identificados</li>
                  <li>• Recomendaciones basadas en evidencia</li>
                </ul>
              </CardContent>
            </Card>

            {/* FocalizaPyme */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-xl">FocalizaPyme</CardTitle>
                <CardDescription>
                  Gestión Experta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Tu departamento de RRHH completo externalizado. 
                  Procesos eficientes adaptados a tu empresa.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Equipo especializado completo</li>
                  <li>• Metodologías corporativas</li>
                  <li>• Costo accesible para PyMEs</li>
                </ul>
              </CardContent>
            </Card>

            {/* FocalizaCultura */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-xl">FocalizaCultura</CardTitle>
                <CardDescription>
                  Cultura Saludable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Construimos culturas organizacionales que previenen conflictos 
                  y aumentan productividad.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Cumplimiento Ley Karin</li>
                  <li>• Prevención y resolución</li>
                  <li>• Ambientes de alto rendimiento</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-12">
            Resultados que Hablan por Sí Solos
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-500 mb-2">85%</div>
              <p className="text-muted-foreground">Reducción en conflictos organizacionales</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 mb-2">42%</div>
              <p className="text-muted-foreground">Mejora en clima laboral</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">25%</div>
              <p className="text-muted-foreground">Reducción en rotación de personal</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="container mx-auto max-w-3xl text-center">
          <h3 className="text-3xl font-bold mb-6">
            ¿Listo para Transformar tu Gestión de Personas?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Únete a las empresas que ya están usando datos para tomar mejores decisiones sobre su talento.
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            Comenzar Evaluación Gratuita <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-muted-foreground">
            © 2024 FocalizaHR. Estrategia de Talento para Empresas en Chile.
          </p>
        </div>
      </footer>
    </div>
  );
}