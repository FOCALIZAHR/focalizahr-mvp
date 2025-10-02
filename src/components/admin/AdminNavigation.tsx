// src/components/admin/AdminNavigation.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logout, isAdmin } from '@/lib/auth';
import { useSidebar } from '@/hooks/useSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Building2,
  FolderTree,
  Activity,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  AlertCircle,
  AlertTriangle,
  GitBranch
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'new' | 'danger';
  description?: string;
}

interface PendingStructure {
  id: string;
  companyName: string;
  orphanDepartmentsCount: number;
  structureComplete: boolean;
  gerenciasCount?: number;
  departmentsCount?: number;
}

// Hook mejorado sin loops infinitos
function useAdminMetrics() {
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    pendingMappings: 0,
    activeCampaigns: 0
  });
  
  const [pendingStructures, setPendingStructures] = useState<PendingStructure[]>([]);
  const [unmappedCount, setUnmappedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usar useRef para trackear si ya estamos fetching
  const isFetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Evitar llamadas duplicadas
      if (isFetchingRef.current) return;
      
      // Evitar llamadas muy frecuentes (mínimo 5 segundos entre llamadas)
      const now = Date.now();
      if (now - lastFetchRef.current < 5000) return;
      
      isFetchingRef.current = true;
      lastFetchRef.current = now;
      
      try {
        const token = localStorage.getItem('focalizahr_token');
        if (!token) {
          isFetchingRef.current = false;
          return;
        }

        // Fetch accounts metrics
        const response = await fetch('/api/admin/accounts?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalAccounts: data.data?.pagination?.totalAccounts || 0,
            activeAccounts: data.data?.metrics?.activeAccounts || 0,
            pendingMappings: 0,
            activeCampaigns: 0
          });
        }

        // Fetch estructuras pendientes
        const structuresResponse = await fetch('/api/admin/structures/overview', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (structuresResponse.ok) {
          const result = await structuresResponse.json();
          
          if (result.success && result.data) {
            const pending = result.data.structures.filter(
              (s: any) => s.orphanDepartmentsCount > 0
            );
            setPendingStructures(pending);
            
            setMetrics(prev => ({
              ...prev,
              pendingMappings: result.data.metrics.totalOrphans || 0
            }));
          }
        }

        // Fetch unmapped count para Revisión de Mapeo
        const mappingResponse = await fetch('/api/admin/mapping-review', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (mappingResponse.ok) {
          const result = await mappingResponse.json();
          if (result.success && result.stats) {
            setUnmappedCount(result.stats.totalUnmapped);
          }
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    };

    // Fetch inicial
    fetchMetrics();
    
    // NO USAR setInterval - En su lugar, usar un refresh manual o eventos específicos
    // Si realmente necesitas auto-refresh, hazlo condicional:
    const shouldAutoRefresh = false; // Cambiar a true solo si es necesario
    
    if (shouldAutoRefresh) {
      const interval = setInterval(() => {
        // Solo ejecutar si no estamos ya fetching
        if (!isFetchingRef.current) {
          fetchMetrics();
        }
      }, 120000); // 2 minutos en lugar de 1 minuto
      
      return () => clearInterval(interval);
    }
  }, []); // Array vacío - solo ejecutar una vez

  return { metrics, pendingStructures, unmappedCount, isLoading };
}

export default function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { metrics, pendingStructures, unmappedCount, isLoading } = useAdminMetrics();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAdminUser(isAdmin(currentUser));
      
      if (!isAdmin(currentUser)) {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard/admin',
      icon: BarChart3,
      description: 'Vista general'
    },
    {
      id: 'accounts',
      label: 'Cuentas',
      href: '/dashboard/admin/accounts',
      icon: Building2,
      badge: metrics.totalAccounts > 0 ? metrics.totalAccounts : undefined,
      description: 'Gestión de empresas cliente'
    },
    {
      id: 'structures',
      label: 'Estructuras',
      href: '/dashboard/admin/structures',
      icon: FolderTree,
      badge: pendingStructures.length > 0 ? pendingStructures.length : undefined,
      badgeVariant: 'warning'
    },
    {
      id: 'mapping-review',
      label: 'Revisión de Mapeo',
      href: '/dashboard/admin/mapping-review',
      icon: GitBranch,
      badge: unmappedCount > 0 ? unmappedCount : undefined,
      badgeVariant: unmappedCount > 5 ? 'danger' : 'warning',
      description: 'Categorización de departamentos'
    },
    {
      id: 'participants',
      label: 'Carga Participantes',
      href: '/dashboard/admin/participants',
      icon: FileText,
      badge: metrics.pendingMappings > 0 ? 'Pendientes' : undefined,
      badgeVariant: 'warning',
      description: 'Servicio concierge'
    },
    {
      id: 'analytics-admin',
      label: 'Analytics Global',
      href: '/dashboard/admin/analytics',
      icon: TrendingUp,
      description: 'Métricas cross-cliente'
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAdminUser) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-white">Admin Panel</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex text-gray-400 hover:text-white"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start relative",
                    isActive 
                      ? "bg-slate-800 text-white" 
                      : "text-gray-400 hover:text-white hover:bg-slate-800",
                    isCollapsed && "px-2"
                  )}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileOpen(false);
                  }}
                >
                  <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant as any || "secondary"}
                          className="ml-2"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-500" />
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-4">
            {!isCollapsed && user && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
                <Badge className="mt-2 bg-cyan-500/20 text-cyan-400">
                  Admin FocalizaHR
                </Badge>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>Cerrar sesión</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}