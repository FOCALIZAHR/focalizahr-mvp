// ============================================================================
// FOCALIZAHR DASHBOARD NAVIGATION - v2.2 OPTIMIZED
// Cambios quirúrgicos: Logo reducido + Botón móvil visible + Navegación actualizada
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { useSidebar } from '@/hooks/useSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  Home,
  Activity,
  TrendingUp,
  User,
  ChevronDown,
  Menu,
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
  Heart,
  Rocket,
  DoorOpen,
  MessageSquare,
  FileSpreadsheet,
  Plus,
  Building2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ComponentType<any>;
  badge?: number;
  active?: boolean;
  comingSoon?: boolean;
  isDropdown?: boolean;
  subItems?: {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<any>;
    comingSoon?: boolean;
  }[];
}

interface DashboardNavigationProps {
  currentCampaignId?: string;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardNavigation({ 
  currentCampaignId, 
  showMobileMenu = false, 
  onMobileMenuToggle 
}: DashboardNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifications] = useState(3);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['signos-vitales']);
  
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // RBAC: Roles que pueden ver sección "Operaciones"
  // Según AuthorizationService.ts - Roles con acceso administrativo
  // ══════════════════════════════════════════════════════════════
  const operationsAllowedRoles = [
    // Sistema nuevo (tabla users)
    'FOCALIZAHR_ADMIN',  // Admin sistema FocalizaHR
    'ACCOUNT_OWNER',     // Dueño de la cuenta/empresa
    'HR_MANAGER',        // RRHH (rol correcto según AuthorizationService)
    // Sistema antiguo (tabla accounts) - compatibilidad transitoria
    'CLIENT',            // Equivale a ACCOUNT_OWNER en sistema antiguo
    // CEO NO incluido - solo lectura ejecutiva
    // AREA_MANAGER NO incluido - solo ve su área
  ];
  
  const canSeeOperations = user?.role && operationsAllowedRoles.includes(user.role);

  // Navigation Config con Dropdowns
  const navigationItems: NavigationItem[] = [
    {
      id: 'signos-vitales',
      label: 'Signos Vitales',
      icon: Heart,
      isDropdown: true,
      subItems: [
        { id: 'salud', label: 'Salud Departamental', href: '/dashboard/salud-departamental', icon: Activity, comingSoon: true },
        { id: 'onboarding', label: 'Onboarding Intelligence', href: '/dashboard/onboarding/inicio', icon: Rocket }, // ✅ CAMBIO 7: href actualizado
        { id: 'exit', label: 'Exit Intelligence', href: '/dashboard/exit', icon: DoorOpen, comingSoon: true },
      ],
    },
    // ✅ CAMBIO 6: NUEVO ITEM "SEGUIMIENTO"
    {
      id: 'seguimiento',
      label: 'Seguimiento',
      href: '/dashboard/seguimiento',
      icon: Activity,
      active: pathname.startsWith('/dashboard/seguimiento'),
    },
    {
      id: 'estudios',
      label: 'Estudios',
      href: '/dashboard/campaigns',
      icon: BarChart3,
      active: pathname.startsWith('/dashboard/campaigns'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
      active: pathname.startsWith('/dashboard/analytics'),
      comingSoon: true,
    },
    // ══════════════════════════════════════════════════════════════
    // SECCIÓN OPERACIONES - Solo visible para HR y Admin
    // Incluye: Inscribir Colaboradores, Métricas, Nueva Campaña
    // ══════════════════════════════════════════════════════════════
    ...(canSeeOperations ? [{
      id: 'operaciones',
      label: 'Operaciones',
      icon: Settings,
      isDropdown: true,
      subItems: [
        { id: 'inscribir', label: 'Inscribir Colaboradores', href: '/dashboard/hub-inscripcion-permanentes', icon: Users },
        { id: 'metricas', label: 'Métricas Empresa', href: '/dashboard/department-metrics/upload', icon: FileSpreadsheet },
        { id: 'nueva-campana', label: 'Nueva Campaña', href: '/dashboard/campaigns/new', icon: Plus },
      ],
    }] : []),
    {
      id: 'comunicaciones',
      label: 'Comunicaciones',
      icon: Mail,
      isDropdown: true,
      subItems: [
        { id: 'email', label: 'Email Templates', href: '/admin/email-automation', icon: Mail },
        { id: 'whatsapp', label: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare, comingSoon: true },
      ],
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      href: '/dashboard/settings',
      icon: Building2,
      active: pathname.startsWith('/dashboard/settings'),
    },
  ];

  const toggleDropdown = (id: string) => {
    setOpenDropdowns(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

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

  const isHomeActive = pathname === '/dashboard';

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP NAVIGATION
          ════════════════════════════════════════════════════════════════════ */}
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
          {/* Overlay pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background: `
                radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(167, 139, 250, 0.03) 0%, transparent 50%)
              `
            }}
          />

          {/* ══════════════════════════════════════════════════════════════
              HEADER: Logo (Fila 1) + Home/Collapse (Fila 2)
              ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 px-4 pt-8 pb-5 border-b border-white/10">
            {/* Fila 1: Logo centrado con espacio de respiración premium */}
            <Link href="/dashboard" className="flex justify-center mb-7">
              {/* ✅ CAMBIO 1: Logo desktop reducido (h-9→h-7, h-7→h-5) */}
              <img 
                src="/images/focalizahr-logo_palabra.svg" 
                alt="FocalizaHR" 
                className={`transition-all duration-300 hover:opacity-80 ${isCollapsed ? 'h-5' : 'h-7'}`}
              />
            </Link>
            
            {/* Fila 2: Botones Home + Collapse */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
              {/* Botón Home - Purple hover */}
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`
                    transition-all duration-300 rounded-lg
                    ${isHomeActive 
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' 
                      : 'text-slate-400 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 border border-transparent'
                    }
                  `}
                >
                  <Home className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Inicio</span>}
                </Button>
              </Link>
              
              {/* Botón Collapse - Cyan hover */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-transparent transition-all duration-300 rounded-lg"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              NAVIGATION ITEMS - Estilo Linear Premium
              ══════════════════════════════════════════════════════════════ */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 relative z-10 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isDropdown = item.isDropdown && item.subItems;
              const isOpen = openDropdowns.includes(item.id);
              const hasActiveChild = item.subItems?.some(sub => pathname.startsWith(sub.href));
              const isActive = item.active || hasActiveChild;

              // Dropdown Item
              if (isDropdown) {
                return (
                  <div key={item.id} className="mb-1">
                    {/* Dropdown Trigger */}
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl 
                        transition-all duration-250 ease-out
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                        ${isOpen || hasActiveChild
                          ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/5 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>

                    {/* Dropdown Content - Estilo Linear Premium */}
                    {!isCollapsed && (
                      <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="relative ml-6 mt-1 space-y-0.5">
                          {/* Línea conectora vertical estilo Linear */}
                          <div className="absolute left-0 top-0 bottom-2 w-px bg-gradient-to-b from-slate-600/50 via-slate-700/30 to-transparent" />
                          
                          {item.subItems?.map((subItem, index) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = pathname.startsWith(subItem.href);
                            const isLast = index === (item.subItems?.length || 0) - 1;
                            
                            if (subItem.comingSoon) {
                              return (
                                <div
                                  key={subItem.id}
                                  className="relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-slate-500 cursor-not-allowed"
                                >
                                  {/* Línea horizontal conectora */}
                                  <div className={`absolute left-0 top-1/2 w-3 h-px ${isLast ? 'bg-slate-700/30' : 'bg-slate-700/40'}`} />
                                  <SubIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm flex-1">{subItem.label}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
                                    Pronto
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={subItem.id}
                                onClick={() => handleNavigation(subItem.href)}
                                className={`
                                  relative w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg
                                  transition-all duration-200 ease-out group/sub
                                  ${isSubActive
                                    ? 'bg-cyan-500/10 text-cyan-400'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                  }
                                `}
                              >
                                {/* Línea horizontal conectora */}
                                <div className={`absolute left-0 top-1/2 w-3 h-px transition-colors duration-200 ${
                                  isSubActive ? 'bg-cyan-500/50' : 'bg-slate-700/40 group-hover/sub:bg-slate-600/50'
                                }`} />
                                {/* Punto de conexión activo */}
                                {isSubActive && (
                                  <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                                )}
                                <SubIcon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isSubActive ? '' : 'group-hover/sub:scale-110'}`} />
                                <span className="text-sm font-medium">{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Simple Item
              if (item.comingSoon) {
                return (
                  <div
                    key={item.id}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 cursor-not-allowed
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <Icon className="h-5 w-5 opacity-50" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium opacity-50">{item.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
                          Pronto
                        </span>
                      </>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href!)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl 
                    transition-all duration-250 ease-out
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-gradient-to-r from-cyan-500/12 to-purple-500/8 text-white border-l-2 border-cyan-400 ml-0.5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'text-cyan-400' : ''}`} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* ══════════════════════════════════════════════════════════════
              FOOTER: User + Logout
              ══════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 p-4 border-t border-white/10">
            {/* User Info */}
            {user && !isCollapsed && (
              <div className="mb-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
                    <span className="text-sm font-semibold text-cyan-400">
                      {(user.adminName || user.companyName || 'U').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.adminName || 'Admin'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.companyName || 'Empresa'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            )}

            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`
                w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 rounded-xl
                ${isCollapsed ? 'justify-center px-3' : 'justify-start'}
              `}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE NAVIGATION (Preservado del original)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between relative"
          style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <div className="flex items-center">
            {/* ✅ CAMBIO 3: Botón hamburguesa con fondo visible */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="p-3 text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg"
            >
              {/* ✅ CAMBIO 4: Icono más grande (h-5→h-6) */}
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            
            {/* ✅ CAMBIO 2: Logo móvil header reducido (h-7→h-6) */}
            <img 
              src="/images/focalizahr-logo_palabra.svg" 
              alt="FocalizaHR" 
              className="h-6 ml-3"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#10B981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}
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
              {/* Mobile Header */}
              <div className="relative z-10 px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  {/* ✅ CAMBIO 5: Logo móvil overlay reducido (h-8→h-6) */}
                  <img 
                    src="/images/focalizahr-logo_palabra.svg" 
                    alt="FocalizaHR" 
                    className="h-6"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMobileMenuToggle}
                    className="text-white/70 hover:text-white"
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
                      style={{ background: 'rgba(34, 211, 238, 0.2)', border: '2px solid rgba(34, 211, 238, 0.3)' }}
                    >
                      <User className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-white">{user.companyName || 'Empresa Demo'}</p>
                      <p className="text-sm text-white/60">{user.adminName || 'Admin Demo'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="relative z-10 px-4 py-4 space-y-2 flex-1 overflow-y-auto">
                {/* Home Button */}
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('/dashboard')}
                  className={`
                    w-full justify-start rounded-xl transition-all duration-200
                    ${isHomeActive 
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Inicio
                </Button>

                {/* Nav Items */}
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  
                  if (item.isDropdown && item.subItems) {
                    const isOpen = openDropdowns.includes(item.id);
                    
                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => toggleDropdown(item.id)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center">
                            <Icon className="h-5 w-5 mr-3" />
                            {item.label}
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isOpen && (
                          <div className="pl-8 pt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              
                              if (subItem.comingSoon) {
                                return (
                                  <div key={subItem.id} className="flex items-center px-4 py-2 text-slate-500 opacity-60">
                                    <SubIcon className="h-4 w-4 mr-3" />
                                    {subItem.label}
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Pronto</span>
                                  </div>
                                );
                              }
                              
                              return (
                                <Button
                                  key={subItem.id}
                                  variant="ghost"
                                  onClick={() => handleNavigation(subItem.href)}
                                  className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
                                >
                                  <SubIcon className="h-4 w-4 mr-3" />
                                  {subItem.label}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (item.comingSoon) {
                    return (
                      <div key={item.id} className="flex items-center px-4 py-3 text-slate-500 opacity-60">
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Pronto</span>
                      </div>
                    );
                  }

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleNavigation(item.href!)}
                      className={`
                        w-full justify-start rounded-xl transition-all duration-200
                        ${item.active 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/15 text-white border-l-4 border-cyan-500' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="relative z-10 px-4 pb-6">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
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