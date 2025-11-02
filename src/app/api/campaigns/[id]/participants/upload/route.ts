// src/app/api/campaigns/[id]/participants/upload/route.ts
// ✅ MIGRADO DESDE /api/admin/participants - ARQUITECTURA RESTFUL
// ✅ ACTUALIZADO CON RUT + PHONENUMBER
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWTToken } from '@/lib/auth';
import { z } from 'zod';
import { generateSecureToken } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Gender } from '@prisma/client';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// ✅ CAMBIO 1: Schema actualizado con RUT obligatorio + email/phone opcional
const participantSchema = z.object({
  nationalId: z.string().regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido (formato: 12345678-9)'),
  email: z.string().email('Email inválido').optional(),
  phoneNumber: z.string().regex(/^\+56[0-9]{9}$/, 'Formato: +56912345678').optional(),
  name: z.string().optional(),
  department: z.string().optional(),// CAMBIO, AHORA OPCIONAL
  position: z.string().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.date().optional(),
  hireDate: z.date().optional(),
}).refine(
  (data) => data.email || data.phoneNumber,
  { message: 'Debe proporcionar email O phoneNumber' }
);

// ============= ✅ CAMBIO 2: FUNCIONES VALIDACIÓN RUT =============

/**
 * Valida RUT chileno con algoritmo módulo 11
 */
function validateRut(rut: string): boolean {
  if (!rut) return false;
  
  const rutRegex = /^(\d{7,8})-?([\dkK])$/;
  const match = rutRegex.exec(rut.replace(/\./g, '').trim());
  
  if (!match) return false;
  
  const [, num, dv] = match;
  let suma = 0;
  let multiplo = 2;
  
  for (let i = num.length - 1; i >= 0; i--) {
    suma += parseInt(num[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  const dvCalculado = 11 - (suma % 11);
  const dvEsperado = dvCalculado === 11 ? '0' : 
                     dvCalculado === 10 ? 'k' : 
                     dvCalculado.toString();
  
  return dv.toLowerCase() === dvEsperado;
}

/**
 * Normaliza RUT a formato estándar 12345678-9
 */
function normalizeRut(rut: string): string {
  if (!rut) return '';
  
  const cleaned = rut.replace(/[.\s]/g, '').trim();
  const match = /^(\d{7,8})([\dkK])$/.exec(cleaned);
  if (!match) return cleaned;
  
  const [, num, dv] = match;
  return `${num}-${dv.toUpperCase()}`;
}

// ============= FIN FUNCIONES VALIDACIÓN RUT =============

// ============= FUNCIONES AUXILIARES DE PARSEO (SIN CAMBIOS) =============

/**
 * Parsea género con variaciones comunes
 */
function parseGender(value: string | undefined): Gender | null {
 if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  const genderMap: Record<string, Gender> = {  // ✅ CAMBIAR TIPO AQUÍ
    'm': Gender.MALE,              // ✅ CAMBIAR 'MALE' → Gender.MALE
    'masculino': Gender.MALE,
    'male': Gender.MALE,
    'hombre': Gender.MALE,
    'man': Gender.MALE,
    'h': Gender.MALE,
    'f': Gender.FEMALE,            // ✅ CAMBIAR 'FEMALE' → Gender.FEMALE
    'femenino': Gender.FEMALE,
    'female': Gender.FEMALE,
    'mujer': Gender.FEMALE,
    'woman': Gender.FEMALE,
    'nb': Gender.NON_BINARY,       // ✅ CAMBIAR a Gender.NON_BINARY
    'no binario': Gender.NON_BINARY,
    'nobinario': Gender.NON_BINARY,
    'non-binary': Gender.NON_BINARY,
    'other': Gender.NON_BINARY,
    'otro': Gender.NON_BINARY,
    'ns': Gender.PREFER_NOT_TO_SAY,  // ✅ CAMBIAR a Gender.PREFER_NOT_TO_SAY
    'prefiero no decir': Gender.PREFER_NOT_TO_SAY,
    'no especifica': Gender.PREFER_NOT_TO_SAY,
    'n/a': Gender.PREFER_NOT_TO_SAY
  };
  
  return genderMap[normalized] || null;
}

/**
 * Parsea fecha flexible (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serial)
 */
function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  try {
    // Si es un número de Excel (días desde 30/12/1899)
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return isValidDate(date) ? date : undefined;
    }
    
    const dateStr = value.toString().trim();
    
    // Formato DD/MM/YYYY o DD-MM-YYYY
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

// ✅ CAMBIO 3: Interfaz actualizada con RUT + phone
interface ProcessingResult {
  success: boolean;
  totalProcessed: number;
  validRecords: number;
  duplicates: number;
  errors: string[];
  participants: Array<{
    nationalId: string;      // ✅ NUEVO
    email?: string;          // ✅ AHORA OPCIONAL
    phoneNumber?: string;    // ✅ NUEVO
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
      workbook = XLSX.read(buffer, {
        type: 'buffer',
        codepage: 65001
      });
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
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,  // ← AGREGAR: Mantener como strings (no procesar encoding)
      defval: ''   // ← AGREGAR: Valores vacíos como string vacío
});

    if (jsonData.length === 0) {
      result.errors.push('Archivo vacío');
      return result;
    }

    // Obtener headers (primera fila)
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    result.totalProcessed = dataRows.length;

    // ✅ CAMBIO 4: Agregar detección columna RUT
    const rutIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('rut') || 
            h.toLowerCase().includes('nacional') ||
            h.toLowerCase().includes('cedula') ||
            h.toLowerCase().includes('cédula'))
    );
    
    // ✅ CAMBIO 5: Agregar detección columna Phone
    const phoneIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('celular') || 
            h.toLowerCase().includes('phone') || 
            h.toLowerCase().includes('telefono') ||
            h.toLowerCase().includes('teléfono') ||
            h.toLowerCase().includes('whatsapp') ||
            h.toLowerCase().includes('movil') ||
            h.toLowerCase().includes('móvil'))
    );
    
    const emailIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('email') || h.toLowerCase().includes('correo'))
    );
    const nameIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('nombre') || h.toLowerCase().includes('name'))
    );
    const departmentIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('departamento') || 
            h.toLowerCase().includes('department') || 
            h.toLowerCase().includes('área') ||
            h.toLowerCase().includes('area'))
    );
    const positionIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('cargo') || 
            h.toLowerCase().includes('position') || 
            h.toLowerCase().includes('puesto'))
    );
    const locationIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('ubicación') || 
            h.toLowerCase().includes('ubicacion') || 
            h.toLowerCase().includes('location') || 
            h.toLowerCase().includes('ciudad'))
    );
    const genderIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('género') || 
            h.toLowerCase().includes('genero') || 
            h.toLowerCase().includes('gender') || 
            h.toLowerCase().includes('sexo'))
    );
    const dobIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('nacimiento') || 
            h.toLowerCase().includes('birth') ||
            h.toLowerCase().includes('fecha nac'))
    );
    const hireDateIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('ingreso') || 
            h.toLowerCase().includes('contratación') || 
            h.toLowerCase().includes('hire') ||
            h.toLowerCase().includes('fecha ing'))
    );

    // ✅ CAMBIO 6: Validar columna RUT obligatoria
    if (rutIndex === -1) {
      result.errors.push('❌ Columna RUT no encontrada. El archivo debe contener una columna con RUT, cedula o identificación nacional');
      return result;
    }
    
    // ✅ CAMBIO 7: Validar al menos email O phone
    if (emailIndex === -1 && phoneIndex === -1) {
      result.errors.push('❌ Debe proporcionar al menos una columna de Email O Celular/Teléfono');
      return result;
    }

    const seenRuts = new Set<string>();

    // Procesar cada fila
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      
      // ✅ CAMBIO 8: Procesar RUT como obligatorio
      const rawRut = row[rutIndex];
      if (!rawRut) {
        result.errors.push(`Fila ${i + 2}: RUT vacío (obligatorio)`);
        continue;
      }
      
      const rut = normalizeRut(String(rawRut));
      if (!validateRut(rut)) {
        result.errors.push(`Fila ${i + 2}: RUT inválido: ${rut}`);
        continue;
      }
      
      // Detectar duplicados dentro del archivo
      if (seenRuts.has(rut)) {
        result.duplicates++;
        continue;
      }
      seenRuts.add(rut);
      
      // ✅ CAMBIO 9: Email y phone opcionales, pero al menos uno requerido
      const email = emailIndex !== -1 ? row[emailIndex] : undefined;
      const phoneNumber = phoneIndex !== -1 ? row[phoneIndex] : undefined;
      
      if (!email && !phoneNumber) {
        result.errors.push(`Fila ${i + 2}: Debe proporcionar email O celular`);
        continue;
      }

      const participant: any = {
        nationalId: rut,  // ✅ NUEVO
        name: nameIndex !== -1 ? row[nameIndex] : undefined,
        department: departmentIndex !== -1 ? row[departmentIndex] : undefined,
        position: positionIndex !== -1 ? row[positionIndex] : undefined,
        location: locationIndex !== -1 ? row[locationIndex] : undefined,
      };
      
      // ✅ CAMBIO 10: Agregar email y phone si existen
      if (email) participant.email = String(email).trim();
      if (phoneNumber) {
        let phone = String(phoneNumber).trim();
        // Normalizar formato phone (+56XXXXXXXXX)
        phone = phone.replace(/\s/g, '');
        if (!phone.startsWith('+56')) {
          if (phone.startsWith('56')) {
            phone = '+' + phone;
          } else if (phone.startsWith('9')) {
            phone = '+56' + phone;
          }
        }
        participant.phoneNumber = phone;
      }

      // Campos demográficos (opcionales)
      if (genderIndex !== -1) {
        participant.gender = parseGender(row[genderIndex]);
      }
      if (dobIndex !== -1) {
        participant.dateOfBirth = parseDate(row[dobIndex]);
      }
      if (hireDateIndex !== -1) {
        participant.hireDate = parseDate(row[hireDateIndex]);
      }

      result.participants.push(participant);
      result.validRecords++;
    }

    result.success = result.validRecords > 0;
    return result;

  } catch (error) {
    result.errors.push(`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return result;
  }
}

// ✅ CAMBIO 11: Función de carga a BD actualizada con RUT + phone
async function loadParticipantsToDatabase(
  campaignId: string, 
  participants: ProcessingResult['participants']
): Promise<{ 
  success: boolean; 
  totalLoaded: number; 
  duplicatesInDB: number; 
  unmappedDepartments?: string[];
  error?: string;
}> {
  try {
    console.log(`🔄 Iniciando carga de ${participants.length} participantes para campaña ${campaignId}`);

    // PASO 1: VERIFICAR CAMPAÑA Y OBTENER accountId
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        id: true, 
        accountId: true, 
        totalInvited: true,
        account: {
          select: { companyName: true }
        }
      }
    });

    if (!campaign) {
      return { 
        success: false, 
        totalLoaded: 0, 
        duplicatesInDB: 0, 
        error: 'Campaña no encontrada' 
      };
    }

    console.log(`✅ Campaña encontrada: ${campaign.account.companyName}`);

    // PASO 2: VERIFICAR DUPLICADOS POR RUT (YA EN BASE DE DATOS)
    const existingRuts = await prisma.participant.findMany({
      where: {
        campaignId,
        nationalId: {
          in: participants.map(p => p.nationalId)
        }
      },
      select: { nationalId: true }
    });

    const existingRutsSet = new Set(existingRuts.map(p => p.nationalId));
    console.log(`🔍 Encontrados ${existingRutsSet.size} RUTs ya existentes en esta campaña`);

    // PASO 3: FILTRAR PARTICIPANTES NUEVOS
    const newParticipants = participants.filter(p => !existingRutsSet.has(p.nationalId));
    const duplicatesInDB = participants.length - newParticipants.length;

    if (newParticipants.length === 0) {
      console.log('⚠️ Todos los participantes ya existen en la base de datos');
      return { 
        success: true, 
        totalLoaded: 0, 
        duplicatesInDB 
      };
    }

    console.log(`✅ ${newParticipants.length} participantes nuevos para cargar`);

    // PASO 4: CARGA TOLERANTE CON DEPARTMENTADAPTER
    
    // Extraer términos únicos de departamentos
    const uniqueDepartmentTerms = [...new Set(
      newParticipants
        .map(p => p.department)
        .filter((dept): dept is string => !!dept && dept.trim().length > 0)
    )];
    
    console.log(`📋 Términos de departamento únicos: ${uniqueDepartmentTerms.length}`);
    
    // Buscar o crear departamento paraguas "Departamentos sin Asignar"
    let paraguas = await prisma.department.findFirst({
      where: {
        accountId: campaign.accountId,
        standardCategory: 'sin_asignar'
      }
    });
    
    if (!paraguas) {
      console.log('🏗️ Creando departamento paraguas "Departamentos sin Asignar"');
      paraguas = await prisma.department.create({
        data: {
          accountId: campaign.accountId,
          displayName: 'Departamentos sin Asignar',
          standardCategory: 'sin_asignar',
          unitType: 'departamento',  // ✅ CAMBIAR A 'departamento'
          isActive: true,
          technicalComplexity: 'baja',      // ✅ AGREGAR estos campos
          emotionalComplexity: 'baja',      // ✅ también
          marketScarcity: 'normal'          // ✅ también
        }
      });
    }
    
    // Mapear cada término usando DepartmentAdapter
    const termToDepartmentIdMap: Record<string, string> = {};
    const unmappedDepartments: string[] = [];
    
    for (const term of uniqueDepartmentTerms) {
      // Intentar categorizar con DepartmentAdapter
      const category = DepartmentAdapter.getGerenciaCategory(term);
      
      if (category) {
        // Buscar department con esta categoría
        const dept = await prisma.department.findFirst({
          where: {
            accountId: campaign.accountId,
            standardCategory: category
          }
        });
        
        if (dept) {
          termToDepartmentIdMap[term] = dept.id;
          console.log(`✅ "${term}" → ${category} (${dept.displayName})`);
        } else {
          // No hay department con esa categoría → paraguas
          termToDepartmentIdMap[term] = paraguas.id;
          unmappedDepartments.push(term);
          console.log(`⚠️ "${term}" → categoría '${category}' no encontrada → paraguas`);
        }
      } else {
        // No se pudo categorizar → paraguas
        termToDepartmentIdMap[term] = paraguas.id;
        unmappedDepartments.push(term);
        console.log(`⚠️ "${term}" → sin categoría → paraguas`);
      }
    }
    
    // Preparar datos para insertar
    const participantsToInsert = newParticipants.map(participant => {
      let assignedDepartmentId = paraguas.id; // Default: paraguas
      
      if (participant.department && termToDepartmentIdMap[participant.department]) {
        assignedDepartmentId = termToDepartmentIdMap[participant.department];
      } else if (participant.department) {
        console.log(`🔄 Participante RUT ${participant.nationalId} sin departamento → asignado al paraguas`);
      }
      
      return {
        campaignId,
        nationalId: participant.nationalId,   // ✅ NUEVO
        email: participant.email || null,      // ✅ NULLABLE
        phoneNumber: participant.phoneNumber || null, // ✅ NUEVO
        uniqueToken: generateSecureToken(),
        name: participant.name || null,
        department: participant.department || null,
        departmentId: assignedDepartmentId,
        position: participant.position || null,
        location: participant.location || null,
        gender: participant.gender as Gender | null,
        dateOfBirth: participant.dateOfBirth || null,
        hireDate: participant.hireDate || null,
        hasResponded: false,
        createdAt: new Date(),
      };
    });

    // PASO 5: INSERTAR EL 100% DE LOS PARTICIPANTES
    const result = await prisma.$transaction(async (tx) => {
      await tx.participant.createMany({
        data: participantsToInsert,
        skipDuplicates: true
      });

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

    console.log(`✅ Carga completada: ${result.totalLoaded} participantes cargados`);
    
    return { 
      success: true, 
      totalLoaded: result.totalLoaded, 
      duplicatesInDB,
      unmappedDepartments: unmappedDepartments.length > 0 ? unmappedDepartments : undefined
    };

  } catch (error) {
    console.error('❌ Error loading participants to database:', error);
    return { 
      success: false, 
      totalLoaded: 0, 
      duplicatesInDB: 0, 
      error: error instanceof Error ? error.message : 'Error desconocido cargando participantes' 
    };
  }
}

// ============================================
// 🔧 HANDLER PRINCIPAL POST - CAMBIOS APLICADOS
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }  // ✅ CAMBIO: Agregar params
) {
  try {
    // ✅ AUTENTICACIÓN (sin cambios)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const verification = verifyJWTToken(token);
    if (!verification.success) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    // ✅ OBTENER campaignId desde params (CAMBIO)
    const campaignId = params.id;
    
    // ✅ AUTORIZACIÓN: Solo roles permitidos pueden cargar participantes
    // Obtener rol del payload (compatible con Account y User)
    const payload = verification.payload as any; // Type assertion para acceder a campos extendidos
    const userRole = payload?.userRole || payload?.role || 'CLIENT';
    
    const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR'];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { 
          error: 'No autorizado. Solo administradores y personal de RRHH pueden cargar participantes.',
          requiredRoles: allowedRoles,
          currentRole: userRole
        },
        { status: 403 }
      );
    }
    
    console.log(`✅ Upload autorizado para rol: ${userRole}`);
    
    // ✅ OBTENER formData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // ✅ VALIDACIÓN: campaignId debe existir
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID es requerido' },
        { status: 400 }
      );
    }

    // ✅ VALIDACIÓN: file y action requeridos
    if (!file || !action) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: file, action' },
        { status: 400 }
      );
    }

    // ✅ VERIFICAR CAMPAÑA
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

    // ✅ PROCESAR ARCHIVO
    const processingResult = await processFile(file);

    if (!processingResult.success) {
      return NextResponse.json({
        error: 'Error procesando archivo',
        details: processingResult.errors,
        ...processingResult
      }, { status: 400 });
    }

    // ✅ ACCIÓN: PREVIEW
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        message: 'Archivo procesado exitosamente',
        campaign: {
          id: campaign.id,
          name: campaign.name,
          company: campaign.account.companyName
        },
        participants: processingResult.participants,
        validRecords: processingResult.validRecords,
        errors: processingResult.errors,
        duplicates: processingResult.duplicates
      });
    }

    // ✅ ACCIÓN: CONFIRM
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

      const responseData: any = {
        success: true,
        message: `Participantes cargados exitosamente: ${loadResult.totalLoaded}`,
        totalLoaded: loadResult.totalLoaded,
        duplicatesInDB: loadResult.duplicatesInDB,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          company: campaign.account.companyName
        }
      };
      
      if (loadResult.unmappedDepartments && loadResult.unmappedDepartments.length > 0) {
        responseData.unmappedDepartments = loadResult.unmappedDepartments;
        responseData.unmappedCount = loadResult.unmappedDepartments.length;
        responseData.warningMessage = `${loadResult.unmappedDepartments.length} departamentos no reconocidos fueron asignados a "Departamentos sin Asignar"`;
        console.warn(`⚠️ Notificar a equipo Concierge - Cuenta ${campaign.account.companyName}: ${loadResult.unmappedDepartments.length} términos requieren mapeo manual`);
      }

      return NextResponse.json(responseData);
    }

    return NextResponse.json(
      { error: 'Acción no válida. Usa "preview" o "confirm"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in participants upload API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// ✅ MÉTODO GET ELIMINADO (Paso 1.7)
// El GET para listar participantes está en /api/campaigns/[id]/participants/route.ts
// Este archivo SOLO maneja la carga (POST)