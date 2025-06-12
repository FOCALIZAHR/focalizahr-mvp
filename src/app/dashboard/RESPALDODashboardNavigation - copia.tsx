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
  Search,
  Home,
  Activity,
  FileText,
  Calendar,
  TrendingUp,
  Shield,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  active?: boolean;
  children?: NavigationItem[];
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
  const [notifications, setNotifications] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      children: [
        {
          id: 'campaigns-list',
          label: 'Todas las Campañas',
          href: '/dashboard/campaigns',
          icon: FileText
        },
        {
          id: 'campaigns-new',
          label: 'Nueva Campaña',
          href: '/dashboard/campaigns/new',
          icon: Plus
        },
        {
          id: 'campaigns-active',
          label: 'Activas',
          href: '/dashboard/campaigns?filter=active',
          icon: Activity,
          badge: 2
        }
      ]
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
      {/* Desktop Navigation */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold focalizahr-gradient-text">FocalizaHR</h1>
                <p className="text-xs text-muted-foreground">MVP Dashboard</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.adminName}</p>
                  <p className="text-xs text-muted-foreground">{user.companyName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              {showUserMenu && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigation('/dashboard/profile')}
                    className="w-full justify-start text-xs"
                  >
                    <User className="h-3 w-3 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigation('/dashboard/settings')}
                    className="w-full justify-start text-xs"
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Configuración
                  </Button>
                  <Separator className="my-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start text-xs text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-3 w-3 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Button
              onClick={() => handleNavigation('/dashboard/campaigns/new')}
              className="w-full btn-gradient focus-ring"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <Button
                  variant={item.active ? 'default' : 'ghost'}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full justify-start ${item.active ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
                
                {/* Submenu */}
                {item.children && item.active && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigation(child.href)}
                        className="w-full justify-start text-sm text-gray-500 hover:text-gray-700"
                      >
                        <child.icon className="h-3 w-3 mr-2" />
                        {child.label}
                        {child.badge && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {child.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Status Card */}
          <div className="px-4 py-4 border-t border-gray-200">
            <Card className="glass-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Sistema</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-muted-foreground">Activo y funcionando</p>
                <p className="text-xs text-muted-foreground">Última actualización: {new Date().toLocaleTimeString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="p-2"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="ml-3 flex items-center">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <h1 className="ml-2 text-lg font-semibold focalizahr-gradient-text">FocalizaHR</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onMobileMenuToggle} />
            <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
              
              {/* Mobile Menu Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h1 className="text-lg font-semibold focalizahr-gradient-text">FocalizaHR</h1>
                      <p className="text-xs text-muted-foreground">MVP Dashboard</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMobileMenuToggle}
                    className="p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Mobile User Info */}
              {user && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{user.adminName}</p>
                      <p className="text-sm text-muted-foreground">{user.companyName}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {user.subscriptionTier}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="px-4 py-4 space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.id}>
                    <Button
                      variant={item.active ? 'default' : 'ghost'}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full justify-start ${item.active ? 'bg-primary text-primary-foreground' : 'text-gray-600'}`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                    
                    {/* Mobile Submenu */}
                    {item.children && item.active && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <Button
                            key={child.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigation(child.href)}
                            className="w-full justify-start text-sm text-gray-500"
                          >
                            <child.icon className="h-4 w-4 mr-2" />
                            {child.label}
                            {child.badge && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {child.badge}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Mobile Quick Actions */}
              <div className="px-4 py-4 border-t border-gray-200">
                <Button
                  onClick={() => handleNavigation('/dashboard/campaigns/new')}
                  className="w-full btn-gradient focus-ring mb-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Campaña
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation('/dashboard/settings')}
                    className="focus-ring"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="focus-ring text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Salir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumb for Campaign Detail */}
      {currentCampaignId && (
        <div className="lg:ml-64 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/dashboard')}
              className="p-0 h-auto font-normal"
            >
              Dashboard
            </Button>
            <span className="mx-2">/</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/dashboard/campaigns')}
              className="p-0 h-auto font-normal"
            >
              Campañas
            </Button>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">Detalle</span>
          </div>
        </div>
      )}
    </>
  );
}