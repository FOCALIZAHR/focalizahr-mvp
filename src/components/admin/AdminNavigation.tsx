// src/components/admin/AdminNavigation.tsx
'use client';

import { useState, useEffect } from 'react';
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

// Hook para métricas y estructuras pendientes
function useAdminMetrics() {
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    pendingMappings: 0,
    activeCampaigns: 0
  });
  
  const [pendingStructures, setPendingStructures] = useState<PendingStructure[]>([]);
  const [unmappedCount, setUnmappedCount] = useState<number>(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('focalizahr_token');
        if (!token) return;

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
      }
    };

    fetchMetrics();
    // Recargar cada 60 segundos
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, pendingStructures, unmappedCount };
}

export default function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { metrics, pendingStructures, unmappedCount } = useAdminMetrics();

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
      badge: metrics.totalAccounts,
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
      badgeVariant: 'danger',
      description: 'Mapeo de departamentos'
    },
    {
      id: 'campaigns',
      label: 'Campañas',
      href: '/dashboard/admin/campaigns',
      icon: Activity,
      badge: metrics.activeCampaigns,
      badgeVariant: 'success'
    },
    {
      id: 'templates',
      label: 'Templates',
      href: '/dashboard/admin/templates',
      icon: FileText
    },
    {
      id: 'benchmarks',
      label: 'Benchmarks',
      href: '/dashboard/admin/benchmarks',
      icon: TrendingUp,
      badge: 'NEW',
      badgeVariant: 'new'
    },
    {
      id: 'settings',
      label: 'Configuración',
      href: '/dashboard/admin/settings',
      icon: Settings
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  if (!isAdminUser) return null;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 professional-card"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col",
        "fixed inset-y-0 left-0 z-40",
        "bg-slate-900 border-r border-slate-800/50",
        "transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}>
        
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/50">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "w-full justify-center"
          )}>
            <img 
              src="/images/focalizahr-logo.svg" 
              alt="FocalizaHR"
              className="w-12 h-12 flex-shrink-0"
            />
            {!isCollapsed && (
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Admin Panel
                </div>
                <div className="text-xs text-gray-500">FocalizaHR Platform</div>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* User Section */}
        {!isCollapsed && user && (
          <div className="px-4 py-3 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">
                  {user.adminName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {user.adminName}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Super Admin
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center rounded-lg",
                    "transition-all duration-200",
                    "hover:bg-slate-800/50 group relative",
                    active ? "bg-gradient-to-r from-slate-800/70 to-slate-700/50 text-white shadow-md" : "text-slate-400 hover:text-white",
                    isCollapsed ? "justify-center p-3" : "justify-start px-3 py-2.5 gap-3"
                  )}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-4 w-4",
                    active && "text-cyan-400"
                  )} />
                  
                  <span className={cn(
                    "font-medium transition-all duration-300",
                    isCollapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100 flex-1 text-left text-sm"
                  )}>
                    {item.label}
                  </span>
                  
                  {!isCollapsed && item.badge !== undefined && (
                    <Badge 
                      className={cn(
                        "text-xs font-medium",
                        item.badgeVariant === 'success' && "bg-green-500/20 text-green-300 border-green-500/30",
                        item.badgeVariant === 'warning' && "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse",
                        item.badgeVariant === 'danger' && "bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse",
                        item.badgeVariant === 'new' && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                        !item.badgeVariant && "bg-slate-700/50 text-slate-300 border-slate-600/50"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}

                  {/* Tooltip para modo colapsado */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                      <span className="font-medium">{item.label}</span>
                      {item.badge !== undefined && (
                        <Badge className="ml-2 text-xs">{item.badge}</Badge>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer OPTIMIZADO */}
        {!isCollapsed && (
          <>
            {/* ALERTA DE ESTRUCTURAS PENDIENTES */}
            {pendingStructures.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-950/30 to-orange-950/30 border-t border-slate-800/50">
                <Card className="border-amber-500/60 bg-gradient-to-br from-amber-950/40 to-orange-950/30 animate-pulse hover:animate-none hover:border-amber-400/80 transition-all cursor-pointer"
                      onClick={() => router.push('/dashboard/admin/structures')}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-400 animate-pulse" />
                        <div>
                          <span className="text-xs font-bold text-amber-300">
                            {pendingStructures.length} Estructuras Pendientes
                          </span>
                          <span className="text-xs text-amber-200/70 block">
                            {metrics.pendingMappings} deptos. sin asignar
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Métricas minimalistas + Logout */}
            <div className="px-3 py-2 border-t border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span className="text-slate-400">{metrics.activeAccounts} activas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-slate-400">{metrics.activeCampaigns} campañas</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-white text-xs px-2 py-1"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Salir
              </Button>
            </div>
          </>
        )}

        {/* Botones cuando está colapsado */}
        {isCollapsed && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="absolute top-6 right-2 hover:bg-slate-800/50 shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="p-2 border-t border-slate-800/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-full hover:bg-slate-800/50"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          </>
        )}
      </aside>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        >
          <aside 
            className="fixed inset-y-0 left-0 w-72 bg-slate-900 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/focalizahr-logo.svg" 
                  alt="FocalizaHR"
                  className="w-10 h-10"
                />
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Admin Panel
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <nav className="px-3 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.href);
                      setIsMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "transition-all duration-200",
                      "hover:bg-slate-800/50",
                      active && "bg-slate-800/50 text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge className={cn(
                        "text-xs",
                        item.badgeVariant === 'danger' && "bg-orange-500/20 text-orange-300"
                      )}>
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Alerta móvil */}
            {pendingStructures.length > 0 && (
              <div className="px-3 pb-3 bg-gradient-to-r from-amber-950/30 to-orange-950/30">
                <Card className="border-amber-500/60 bg-gradient-to-br from-amber-950/40 to-orange-950/30">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                      <span className="text-sm font-bold text-amber-300">
                        {pendingStructures.length} Estructuras Pendientes
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        router.push('/dashboard/admin/structures');
                        setIsMobileOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white"
                    >
                      Gestionar →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Estilos CSS para scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #a855f7);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #22d3ee, #c084fc);
        }
      `}</style>
    </>
  );
}