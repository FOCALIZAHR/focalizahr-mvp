// src/app/api/admin/participants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWTToken } from '@/lib/auth'
import { z } from 'zod';
import { generateSecureToken } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// Esquema de validación para participantes
const participantSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.date().optional(),
  hireDate: z.date().optional(),
});

// ============= FUNCIONES AUXILIARES DE PARSEO =============

/**
 * Parsea género con variaciones comunes
 */
function parseGender(value: string | undefined): string | undefined {
  if (!value) return undefined;
  
  const normalized = value.toLowerCase().trim();
  
  const genderMap: Record<string, string> = {
    'm': 'MALE',
    'masculino': 'MALE',
    'male': 'MALE',
    'hombre': 'MALE',
    'man': 'MALE',
    'h': 'MALE',
    'f': 'FEMALE',
    'femenino': 'FEMALE',
    'female': 'FEMALE',
    'mujer': 'FEMALE',
    'woman': 'FEMALE',
    'nb': 'NON_BINARY',
    'no binario': 'NON_BINARY',
    'nobinario': 'NON_BINARY',
    'non-binary': 'NON_BINARY',
    'other': 'NON_BINARY',
    'otro': 'NON_BINARY',
    'ns': 'PREFER_NOT_TO_SAY',
    'prefiero no decir': 'PREFER_NOT_TO_SAY',
    'no especifica': 'PREFER_NOT_TO_SAY',
    'n/a': 'PREFER_NOT_TO_SAY'
  };
  
  return genderMap[normalized] || undefined;
}

/**
 * Parsea fecha flexible (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serial)
 */
function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  try {
    // Si es un número de Excel (días desde 30/12/1899) - CORREGIDO
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30); // 30 dic 1899 - CORRECCIÓN CRÍTICA
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return isValidDate(date) ? date : undefined;
    }
    
    // Convertir a string para procesar
    const dateStr = value.toString().trim();
    
    // Formato DD/MM/YYYY o DD-MM-YYYY (acepta AMBOS con barras o guiones)
    const ddmmyyyy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(dateStr);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isValidDate(date) ? date : undefined;
    }
    
    // Formato YYYY-MM-DD o YYYY/MM/DD
    const yyyymmdd = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(dateStr);
    if (yyyymmdd) {
      const [, year, month, day] = yyyymmdd;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isValidDate(date) ? date : undefined;
    }
    
    // Fallback: usar constructor Date
    const date = new Date(value);
    return isValidDate(date) ? date : undefined;
    
  } catch {
    return undefined;
  }
}

/**
 * Valida que una fecha sea válida y razonable
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && 
         !isNaN(date.getTime()) && 
         date.getFullYear() > 1900 && 
         date.getFullYear() < 2030;
}

// ============= FIN FUNCIONES AUXILIARES =============

// Interfaz para resultados de procesamiento
interface ProcessingResult {
  success: boolean;
  totalProcessed: number;
  validRecords: number;
  duplicates: number;
  errors: string[];
  participants: Array<{
    email: string;
    name?: string;
    department?: string;
    position?: string;
    location?: string;
    gender?: string;
    dateOfBirth?: Date;
    hireDate?: Date;
  }>;
}

// Función para procesar archivo CSV/Excel
async function processFile(file: File): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: false,
    totalProcessed: 0,
    validRecords: 0,
    duplicates: 0,
    errors: [],
    participants: []
  };

  try {
    const buffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;

    // Determinar tipo de archivo y procesar
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const csvData = new TextDecoder().decode(buffer);
      workbook = XLSX.read(csvData, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'array' });
    }

    // Obtener primera hoja
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      result.errors.push('No se encontraron hojas en el archivo');
      return result;
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      result.errors.push('Archivo vacío');
      return result;
    }

    // Obtener headers (primera fila)
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    result.totalProcessed = dataRows.length;

    // Mapear headers a campos conocidos
    const emailIndex = headers.findIndex(h => 
      h && h.toLowerCase().includes('email') || h.toLowerCase().includes('correo')
    );
    const nameIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('name') || h.toLowerCase().includes('nombre'))
    );
    const departmentIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('department') || h.toLowerCase().includes('departamento'))
    );
    const positionIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('position') || h.toLowerCase().includes('cargo') || h.toLowerCase().includes('puesto'))
    );
    const locationIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('location') || h.toLowerCase().includes('ubicacion'))
    );
    
    // NUEVOS CAMPOS - Detección de columnas
    const genderIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('gender') || h.toLowerCase().includes('genero') || h.toLowerCase().includes('género') || h.toLowerCase().includes('sexo'))
    );
    const dateOfBirthIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('fecha') && h.toLowerCase().includes('nacimiento')) || 
      h.toLowerCase().includes('birthday') || 
      h.toLowerCase().includes('birth')
    );
    const hireDateIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('fecha') && h.toLowerCase().includes('ingreso')) || 
      h.toLowerCase().includes('hire') || 
      h.toLowerCase().includes('contrat')
    );

    if (emailIndex === -1) {
      result.errors.push('No se encontró columna de email/correo en el archivo');
      return result;
    }

    // Procesar cada fila
    const emailsSeen = new Set<string>();
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      const rowNumber = i + 2; // +2 porque empezamos en fila 2 (después de headers)
      
      if (!row || row.length === 0) continue;

      try {
        const email = row[emailIndex]?.toString().trim().toLowerCase();
        
        if (!email) {
          result.errors.push(`Fila ${rowNumber}: Email vacío`);
          continue;
        }

        // Verificar duplicados en el archivo
        if (emailsSeen.has(email)) {
          result.duplicates++;
          result.errors.push(`Fila ${rowNumber}: Email duplicado en archivo: ${email}`);
          continue;
        }
        emailsSeen.add(email);

        // Crear objeto participante con TODOS los campos
        const participant = {
          email,
          name: nameIndex >= 0 ? row[nameIndex]?.toString().trim() : undefined,
          department: departmentIndex >= 0 ? row[departmentIndex]?.toString().trim() : undefined,
          position: positionIndex >= 0 ? row[positionIndex]?.toString().trim() : undefined,
          location: locationIndex >= 0 ? row[locationIndex]?.toString().trim() : undefined,
          // NUEVOS CAMPOS - Parsear con funciones auxiliares
          gender: genderIndex >= 0 ? parseGender(row[genderIndex]?.toString().trim()) : undefined,
          dateOfBirth: dateOfBirthIndex >= 0 ? parseDate(row[dateOfBirthIndex]) : undefined,
          hireDate: hireDateIndex >= 0 ? parseDate(row[hireDateIndex]) : undefined,
        };

        // Validar con schema
        const validationResult = participantSchema.safeParse(participant);
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          result.errors.push(`Fila ${rowNumber}: ${errorMessages.join(', ')}`);
          continue;
        }

        result.participants.push(validationResult.data);
        result.validRecords++;

      } catch (error) {
        result.errors.push(`Fila ${rowNumber}: Error procesando - ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    result.success = result.validRecords > 0;
    return result;

  } catch (error) {
    result.errors.push(`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return result;
  }
}

// Función para cargar participantes en la base de datos
async function loadParticipantsToDatabase(
  campaignId: string, 
  participants: Array<{
    email: string;
    name?: string;
    department?: string;
    position?: string;
    location?: string;
    gender?: string;
    dateOfBirth?: Date;
    hireDate?: Date;
  }>
): Promise<{ success: boolean; totalLoaded: number; duplicatesInDB: number; error?: string }> {
  
  try {
    // Verificar que la campaña existe y está en estado draft
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        id: true, 
        status: true, 
        totalInvited: true,
        accountId: true  // NECESARIO para DepartmentAdapter
      }
    });

    if (!campaign) {
      return { success: false, totalLoaded: 0, duplicatesInDB: 0, error: 'Campaña no encontrada' };
    }

    if (campaign.status !== 'draft') {
      return { success: false, totalLoaded: 0, duplicatesInDB: 0, error: 'Solo se pueden cargar participantes en campañas en estado draft' };
    }

    // Verificar límite de participantes (máximo 500)
    if (participants.length > 500) {
      return { success: false, totalLoaded: 0, duplicatesInDB: 0, error: 'Máximo 500 participantes permitidos por campaña' };
    }

    // ============= INTEGRACIÓN DEPARTMENTADAPTER =============
    
    // Obtener todos los departamentos únicos del CSV
    const departmentNames = [...new Set(
      participants
        .map(p => p.department)
        .filter(Boolean) as string[]
    )];

    let departmentMapping: Record<string, string | null> = {};
    
    if (departmentNames.length > 0) {
      // Auto-crear departments que no existan
      await DepartmentAdapter.autoCreateDepartmentsFromParticipants(
        campaign.accountId,
        departmentNames
      );
      
      // Obtener mapeo de nombres a IDs
      departmentMapping = await DepartmentAdapter.convertParticipantDepartments(
        campaign.accountId,
        departmentNames
      );
    }
    
    // ============= FIN INTEGRACIÓN DEPARTMENTADAPTER =============

    // Verificar duplicados existentes en BD
    const existingEmails = await prisma.participant.findMany({
      where: {
        campaignId,
        email: { in: participants.map(p => p.email) }
      },
      select: { email: true }
    });

    const existingEmailSet = new Set(existingEmails.map(p => p.email));
    const newParticipants = participants.filter(p => !existingEmailSet.has(p.email));
    const duplicatesInDB = participants.length - newParticipants.length;

    if (newParticipants.length === 0) {
      return { success: false, totalLoaded: 0, duplicatesInDB, error: 'Todos los participantes ya existen en la campaña' };
    }

    // Preparar datos para inserción con TODOS los campos nuevos
    const participantsToInsert = newParticipants.map(participant => ({
      campaignId,
      email: participant.email,
      uniqueToken: generateSecureToken(),
      name: participant.name || null,
      department: participant.department || null,
      departmentId: participant.department ? departmentMapping[participant.department] || null : null, // NUEVO
      position: participant.position || null,
      location: participant.location || null,
      gender: participant.gender || null,           // NUEVO
      dateOfBirth: participant.dateOfBirth || null, // NUEVO
      hireDate: participant.hireDate || null,       // NUEVO
      hasResponded: false,
      createdAt: new Date(),
    }));

    // Insertar participantes en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Insertar participantes
      await tx.participant.createMany({
        data: participantsToInsert,
        skipDuplicates: true
      });

      // Actualizar contador en campaña
      const totalInvited = campaign.totalInvited + newParticipants.length;
      await tx.campaign.update({
        where: { id: campaignId },
        data: { 
          totalInvited,
          updatedAt: new Date()
        }
      });

      return { totalLoaded: newParticipants.length, totalInvited };
    });

    return { 
      success: true, 
      totalLoaded: result.totalLoaded, 
      duplicatesInDB 
    };

  } catch (error) {
    console.error('Error loading participants to database:', error);
    return { 
      success: false, 
      totalLoaded: 0, 
      duplicatesInDB: 0, 
      error: error instanceof Error ? error.message : 'Error desconocido cargando participantes' 
    };
  }
}

// Handler principal POST
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación admin (simplificado para MVP)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const verification = verifyJWTToken(token);
    if (!verification.success) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const campaignId = formData.get('campaignId') as string;
    const action = formData.get('action') as string; // 'preview' | 'confirm'

    if (!file || !campaignId || !action) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: file, campaignId, action' },
        { status: 400 }
      );
    }

    // Validar que la campaña existe
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        account: { select: { companyName: true, adminEmail: true } },
        campaignType: { select: { name: true, slug: true } }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // Procesar archivo
    const processingResult = await processFile(file);

    if (!processingResult.success) {
      return NextResponse.json({
        error: 'Error procesando archivo',
        details: processingResult.errors,
        ...processingResult
      }, { status: 400 });
    }

    // Si es preview, retornar solo resultados del procesamiento
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        message: 'Archivo procesado exitosamente',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          company: campaign.account.companyName
        },
        // Propiedades específicas del processingResult
        participants: processingResult.participants,
        validRecords: processingResult.validRecords,
        errors: processingResult.errors,
        duplicates: processingResult.duplicates
      });
    }

    // Si es confirm, cargar participantes a BD
    if (action === 'confirm') {
      const loadResult = await loadParticipantsToDatabase(
        campaignId, 
        processingResult.participants
      );

      if (!loadResult.success) {
        return NextResponse.json({
          error: loadResult.error || 'Error cargando participantes',
          ...loadResult
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Participantes cargados exitosamente: ${loadResult.totalLoaded}`,
        totalLoaded: loadResult.totalLoaded,
        duplicatesInDB: loadResult.duplicatesInDB,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          company: campaign.account.companyName
        }
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Usa "preview" o "confirm"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in admin participants API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Handler GET para obtener campañas pendientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const withoutParticipants = searchParams.get('withoutParticipants') === 'true';

    // Construir filtros
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (withoutParticipants) {
      where.totalInvited = { lte: 0 };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        account: { 
          select: { 
            companyName: true, 
            adminEmail: true 
          } 
        },
        campaignType: { 
          select: { 
            name: true, 
            slug: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transformar para la respuesta
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      campaignType: {
        name: campaign.campaignType.name,
        slug: campaign.campaignType.slug
      },
      company: {
        name: campaign.account.companyName,
        admin_email: campaign.account.adminEmail
      },
      totalInvited: campaign.totalInvited,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      created_at: campaign.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      campaigns: formattedCampaigns,
      total: formattedCampaigns.length
    });

  } catch (error) {
    console.error('Error fetching campaigns for admin:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo campañas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}