// /app/dashboard/admin/layout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/useSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  // Verificar que estamos en la sección admin
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  
  if (!isAdminRoute) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Navegación Lateral Admin - Fixed Position */}
      <AdminNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* Contenido Principal - Sin estructura extra, directo */}
      <main className={cn(
        "flex-1 min-h-screen",
        "transition-all duration-300",
        // Margin left para compensar el sidebar fixed
        isCollapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        {/* Barra Superior Solo para Móvil */}
        <div className="lg:hidden sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Panel Administrativo</h2>
            <div className="w-10" />
          </div>
        </div>
        
        {/* Contenido directo sin wrappers adicionales */}
        {children}
      </main>
    </div>
  );
}