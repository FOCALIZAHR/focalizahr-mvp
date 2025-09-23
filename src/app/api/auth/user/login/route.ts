// src/app/api/auth/user/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateJWT } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Password requerido')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 User login attempt started');
    
    // 1. Validar datos de entrada
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    console.log('✅ Validation passed for:', email);
    
    // 2. Buscar User primero
    let user = await prisma.user.findUnique({
      where: { email },
      include: { 
        account: {
          select: {
            id: true,
            companyName: true,
            companyLogo: true,
            subscriptionTier: true,
            status: true
          }
        },
        department: {
          select: {
            id: true,
            displayName: true,
            parentId: true,
            level: true
          }
        }
      }
    });
    
    // 3. Si no existe User, buscar en Account (compatibilidad)
    if (!user) {
      console.log('User not found, checking Account for compatibility...');
      
      const account = await prisma.account.findUnique({
        where: { adminEmail: email },
        select: {
          id: true,
          adminEmail: true,
          adminName: true,
          passwordHash: true,
          role: true,
          companyName: true,
          subscriptionTier: true
        }
      });
      
      if (account) {
        // Auto-migrar Account a User
        console.log('Auto-migrating Account to User...');
        
        const userRole = account.role === 'FOCALIZAHR_ADMIN' 
          ? 'FOCALIZAHR_ADMIN' 
          : 'ACCOUNT_OWNER';
        
        user = await prisma.user.create({
          data: {
            accountId: account.id,
            email: account.adminEmail,
            name: account.adminName,
            passwordHash: account.passwordHash,
            role: userRole,
            departmentId: null,
            isActive: true
          },
          include: {
            account: {
              select: {
                id: true,
                companyName: true,
                companyLogo: true,
                subscriptionTier: true,
                status: true
              }
            },
            department: true
          }
        });
        
        console.log('✅ Account auto-migrated to User');
      }
    }
    
    // 4. Verificar que existe el usuario
    if (!user || !user.isActive) {
      console.log('❌ Invalid credentials or inactive user');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // 5. Verificar password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    console.log('✅ Password verified successfully');
    
    // 6. Generar JWT con información completa
    const jwtPayload = {
      // Campos para User
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      departmentId: user.departmentId,
      
      // Campos de Account para compatibilidad con APIs existentes
      id: user.accountId,
      accountId: user.accountId,
      adminEmail: user.email, // Para APIs que esperan adminEmail
      adminName: user.name,   // Para APIs que esperan adminName
      companyName: user.account.companyName,
      subscriptionTier: user.account.subscriptionTier,
      
      // Role para middleware
      role: user.role === 'FOCALIZAHR_ADMIN' ? 'FOCALIZAHR_ADMIN' : 'CLIENT'
    };
    
    const token = generateJWT(jwtPayload);
    console.log('✅ JWT token generated');
    
    // 7. Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // 8. Crear respuesta con cookie
    const responseBody = {
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.account.companyName,
        departmentId: user.departmentId,
        departmentName: user.department?.displayName,
        // Info adicional para frontend
        isAdmin: ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'].includes(user.role),
        canManageCampaigns: ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER'].includes(user.role),
        canViewAnalytics: true, // Todos pueden ver pero filtrado
        scope: user.departmentId ? 'department' : 'company'
      }
    };
    
    const response = NextResponse.json(responseBody);
    
    // 9. Establecer cookie segura
    response.cookies.set({
      name: 'focalizahr_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });
    
    console.log('🎉 User login successful:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department?.displayName || 'Global'
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}