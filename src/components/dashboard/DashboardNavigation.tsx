'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { useSidebar } from '@/hooks/useSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  Users,
  Settings,
  LogOut,
  Plus,
  Bell,
  Home,
  Activity,
  TrendingUp,
  User,
  ChevronDown,
  Menu,
  X,
  Zap,
  Shield,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  active?: boolean;
}

interface DashboardNavigationProps {
  currentCampaignId?: string;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function DashboardNavigation({ 
  currentCampaignId, 
  showMobileMenu = false, 
  onMobileMenuToggle 
}: DashboardNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState(3);
  
  // Usar hook global
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard'
    },
    {
      id: 'campaigns',
      label: 'Campañas',
      href: '/dashboard/campaigns',
      icon: BarChart3,
      active: pathname.startsWith('/dashboard/campaigns'),
      badge: 2
    },
    {
      id: 'email-automation',
      label: 'Email Automation',
      href: '/admin/email-automation',
      icon: Mail,
      active: pathname.startsWith('/admin/email-automation')
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
      active: pathname.startsWith('/dashboard/analytics')
    },
    {
      id: 'participants',
      label: 'Participantes',
      href: '/dashboard/admin/participants',
      icon: Users,
      active: pathname.startsWith('/dashboard/admin/participants')
    },
    {
      id: 'settings',
      label: 'Configuración',
      href: '/dashboard/settings',
      icon: Settings,
      active: pathname.startsWith('/dashboard/settings')
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  return (
    <>
      {/* Desktop Navigation - Premium Collapsible */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <div 
          className="flex flex-col flex-grow relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, rgba(34, 211, 238, 0.05) 50%, #1e293b 75%, rgba(167, 139, 250, 0.05) 100%)',
            borderRight: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Overlay pattern IA sutil */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background: `
                radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(167, 139, 250, 0.03) 0%, transparent 50%)
              `
            }}
          />

          {/* Header Premium */}
          <div className="relative z-10 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mr-3">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      FocalizaHR
                    </h3>
                    <p className="text-xs text-white/60">Centro Inteligencia</p>
                  </div>
                </div>
              )}
              
              {/* Toggle Button Premium */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Navigation Items Premium */}
          <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative group">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full transition-all duration-200 ease-in-out relative overflow-hidden
                      ${isCollapsed ? 'justify-center px-3' : 'justify-start px-4'}
                      ${item.active 
                        ? 'text-white bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-l-4 border-l-cyan-500' 
                        : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10'
                      }
                    `}
                    style={{
                      borderRadius: '12px',
                      padding: isCollapsed ? '12px' : '12px 16px',
                      height: 'auto',
                      backdropFilter: item.active ? 'blur(10px)' : 'none'
                    }}
                  >
                    <div className="flex items-center w-full">
                      <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} transition-transform duration-200 group-hover:scale-110`} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          {item.badge && (
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-semibold ml-2"
                              style={{
                                background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(34, 211, 238, 0.3)'
                              }}
                            >
                              {item.badge}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Button>
                  
                  {/* Tooltip Premium para modo colapsado */}
                  {isCollapsed && (
                    <div 
                      className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(34, 211, 238, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded text-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer Premium con Sistema Status */}
          {!isCollapsed && (
            <div className="relative z-10 p-6 border-t border-white/10">
              <div 
                className="p-4 rounded-xl relative overflow-hidden"
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(71, 85, 105, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: '#7D8590' }}>Sistema</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        background: '#10B981',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                      }}
                    />
                    <span className="text-xs text-green-400 font-medium">Activo</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-white/60">Funcionando correctamente</p>
                  <p className="text-xs text-white/50">
                    Última actualización: {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {notifications > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-3 w-3 text-cyan-400" />
                        <span className="text-xs text-white/70">Notificaciones</span>
                      </div>
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                          color: 'white'
                        }}
                      >
                        {notifications}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logout Button Premium */}
          <div className="relative z-10 px-4 pb-6">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
              style={{
                borderRadius: '12px',
                padding: isCollapsed ? '12px' : '12px 16px',
                height: 'auto'
              }}
            >
              <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Preservado intacto */}
      <div className="lg:hidden">
        {/* Mobile Header Premium */}
        <div 
          className="px-4 py-3 flex items-center justify-between relative"
          style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            
            <div className="ml-3 flex items-center">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mr-2">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                FocalizaHR
              </span>
            </div>
          </div>

          {/* Mobile Status Indicator */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }}
            />
            <span className="text-xs text-green-400 font-medium">Activo</span>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={onMobileMenuToggle} />
            <div 
              className="fixed left-0 top-0 h-full w-80 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, rgba(34, 211, 238, 0.05) 50%, #1e293b 75%, rgba(167, 139, 250, 0.05) 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              {/* Overlay pattern IA móvil */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background: `
                    radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.03) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(167, 139, 250, 0.03) 0%, transparent 50%)
                  `
                }}
              />

              {/* Mobile Header */}
              <div className="relative z-10 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mr-3">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        FocalizaHR
                      </h3>
                      <p className="text-xs text-white/60">Centro Inteligencia</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMobileMenuToggle}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Mobile User Info */}
              {user && (
                <div className="relative z-10 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(34, 211, 238, 0.2)',
                        border: '2px solid rgba(34, 211, 238, 0.3)'
                      }}
                    >
                      <User className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-white">{user.companyName || 'Empresa Demo'}</p>
                      <p className="text-sm text-white/60">{user.adminName || 'Admin Demo'}</p>
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs text-cyan-400 border-cyan-400/30"
                      >
                        FocalizaHR
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="relative z-10 px-4 py-4 space-y-2 flex-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        w-full justify-start relative overflow-hidden transition-all duration-200
                        ${item.active 
                          ? 'text-white bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-l-4 border-l-cyan-500' 
                          : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10'
                        }
                      `}
                      style={{
                        borderRadius: '12px',
                        padding: '12px 16px',
                        height: 'auto'
                      }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                      {item.badge && (
                        <div 
                          className="ml-auto px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                            color: 'white'
                          }}
                        >
                          {item.badge}
                        </div>
                      )}
                    </Button>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="relative z-10 p-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-white/70 hover:text-white hover:bg-red-500/20"
                  style={{
                    borderRadius: '12px',
                    padding: '12px 16px',
                    height: 'auto'
                  }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}