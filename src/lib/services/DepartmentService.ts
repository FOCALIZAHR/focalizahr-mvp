// ====================================================================
// FOCALIZAHR DEPARTMENTS - BUSINESS LOGIC SERVICE
// src/lib/services/DepartmentService.ts
// Chat 2: Foundation Schema + Services - ARCHIVO NUEVO
// ====================================================================

import { prisma } from '@/lib/prisma';

export interface CreateDepartmentData {
  displayName: string;
  standardCategory?: string;
}

export interface DepartmentWithStats {
  id: string;
  displayName: string;
  standardCategory: string | null;
  isActive: boolean;
  accountId: string;
  participantCount: number;
  createdAt: Date;
}

export class DepartmentService {
  
  // ✅ CREAR DEPARTMENT PARA UNA CUENTA
  static async createDepartment(accountId: string, data: CreateDepartmentData) {
    try {
      const department = await prisma.department.create({
        data: {
          accountId,
          displayName: data.displayName.trim(),
          standardCategory: data.standardCategory || this.guessStandardCategory(data.displayName),
          isActive: true,
        },
      });

      console.log(`✅ Department created: ${department.displayName} (${department.standardCategory})`);
      return department;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error(`Department "${data.displayName}" already exists for this account`);
      }
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // ✅ OBTENER DEPARTMENTS DE UNA CUENTA
  static async getDepartmentsByAccount(accountId: string): Promise<DepartmentWithStats[]> {
    try {
      const departments = await prisma.department.findMany({
        where: {
          accountId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          displayName: 'asc',
        },
      });

      return departments.map(dept => ({
        id: dept.id,
        displayName: dept.displayName,
        standardCategory: dept.standardCategory,
        isActive: dept.isActive,
        accountId: dept.accountId,
        participantCount: dept._count.participants,
        createdAt: dept.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // ✅ CREAR MÚLTIPLES DEPARTMENTS (BULK OPERATION)
  static async createBulkDepartments(accountId: string, departmentNames: string[]) {
    try {
      const uniqueNames = [...new Set(departmentNames.map(name => name.trim()))].filter(Boolean);
      
      const departments = uniqueNames.map(name => ({
        accountId,
        displayName: name,
        standardCategory: this.guessStandardCategory(name),
        isActive: true,
      }));

      const result = await prisma.department.createMany({
        data: departments,
        skipDuplicates: true,
      });

      console.log(`✅ Created ${result.count} departments in bulk`);
      return result;
    } catch (error) {
      console.error('Error creating bulk departments:', error);
      throw error;
    }
  }

  // ✅ MAPEO AUTOMÁTICO CATEGORÍA ESTÁNDAR
  static guessStandardCategory(departmentName: string): string {
    const name = departmentName.toLowerCase().trim();
    
    // Ventas y Comercial
    if (name.includes('ventas') || name.includes('comercial') || name.includes('sales') || 
        name.includes('venta') || name.includes('negocio')) {
      return 'ventas';
    }
    
    // Marketing y Comunicaciones
    if (name.includes('marketing') || name.includes('publicidad') || name.includes('marca') ||
        name.includes('comunicaciones') || name.includes('comunicación')) {
      return 'marketing';
    }
    
    // Desarrollo y TI
    if (name.includes('desarrollo') || name.includes('it') || name.includes('tech') || 
        name.includes('sistemas') || name.includes('tecnología') || name.includes('software')) {
      return 'desarrollo';
    }
    
    // Recursos Humanos
    if (name.includes('rrhh') || name.includes('recursos') || name.includes('personas') ||
        name.includes('humanos') || name.includes('talento')) {
      return 'rrhh';
    }
    
    // Operaciones
    if (name.includes('operaciones') || name.includes('logística') || name.includes('producción') ||
        name.includes('manufacturing') || name.includes('supply')) {
      return 'operaciones';
    }
    
    // Finanzas
    if (name.includes('finanzas') || name.includes('contabilidad') || name.includes('finance') ||
        name.includes('contable') || name.includes('tesorería')) {
      return 'finanzas';
    }
    
    return 'otros';
  }

  // ✅ OBTENER DEPARTMENT POR ID
  static async getDepartmentById(departmentId: string, accountId: string) {
    try {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          accountId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });

      return department;
    } catch (error) {
      console.error('Error fetching department by ID:', error);
      throw error;
    }
  }

  // ✅ ACTUALIZAR DEPARTMENT
  static async updateDepartment(departmentId: string, accountId: string, data: Partial<CreateDepartmentData>) {
    try {
      const updatedDepartment = await prisma.department.update({
        where: {
          id: departmentId,
          accountId,
        },
        data: {
          ...(data.displayName && { displayName: data.displayName.trim() }),
          ...(data.standardCategory && { standardCategory: data.standardCategory }),
        },
      });

      console.log(`✅ Department updated: ${updatedDepartment.displayName}`);
      return updatedDepartment;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  // ✅ SOFT DELETE DEPARTMENT
  static async deactivateDepartment(departmentId: string, accountId: string) {
    try {
      const department = await prisma.department.update({
        where: {
          id: departmentId,
          accountId,
        },
        data: {
          isActive: false,
        },
      });

      console.log(`✅ Department deactivated: ${department.displayName}`);
      return department;
    } catch (error) {
      console.error('Error deactivating department:', error);
      throw error;
    }
  }
}