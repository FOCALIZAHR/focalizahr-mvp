// src/components/admin/AdminNavigation.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logout, isAdmin } from '@/lib/auth';
import { useSidebar } from '@/hooks/useSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

// NO MÁS IMPORTS DE CSS ESPECÍFICOS - Usar los existentes
import '@/styles/focalizahr-design-system.css';
import '@/styles/sidebar-premium.css';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info' | 'new';
  description?: string;
  active?: boolean;
}

interface AdminNavigationProps {
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

function useAdminMetrics() {
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    pendingMappings: 0,
    activeCampaigns: 0,
    newAlerts: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('focalizahr_token');
        
        if (!token) {
          console.error('No token found for metrics');
          return;
        }

        const response = await fetch('/api/admin/accounts?limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalAccounts: data.data?.pagination?.totalAccounts || 0,
            activeAccounts: data.data?.metrics?.activeAccounts || 0,
            pendingMappings: 0,
            activeCampaigns: 0,
            newAlerts: 0
          });
        }
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  return metrics;
}

export default function AdminNavigation({ 
  showMobileMenu = false, 
  onMobileMenuToggle 
}: AdminNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  const { isCollapsed, toggleSidebar } = useSidebar();
  const metrics = useAdminMetrics();

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
      description: 'Vista general del sistema',
      active: pathname === '/dashboard/admin'
    },
    {
      id: 'accounts',
      label: 'Cuentas',
      href: '/dashboard/admin/accounts',
      icon: Building2,
      badge: metrics.totalAccounts,
      badgeVariant: 'default',
      description: 'Gestión de empresas cliente',
      active: pathname.startsWith('/dashboard/admin/accounts')
    },
    {
      id: 'structures',
      label: 'Estructuras',
      href: '/dashboard/admin/structures',
      icon: FolderTree,
      badge: metrics.pendingMappings > 0 ? metrics.pendingMappings : undefined,
      badgeVariant: 'warning',
      description: 'Jerarquías organizacionales',
      active: pathname.startsWith('/dashboard/admin/structures')
    },
    {
      id: 'campaigns',
      label: 'Campañas',
      href: '/dashboard/admin/campaigns',
      icon: Activity,
      badge: metrics.activeCampaigns,
      badgeVariant: 'success',
      description: 'Supervisión global',
      active: pathname.startsWith('/dashboard/admin/campaigns')
    },
    {
      id: 'templates',
      label: 'Templates',
      href: '/dashboard/admin/templates',
      icon: FileText,
      description: 'Gestión de plantillas',
      active: pathname.startsWith('/dashboard/admin/templates')
    },
    {
      id: 'benchmarks',
      label: 'Benchmarks',
      href: '/dashboard/admin/benchmarks',
      icon: TrendingUp,
      badge: 'NEW',
      badgeVariant: 'new',
      description: 'Análisis comparativo',
      active: pathname.startsWith('/dashboard/admin/benchmarks')
    },
    {
      id: 'settings',
      label: 'Configuración',
      href: '/dashboard/admin/settings',
      icon: Settings,
      description: 'Ajustes del sistema',
      active: pathname.startsWith('/dashboard/admin/settings')
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleNavigation = (href: string) => {
    if (href) {
      router.push(href);
      if (onMobileMenuToggle) {
        onMobileMenuToggle();
      }
    }
  };

  if (!isAdminUser) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation - Usando clases existentes fhr-* y Tailwind */}
      <div className={cn(
        "hidden lg:block fixed inset-y-0 left-0 z-50",
        "fhr-bg-main sidebar-premium", // Clases existentes
        "border-r border-slate-800/50",
        "transition-all duration-300 ease-in-out",
        // IMPORTANTE: Anchos fijos para que el layout funcione correctamente
        isCollapsed ? "w-20" : "w-72"
      )}>
        <div className="flex flex-col h-full">
          {/* Header con clases existentes */}
          <div className="sidebar-header p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="sidebar-logo-container">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <span className="fhr-title-gradient text-lg font-bold">Admin Panel</span>
                    <span className="block text-xs text-slate-500">FocalizaHR</span>
                  </div>
                </div>
              )}
              {isCollapsed && (
                <div className="mx-auto">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="ml-auto hover:bg-slate-800/50"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>

          {/* User Info con clases existentes */}
          {!isCollapsed && user && (
            <div className="p-4 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.adminName?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user.adminName}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    Super Admin
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alertas con clases fhr-* */}
          {!isCollapsed && metrics.newAlerts > 0 && (
            <div className="px-4 py-3">
              <div className="fhr-card-metric p-3 bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-yellow-200">
                    {metrics.newAlerts} alertas nuevas requieren atención
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items con clases sidebar-* existentes */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "sidebar-nav-item w-full", // Clase existente
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "transition-all duration-200",
                    "hover:bg-slate-800/50 group relative",
                    isActive && "sidebar-nav-item-active bg-slate-800/30 border-l-2 border-cyan-500"
                  )}
                >
                  <Icon className={cn(
                    "flex-shrink-0 transition-transform",
                    isCollapsed ? "h-5 w-5" : "h-4 w-4",
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-white"
                  )} />
                  
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                          )}>
                            {item.label}
                          </span>
                          {item.badge !== undefined && (
                            <Badge 
                              variant={item.badgeVariant === 'success' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs px-1.5 py-0 h-5",
                                item.badgeVariant === 'success' && "bg-green-500/20 text-green-400 border-green-500/30",
                                item.badgeVariant === 'warning' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                                item.badgeVariant === 'new' && "bg-purple-500/20 text-purple-400 border-purple-500/30"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && isActive && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Tooltip para modo colapsado */}
                  {isCollapsed && (
                    <div className="sidebar-tooltip">
                      {item.label}
                      {item.badge !== undefined && (
                        <span className="ml-2 text-xs opacity-75">({item.badge})</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Stats con clases fhr-* */}
          {!isCollapsed && (
            <div className="p-4 border-t border-slate-800/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="fhr-card-simple p-3 text-center">
                  <div className="text-lg font-bold fhr-text-accent">{metrics.activeAccounts}</div>
                  <div className="text-xs text-slate-500">Activas</div>
                </div>
                <div className="fhr-card-simple p-3 text-center">
                  <div className="text-lg font-bold fhr-text-accent">{metrics.activeCampaigns}</div>
                  <div className="text-xs text-slate-500">Campañas</div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="p-3 border-t border-slate-800/50">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full fhr-btn-secondary",
                isCollapsed ? "justify-center px-0" : "justify-start"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-3">Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={onMobileMenuToggle}>
          <div 
            className="fixed inset-y-0 left-0 w-72 fhr-bg-main sidebar-premium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-cyan-500" />
                <span className="fhr-title-gradient text-lg font-bold">Admin Panel</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileMenuToggle}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Menu Content */}
            <nav className="px-3 py-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "sidebar-nav-item w-full",
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "transition-all duration-200",
                      "hover:bg-slate-800/50",
                      isActive && "sidebar-nav-item-active bg-slate-800/30"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-cyan-400" : "text-slate-400"
                    )} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          isActive ? "text-white" : "text-slate-300"
                        )}>
                          {item.label}
                        </span>
                        {item.badge !== undefined && (
                          <Badge 
                            variant="secondary"
                            className="text-xs px-1.5 py-0 h-5"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}