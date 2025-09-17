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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'new';
  description?: string;
}

// Hook para métricas
function useAdminMetrics() {
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    pendingMappings: 0,
    activeCampaigns: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('focalizahr_token');
        if (!token) return;

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
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  return metrics;
}

export default function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
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
      badge: metrics.pendingMappings > 0 ? metrics.pendingMappings : undefined,
      badgeVariant: 'warning'
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
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "w-full justify-center"
          )}>
            <img 
              src="/focalizahr-logo.svg" 
              alt="FHR"
              className="w-8 h-8 flex-shrink-0"
            />
            <span className={cn(
              "font-bold text-white transition-opacity duration-300",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              HR
            </span>
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

        {/* User Section - Solo si no está colapsado */}
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

        {/* Navigation con scrollbar */}
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
                    active ? "bg-slate-800/50 text-white" : "text-slate-400 hover:text-white",
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
                        "text-xs",
                        item.badgeVariant === 'success' && "bg-green-500/20 text-green-300 border-green-500/30",
                        item.badgeVariant === 'warning' && "bg-amber-500/20 text-amber-300 border-amber-500/30", 
                        item.badgeVariant === 'new' && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                        !item.badgeVariant && "bg-slate-700/50 text-slate-300 border-slate-600/50"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}

                  {/* Tooltip solo cuando está colapsado */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      {item.badge !== undefined && ` (${item.badge})`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Stats - Solo cuando no está colapsado */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-800/50">
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-card p-3 text-center">
                <div className="text-lg font-bold text-cyan-400">{metrics.activeAccounts}</div>
                <div className="text-xs text-slate-500">Activas</div>
              </div>
              <div className="metric-card p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{metrics.activeCampaigns}</div>
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
              "w-full hover:bg-slate-800/50 text-slate-400 hover:text-white",
              isCollapsed ? "justify-center p-3" : "justify-start"
            )}
          >
            <LogOut className={cn(
              "flex-shrink-0",
              !isCollapsed && "mr-3",
              "h-4 w-4"
            )} />
            <span className={cn(
              "transition-all duration-300",
              isCollapsed ? "w-0 opacity-0" : "opacity-100"
            )}>
              Salir
            </span>
          </Button>
        </div>

        {/* Botón de expandir cuando está colapsado */}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute top-4 right-2 hover:bg-slate-800/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        >
          <aside 
            className="fixed inset-y-0 left-0 w-72 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <img 
                  src="/focalizahr-logo.svg" 
                  alt="FocalizaHR"
                  className="w-8 h-8"
                />
                <h2 className="text-lg font-bold text-white">Admin Panel</h2>
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
                    {item.badge && (
                      <Badge className="text-xs">{item.badge}</Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Estilos CSS para scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </>
  );
}