'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
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
  Shield
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
      id: 'analytics',
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
      active: pathname.startsWith('/dashboard/analytics')
    },
    {
      id: 'participants',
      label: 'Participantes',
      href: '/dashboard/participants',
      icon: Users,
      active: pathname.startsWith('/dashboard/participants')
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
      {/* Desktop Navigation - Glassmorphism Premium */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <div 
          className="flex flex-col flex-grow relative overflow-hidden"
          style={{
            background: '#161B22',
            borderRight: '1px solid #30363D',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)'
          }}
        >
          
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: 'linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%)',
              zIndex: 0
            }}
          />
          
          <div className="relative z-10 flex flex-col flex-grow">
            
            {/* Header Premium */}
            <div className="px-6 py-5 border-b" style={{ borderColor: '#30363D' }}>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                    boxShadow: '0 4px 12px rgba(34, 211, 238, 0.3)'
                  }}
                >
                  <BarChart3 className="h-6 w-6 text-white relative z-10" />
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 70%)'
                    }}
                  />
                </div>
                <div className="ml-3">
                  <h1 
                    className="text-xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    FocalizaHR
                  </h1>
                  <p className="text-xs text-white/60 font-medium">MVP Dashboard</p>
                </div>
              </div>
            </div>

            {/* User Info Premium */}
            {user && (
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #30363D' }}>
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center relative"
                    style={{
                      background: 'rgba(34, 211, 238, 0.2)',
                      border: '2px solid rgba(34, 211, 238, 0.3)',
                      boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)'
                    }}
                  >
                    <User className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#E6EDF3' }}>{user.companyName || 'Empresa Demo'}</p>
                    <p className="text-xs" style={{ color: '#7D8590' }}>{user.adminName || 'Admin Demo'}</p>
                    <p className="text-xs font-medium" style={{ color: '#22D3EE' }}>FocalizaHR</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                
                {showUserMenu && (
                  <div 
                    className="mt-3 pt-3 border-t border-white/10 space-y-1"
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNavigation('/dashboard/profile')}
                      className="w-full justify-start text-xs text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <User className="h-3 w-3 mr-2" />
                      Mi Perfil
                    </Button>
                    <Separator className="my-1 bg-white/10" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10"
                    >
                      <LogOut className="h-3 w-3 mr-2" />
                      Salir
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Premium */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #30363D' }}>
              <Button
                onClick={() => handleNavigation('/dashboard/campaigns/new')}
                className="btn-gradient w-full relative overflow-hidden group focus-ring"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2 relative z-10" />
                <span className="font-semibold relative z-10">Nueva Campaña</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </div>

            {/* Navigation Menu Premium */}
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full justify-start group relative overflow-hidden transition-all duration-300
                      ${item.active 
                        ? 'text-white bg-white/5 border-l-4 border-l-cyan-500 shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                      }
                    `}
                    style={{
                      borderRadius: '12px',
                      padding: '12px 16px',
                      height: 'auto'
                    }}
                  >
                    {item.active && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                        style={{
                          background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                          boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
                        }}
                      />
                    )}
                    
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300
                      ${item.active 
                        ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 shadow-md' 
                        : 'bg-white/5 group-hover:bg-white/10'
                      }
                    `}>
                      <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                        item.active ? 'text-cyan-300' : 'text-white/70 group-hover:text-white'
                      }`} />
                    </div>
                    
                    <span className="font-medium">{item.label}</span>
                    
                    {item.badge && (
                      <div 
                        className="ml-auto px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(34, 211, 238, 0.3)'
                        }}
                      >
                        {item.badge}
                      </div>
                    )}
                  </Button>
                );
              })}
            </nav>

            {/* Status Card Premium */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid #30363D' }}>
              <div 
                className="p-4 rounded-xl relative overflow-hidden"
                style={{
                  background: '#0D1117',
                  border: '1px solid #30363D'
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
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
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
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="ml-3 flex items-center">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #22D3EE, #A78BFA)'
                }}
              >
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <h1 
                className="ml-2 text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                FocalizaHR
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-white/80 hover:text-white"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)'
                  }}
                >
                  {notifications}
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay Premium */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div 
              className="fixed inset-0"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)'
              }}
              onClick={onMobileMenuToggle} 
            />
            <div 
              className="fixed top-0 left-0 bottom-0 w-80 shadow-xl overflow-y-auto"
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(71, 85, 105, 0.3)'
              }}
            >
              
              {/* Mobile Menu Header */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #22D3EE, #A78BFA)'
                      }}
                    >
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h1 
                        className="text-xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #22D3EE, #A78BFA)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        FocalizaHR
                      </h1>
                      <p className="text-xs text-white/60">MVP Dashboard</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMobileMenuToggle}
                    className="p-2 text-white/80 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Mobile User Info */}
              {user && (
                <div className="px-6 py-4 border-b border-white/10">
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
                      <p className="text-sm text-muted-foreground">{user.adminName || 'Admin Demo'}</p>
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
              <nav className="px-4 py-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        w-full justify-start relative overflow-hidden
                        ${item.active 
                          ? 'text-white bg-white/5 border-l-4 border-l-cyan-500' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
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

              {/* Mobile Quick Actions */}
              <div className="px-4 py-4 border-t border-white/10">
                <Button
                  onClick={() => handleNavigation('/dashboard/campaigns/new')}
                  className="btn-gradient w-full mb-3 focus-ring"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Encuesta
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-red-300 border-red-300/30 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumb for Campaign Detail */}
      {currentCampaignId && (
        <div 
          className="lg:ml-64 px-6 py-3"
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <div className="flex items-center text-sm text-white/70">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/dashboard')}
              className="p-0 h-auto font-normal text-white/70 hover:text-white"
            >
              Dashboard
            </Button>
            <span className="mx-2">/</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/dashboard/campaigns')}
              className="p-0 h-auto font-normal text-white/70 hover:text-white"
            >
              Campañas
            </Button>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">Detalle</span>
          </div>
        </div>
      )}
    </>
  );
}