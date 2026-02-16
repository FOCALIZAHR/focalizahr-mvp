// src/middleware.ts
// ✅ SOLUCIÓN ARQUITECTÓNICA OPTIMIZADA (Patrón Gemini + FocalizaHR)
// Separa rutas públicas estáticas vs. dinámicas con autenticación alternativa
// 
// 🔧 FIX 17-Dic-2025: Compatibilidad Vercel Edge Runtime
//    - Buffer.from() → atob() (Edge-compatible)
//    - encodeURIComponent() en headers con caracteres no-ASCII

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Verifica JWT simple (sin verificar firma, solo estructura y expiración)
 * Usado SOLO en middleware para validación rápida
 * 
 * 🔧 FIX: Usar atob() en lugar de Buffer.from() para compatibilidad Edge Runtime
 */
function verifyJWTSimple(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // ✅ FIX: atob() es Edge-compatible, Buffer.from() no lo es
    // También manejamos base64url (reemplazar - por + y _ por /)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    
    // Verificar expiración
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Determina el rol efectivo del usuario
 * Soporta tanto Account legacy como nuevo sistema User
 */
function getEffectiveRole(payload: any): string {
  // Si es un User nuevo (tiene userId)
  if (payload.userId && payload.userRole) {
    return payload.userRole;
  }
  
  // Si es Account legacy
  if (payload.role) {
    return payload.role;
  }
  
  return 'CLIENT'; // Default
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ============================================================================
  // 🎯 CAPA 1: RUTAS PÚBLICAS DINÁMICAS (Autenticación por uniqueToken)
  // ============================================================================
  // Estas rutas NO requieren JWT de sesión, pero SÍ validan uniqueToken en la API
  // Son "públicas" para el middleware, pero "protegidas" en la capa de aplicación
  
  const dynamicPublicPatterns = [
    '/encuesta/',                 // Frontend: Encuestas normales (Pulso, Experiencia, Retención, Karin)
    '/api/survey/',               // API: GET/POST encuestas normales
    '/onboarding/encuesta/',      // Frontend: Onboarding Journey Intelligence
    '/api/onboarding/survey/'     // API: GET/POST onboarding stages (4C Bauer)
  ];

  // Verificar si pathname coincide con patrón dinámico
  if (dynamicPublicPatterns.some(pattern => pathname.startsWith(pattern))) {
    console.log(`[Middleware] ✅ Dynamic public pattern (uniqueToken auth): ${pathname}`);
    return NextResponse.next();
  }
  
  // ============================================================================
  // 🔓 CAPA 2: RUTAS PÚBLICAS ESTÁTICAS (Sin autenticación)
  // ============================================================================
  // Estas rutas NO requieren autenticación de ningún tipo
  
  const publicPaths = [
    // Auth routes
    '/login',
    '/api/auth/login',
    '/api/auth/user/login',
    
    // Cron jobs (autenticación por Vercel Cron Secret)
    '/api/cron',
    
    // Static assets
    '/',
    '/favicon.ico'
  ];

  const isPublicPath = publicPaths.some(path => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  });

  if (isPublicPath) {
    console.log(`[Middleware] ✅ Static public path: ${pathname}`);
    return NextResponse.next();
  }
  
  // ============================================================================
  // 🔐 CAPA 3: RUTAS PROTEGIDAS (Requieren JWT de sesión)
  // ============================================================================
  
  // Rutas que requieren rol FOCALIZAHR_ADMIN
  const isAdminRoute = 
    pathname.startsWith('/dashboard/admin') || 
    pathname === '/register';
  
  // Rutas que requieren autenticación (cualquier rol)
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/api');
  
  // Si no es ruta protegida ni admin, permitir acceso
  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }
  
  // ============================================================================
  // 🎫 VERIFICAR TOKEN JWT DE SESIÓN
  // ============================================================================
  
  // Obtener token de cookies o header
  let token = request.cookies.get('focalizahr_token')?.value;
  
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  // Si no hay token
  if (!token) {
    console.log(`[Middleware] ❌ No token found for protected route: ${pathname}`);
    
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'No autorizado - Token requerido' },
        { status: 401 }
      );
    }
    
    // Si es página web, redirigir a login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Verificar token
  const payload = verifyJWTSimple(token);
  
  if (!payload) {
    console.log(`[Middleware] ❌ Invalid token for: ${pathname}`);
    
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }
    
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // ============================================================================
  // 🔧 SERVICE TOKENS (Para servicios internos como OnboardingEnrollmentService)
  // ============================================================================
  if (payload.type === 'service') {
    console.log(`[Middleware] 🔧 Service token - scope: ${payload.scope}`);
    const headers = new Headers(request.headers);
    headers.set('x-account-id', payload.accountId);
    headers.set('x-is-service-token', 'true');
    return NextResponse.next({ headers });
  }
  
  // ============================================================================
  // 👤 INYECTAR CONTEXTO DE USUARIO EN HEADERS
  // ============================================================================
  const headers = new Headers(request.headers);
  
  // Si es un User nuevo (tiene userId)
  if (payload.userId) {
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-role', payload.userRole || '');
    headers.set('x-department-id', payload.departmentId || '');
    headers.set('x-user-email', payload.userEmail || '');
    // ✅ FIX: encodeURIComponent para caracteres no-ASCII (ñ, tildes, etc.)
    headers.set('x-user-name', encodeURIComponent(payload.userName || ''));
  }
  
  // Siempre inyectar accountId (para multi-tenant isolation)
  headers.set('x-account-id', payload.accountId || payload.id || '');
  // ✅ FIX: encodeURIComponent para caracteres no-ASCII (ej: "Corporación" → "Corporaci%C3%B3n")
  headers.set('x-company-name', encodeURIComponent(payload.companyName || ''));
  
  // Obtener rol efectivo
  const effectiveRole = getEffectiveRole(payload);
  headers.set('x-effective-role', effectiveRole);
  
  console.log(`[Middleware] ✅ Auth OK - Role: ${effectiveRole}`);

  // ============================================================================
// 🔒 RESTRICCIONES POR ROL: EVALUATOR
// ============================================================================
if (effectiveRole === 'EVALUATOR') {
  const evaluatorAllowedPaths = [
    '/dashboard/evaluaciones',    // Portal del Jefe
    '/dashboard/performance',     // Nine-box, calibración, cycles
    '/encuesta',                  
    '/api/evaluator',             
    '/api/auth',                  
    '/api/survey',                
    '/api/admin/performance',
    '/api/calibration',
    '/api/pdi',
  ];
  
  const isAllowedPath = evaluatorAllowedPaths.some(path => 
    pathname.startsWith(path)
  );
  
  // /dashboard → Redirect a evaluaciones
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return NextResponse.redirect(new URL('/dashboard/evaluaciones', request.url));
  }
  
  // Dashboard NO permitido → Redirect
  if (pathname.startsWith('/dashboard') && !isAllowedPath) {
    return NextResponse.redirect(new URL('/dashboard/evaluaciones', request.url));
  }
  
  // API NO permitida → 403
  if (pathname.startsWith('/api') && !isAllowedPath) {
    return NextResponse.json(
      { error: 'Acceso restringido', success: false },
      { status: 403 }
    );
  }
}
  
  // ============================================================================
  // 🛡️ VERIFICACIÓN DE PERMISOS PARA RUTAS ADMIN
  // ============================================================================
  if (isAdminRoute) {
    const adminRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'];
    
    if (!adminRoles.includes(effectiveRole)) {
      console.log(`[Middleware] ❌ Access denied for role: ${effectiveRole}`);
      
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          {
            error: 'Acceso Denegado',
            message: 'No tienes permisos para acceder a esta sección.'
          },
          { status: 403 }
        );
      }
      
      // Redirigir a dashboard con mensaje
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(url);
    }
  }
  
  // ============================================================================
  // ✅ PERMITIR ACCESO CON HEADERS INYECTADOS
  // ============================================================================
  return NextResponse.next({ headers });
}

// ============================================================================
// 📍 CONFIGURACIÓN DE MATCHER
// ============================================================================
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};