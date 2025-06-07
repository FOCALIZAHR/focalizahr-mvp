// src/lib/auth.ts - VERSIÓN CORREGIDA CON DEBUG
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-focalizahr-2024'

export interface JWTPayload {
  id: string
  adminEmail: string
  adminName: string
  companyName: string
  subscriptionTier: string
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

export function verifyJWTToken(token: string): { success: boolean; payload?: JWTPayload; error?: string } {
  try {
    console.log('🎫 Verifying JWT token...')
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    console.log('✅ JWT token verified successfully')
    return { success: true, payload }
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
        subscriptionTier: true
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
        subscriptionTier: account.subscriptionTier
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
      error: error.message,
      details: error instanceof Error ? error.stack : 'Unknown error'
    }
  }
}