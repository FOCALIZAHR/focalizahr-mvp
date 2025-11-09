// src/lib/auth.ts - VERSIÓN CORREGIDA CON DEBUG
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-focalizahr-2024'

export interface JWTPayload {
  id: string
  accountId?: string  // ← AGREGAR ESTA LÍNEA
  adminEmail: string
  adminName: string
  companyName: string
  subscriptionTier: string
  role?: string  // ← AGREGAR ESTA LÍNEA
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  try {
    console.log('🔐 Hashing password...')
    const hash = await bcrypt.hash(password, 12)
    console.log('✅ Password hashed successfully')
    return hash
  } catch (error) {
    console.error('❌ Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    console.log('🔐 Verifying password against hash...')
    console.log('Password length:', password.length)
    console.log('Hash length:', hash.length)
    console.log('Hash starts with:', hash.substring(0, 10))
    
    // Validate inputs
    if (!password || !hash) {
      console.log('❌ Missing password or hash')
      return false
    }
    
    if (hash.length < 20) {
      console.log('❌ Hash too short, invalid format')
      return false
    }
    
    const isValid = await bcrypt.compare(password, hash)
    console.log('🔐 Password verification result:', isValid)
    return isValid
    
  } catch (error) {
    console.error('❌ Password verification error:', error)
    
    // Additional debug info
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message
      })
    }
    
    return false
  }
}

export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    console.log('🎫 Generating JWT token...')
    console.log('JWT Secret length:', JWT_SECRET.length)
    console.log('Payload:', { ...payload, adminEmail: payload.adminEmail.substring(0, 5) + '***' })
    
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '7d',
      issuer: 'focalizahr-mvp'
    })
    
    console.log('✅ JWT token generated, length:', token.length)
    return token
    
  } catch (error) {
    console.error('❌ JWT generation error:', error)
    throw new Error('Failed to generate JWT token')
  }
}

// REEMPLAZAR la función verifyJWTToken en src/lib/auth.ts
// LÍNEAS APROXIMADAS 87-102

export function verifyJWTToken(token: string): { success: boolean; payload?: JWTPayload; error?: string } {
  try {
    console.log('🎫 Verifying JWT token...')
    
    // Verificación básica para cliente (browser)
    if (typeof window !== 'undefined') {
      // En el cliente, solo verificamos formato básico
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { success: false, error: 'Invalid token format' };
      }
      
      try {
        // Decodificar payload sin verificar firma (solo en cliente)
        const payloadBase64 = parts[1];
        const payloadString = atob(payloadBase64);
        const payload = JSON.parse(payloadString) as JWTPayload;
        
        // Verificar expiración
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return { success: false, error: 'Token expired' };
        }
        
        console.log('✅ JWT token verified successfully (client-side)')
        return { success: true, payload };
      } catch (decodeError) {
        return { success: false, error: 'Invalid token encoding' };
      }
    }
    
    // Verificación completa para servidor
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log('✅ JWT token verified successfully (server-side)')
    return { success: true, payload };
    
  } catch (error) {
    console.error('❌ JWT verification error:', error)
    
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expired' }
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Invalid token' }
    }
    return { success: false, error: 'Token verification failed' }
  }
}

export async function verifyJWT(request: NextRequest): Promise<{
  success: boolean
  user?: JWTPayload
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7) // Remove "Bearer "
    const verification = verifyJWTToken(token)
    
    if (!verification.success || !verification.payload) {
      return { success: false, error: verification.error }
    }

    // Verify user still exists and is active
    const account = await prisma.account.findUnique({
      where: { id: verification.payload.id },
      select: {
        id: true,
        adminEmail: true,
        adminName: true,
        companyName: true,
        subscriptionTier: true,
        role: true  // ← AGREGAR
      }
    })

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    return { 
      success: true, 
      user: {
        ...verification.payload,
        // Update with current account data
        adminEmail: account.adminEmail,
        adminName: account.adminName,
        companyName: account.companyName,
        subscriptionTier: account.subscriptionTier,
        role: account.role  // ← AGREGAR
      }
    }
  } catch (error) {
    console.error('JWT verification error:', error)
    return { success: false, error: 'Internal authentication error' }
  }
}

// Middleware helper for protected routes
export function withAuth(handler: (request: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await verifyJWT(request)
    
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, authResult.user)
  }
}

// Debug function for development
export async function debugAuth() {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'Debug only available in development' }
  }
  
  try {
    // Test password hashing and verification
    const testPassword = 'TestPass123'
    const hash = await hashPassword(testPassword)
    const isValid = await verifyPassword(testPassword, hash)
    
    // Test JWT generation and verification
    const testPayload = {
      id: 'test-id',
      adminEmail: 'test@example.com',
      adminName: 'Test User',
      companyName: 'Test Company',
      subscriptionTier: 'free'
    }
    
    const token = generateJWT(testPayload)
    const tokenVerification = verifyJWTToken(token)
    
    return {
      passwordTest: {
        hash: hash.substring(0, 20) + '...',
        verification: isValid
      },
      jwtTest: {
        tokenLength: token.length,
        verification: tokenVerification.success
      },
      environment: {
        jwtSecretLength: JWT_SECRET.length,
        nodeEnv: process.env.NODE_ENV
      }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Error desconocido',  // ← FIX
    details: error instanceof Error ? error.stack : 'Unknown error'
    }
    }
  }

export async function validateAuthToken(authHeader: string | null, request?: NextRequest): Promise<{
  success: boolean
  account?: any
  error?: string
}> {
  try {
    let token: string | null = null

    // Prioridad 1: Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    // Prioridad 2: Cookie focalizahr_token (para requests del navegador)
    else if (request && request.cookies.get('focalizahr_token')) {
      token = request.cookies.get('focalizahr_token')?.value || null
    }

    if (!token) {
      return { success: false, error: 'Token de autenticación requerido' }
    }

    const verification = verifyJWTToken(token)
    
    if (!verification.success || !verification.payload) {
      return { success: false, error: verification.error || 'Token inválido' }
    }

    // Verify user still exists and is active
    const account = await prisma.account.findUnique({
      where: { id: verification.payload.id },
      select: {
        id: true,
        adminEmail: true,
        adminName: true,
        companyName: true,
        subscriptionTier: true,
         role: true  // ← AGREGAR
      }
    })

    if (!account) {
      return { success: false, error: 'Cuenta no encontrada' }
    }

    return { 
      success: true, 
      account: {
        ...verification.payload,
        // Update with current account data
        adminEmail: account.adminEmail,
        adminName: account.adminName,
        companyName: account.companyName,
        subscriptionTier: account.subscriptionTier,
        role: account.role  // ← AGREGAR
      }
    }
  } catch (error) {
    console.error('JWT verification error:', error)
    return { success: false, error: 'Error de autenticación interno' }
  }
 
}
 export async function registerAccount(data: {
  companyName: string
  adminEmail: string
  adminName: string
  password: string
}) {
  try {
    // Check if account already exists
    const existingAccount = await prisma.account.findUnique({
      where: { adminEmail: data.adminEmail }
    })

    if (existingAccount) {
      return { success: false, error: 'Email ya está registrado' }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create account
    const account = await prisma.account.create({
      data: {
        companyName: data.companyName,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        passwordHash
      }
    })

    // Generate JWT
    const token = generateJWT({
      id: account.id,
      adminEmail: account.adminEmail,
      adminName: account.adminName,
      companyName: account.companyName,
      subscriptionTier: account.subscriptionTier,
      role: account.role  // ← AGREGAR
    })

    return {
      success: true,
      token,
      account: {
        id: account.id,
        adminEmail: account.adminEmail,
        adminName: account.adminName,
        companyName: account.companyName,
        subscriptionTier: account.subscriptionTier,
        role: account.role  // ← AGREGAR
      }
    }
  } catch (error) {
    console.error('Register error:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
// AGREGAR ESTA FUNCIÓN AL FINAL DEL ARCHIVO src/lib/auth.ts
// (después de la función registerAccount)

// Función para verificar autenticación en el cliente
export function isAuthenticated(): boolean {
  try {
    // En el navegador, verificar si hay token en localStorage
    if (typeof window === 'undefined') {
      return false; // En el servidor, no está autenticado
    }

    const token = localStorage.getItem('focalizahr_token');
    
    if (!token) {
      return false;
    }

    // Verificar que el token no esté expirado
    const verification = verifyJWTToken(token);
    return verification.success;
    
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Función para obtener datos del usuario autenticado
export function getCurrentUser(): JWTPayload | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = localStorage.getItem('focalizahr_token');
    
    if (!token) {
      return null;
    }

    const verification = verifyJWTToken(token);
    
    if (verification.success && verification.payload) {
      return verification.payload;
    }

    return null;
    
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Función para logout
export function logout(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('focalizahr_token');
      // Opcional: redireccionar
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
  
}
// --- CÓDIGO NUEVO AGREGADO AL FINAL ---
/**
 * Generates a secure, unique, random token.
 * Used for things like participant survey links.
 * @returns {string} A 64-character hex token.
 */
export function generateUniqueToken(): string {
  return randomBytes(32).toString('hex');
}
// Funciones helper para roles
export function isAdmin(payload: JWTPayload | null | undefined): boolean {
  return payload?.role === 'FOCALIZAHR_ADMIN';
}

export function getUserFromHeaders(request: Request): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const verification = verifyJWTToken(token);
    
    if (verification.success && verification.payload) {
      return verification.payload;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from headers:', error);
    return null;
  }
}
/**
 * Genera JWT de servicio interno para llamadas server-to-server
 * Vida útil: 5 minutos (suficiente para enrollment completo)
 */
export function generateServiceToken(accountId: string): string {
  const payload = {
    type: 'service',
    accountId,
    scope: 'onboarding-enrollment',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutos
  };
  
  const token = jwt.sign(payload, JWT_SECRET, {
    issuer: 'focalizahr-internal-service'
  });
  
  console.log(`🔑 [ServiceToken] Generated for account: ${accountId}`);
  
  return token;
}