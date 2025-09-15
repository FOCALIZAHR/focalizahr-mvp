// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Función simple para verificar JWT (sin dependencias externas)
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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Rutas que requieren rol FOCALIZAHR_ADMIN
  const isAdminRoute = 
    pathname.startsWith('/dashboard/admin') || 
    pathname === '/register';
  
  // Rutas que requieren autenticación (cualquier rol)
  const isProtectedRoute = pathname.startsWith('/dashboard');
  
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
  
  // Si no hay token, redirigir a login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Verificar token
  const payload = verifyJWTSimple(token);
  
  if (!payload) {
    // Token inválido, redirigir a login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Si es ruta admin, verificar rol
  if (isAdminRoute) {
    const userRole = payload.role || 'CLIENT';
    
    if (userRole !== 'FOCALIZAHR_ADMIN') {
      // No es admin, mostrar error 403
      return new NextResponse(
        JSON.stringify({ 
          error: 'Acceso Denegado', 
          message: 'No tienes permisos para acceder a esta sección. Solo administradores de FocalizaHR.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
  
  // Todo OK, permitir acceso
  return NextResponse.next();
}

// Configuración del middleware
//export const config = {
  matcher: [
    // Proteger todas las rutas del dashboard  (era la funcion antigua y queda comentada ya que funcionaba en caso de problemas)
    '/dashboard/:path*',
    // Proteger registro
    '/register',
  ]//
  export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

