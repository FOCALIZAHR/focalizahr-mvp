// src/middleware.ts - ACTUALIZACIÓN DESDE TU CÓDIGO ACTUAL
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TU FUNCIÓN ACTUAL - La mantenemos igual
function verifyJWTSimple(token: string): any {
  try {
    // Decodificar el JWT sin verificar firma (solo para middleware)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
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

// NUEVA FUNCIÓN: Helper para determinar el rol efectivo
function getEffectiveRole(payload: any): string {
  // Si es un User nuevo (tiene userId)
  if (payload.userId && payload.userRole) {
    return payload.userRole;
  }
  
  // Si es Account antiguo
  if (payload.role) {
    return payload.role; // Ya es FOCALIZAHR_ADMIN o CLIENT
  }
  
  return 'CLIENT'; // Default
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // NUEVO: Agregar /api/auth/user/login a rutas públicas
  const publicPaths = [
    '/login',
    '/api/auth/login',
    '/api/auth/user/login', // NUEVO
    '/api/cron',  // ← NUEVA LÍNEA
    '/',
    '/favicon.ico'
  ];

  // Si es ruta pública, permitir acceso
  // Si es ruta pública, permitir acceso
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  });

  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Rutas que requieren rol FOCALIZAHR_ADMIN
  const isAdminRoute = 
    pathname.startsWith('/dashboard/admin') || 
    pathname === '/register';
  
  // Rutas que requieren autenticación (cualquier rol)
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/api');
  
  // Si no es ruta protegida, permitir acceso
  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }
  
  // Obtener token de cookies o header
  let token = request.cookies.get('focalizahr_token')?.value;
  
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  // Si no hay token y es API, retornar 401
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    // Si es página web, redirigir a login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Verificar token con tu función actual
  const payload = verifyJWTSimple(token);
  
  if (!payload) {
    // Token inválido
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // ✅✅✅ CÓDIGO NUEVO: Reconocer service tokens ✅✅✅
  if (payload.type === 'service') {
    console.log(`🔧 [Middleware] Service token detected - scope: ${payload.scope}`);
    const headers = new Headers(request.headers);
    headers.set('x-account-id', payload.accountId);
    headers.set('x-is-service-token', 'true');
    return NextResponse.next({ headers });
  }
  // ✅✅✅ FIN CÓDIGO NUEVO ✅✅✅
  
  // NUEVO: Crear headers con contexto del usuario
  const headers = new Headers(request.headers);
  
  // NUEVO: Si es un User (tiene userId), inyectar sus datos
  if (payload.userId) {
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-role', payload.userRole || '');
    headers.set('x-department-id', payload.departmentId || '');
    headers.set('x-user-email', payload.userEmail || '');
    headers.set('x-user-name', payload.userName || '');
  }
  
  // Siempre inyectar accountId (para compatibilidad)
  headers.set('x-account-id', payload.accountId || payload.id || '');
  headers.set('x-company-name', payload.companyName || '');
  
  // Obtener rol efectivo
  const effectiveRole = getEffectiveRole(payload);
  headers.set('x-effective-role', effectiveRole);
  
  // VERIFICACIÓN DE PERMISOS PARA RUTAS ADMIN
  if (isAdminRoute) {
    const adminRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'];
    
    if (!adminRoles.includes(effectiveRole)) {
      // No es admin, mostrar error 403
      return new NextResponse(
        JSON.stringify({ 
          error: 'Acceso Denegado', 
          message: 'No tienes permisos para acceder a esta sección.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
  
  // NUEVO: EXCEPCIÓN para /api/admin/participants
  // Permitir a roles que pueden gestionar participantes
  if (pathname === '/api/admin/participants' && request.method === 'POST') {
    const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'];
    
    if (allowedRoles.includes(effectiveRole)) {
      console.log(`✅ Permitiendo acceso a ${effectiveRole} para cargar participantes`);
      return NextResponse.next({ headers });
    }
  }
  
  // Verificar permisos para otras rutas API admin
  if (pathname.startsWith('/api/admin') && !isAdminRoute) {
    const adminRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'];
    
    if (!adminRoles.includes(effectiveRole)) {
      return NextResponse.json(
        { error: 'Acceso denegado a API admin' },
        { status: 403 }
      );
    }
  }
  
  // Todo OK, permitir acceso con headers inyectados
  return NextResponse.next({ headers });
}

// Tu configuración actual - la mantenemos
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};