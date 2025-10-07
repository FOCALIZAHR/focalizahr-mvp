// src/app/api/admin/participants/route.ts
// ✅ ACTUALIZADO CON RUT + PHONENUMBER
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWTToken } from '@/lib/auth'
import { z } from 'zod';
import { generateSecureToken } from '@/lib/utils';
import * as XLSX from 'xlsx';
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
      h && (h.toLowerCase().includes('name') || h.toLowerCase().includes('nombre'))
    );
    const departmentIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('department') || h.toLowerCase().includes('departamento'))
    );
    const positionIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('position') || h.toLowerCase().includes('cargo') || h.toLowerCase().includes('puesto'))
    );
    const locationIndex = headers.findIndex(h => 
      h && (h.toLowerCase().includes('location') || h.toLowerCase().includes('ubicacion') || h.toLowerCase().includes('ubicación'))
    );
    
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

    // ✅ CAMBIO 6: Validar RUT obligatorio (antes era email)
    if (rutIndex === -1) {
      result.errors.push('No se encontró columna de RUT en el archivo');
      return result;
    }

    // ✅ CAMBIO 7: Validar al menos email O phone
    if (emailIndex === -1 && phoneIndex === -1) {
      result.errors.push('Debe haber columna de Email o Celular');
      return result;
    }

    // ✅ CAMBIO 8: Procesar cada fila con RUT
    const rutsSeen = new Set<string>(); // ✅ CAMBIO: Set de RUTs en lugar de emails
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      const rowNumber = i + 2;
      
      if (!row || row.length === 0) continue;

      try {
        // ✅ CAMBIO 9: Extraer RUT, email y phone
        const nationalId = row[rutIndex]?.toString().trim();
        const email = emailIndex >= 0 ? row[emailIndex]?.toString().trim().toLowerCase() : undefined;
        const phoneNumber = phoneIndex >= 0 ? row[phoneIndex]?.toString().trim() : undefined;
        
        // ✅ CAMBIO 10: Validar RUT obligatorio
        if (!nationalId) {
          result.errors.push(`Fila ${rowNumber}: RUT vacío`);
          continue;
        }

        // ✅ CAMBIO 11: Validar formato RUT
        if (!validateRut(nationalId)) {
          result.errors.push(`Fila ${rowNumber}: RUT inválido (${nationalId})`);
          continue;
        }

        // ✅ CAMBIO 12: Normalizar RUT
        const normalizedRut = normalizeRut(nationalId);

        // ✅ CAMBIO 13: Validar al menos un canal de contacto
        if (!email && !phoneNumber) {
          result.errors.push(`Fila ${rowNumber}: Debe tener email O celular`);
          continue;
        }

        // ✅ CAMBIO 14: Normalizar phoneNumber (FLEXIBLE)
        let normalizedPhone: string | undefined = undefined;
        if (phoneNumber) {
          // Limpiar espacios, guiones, paréntesis
          const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

          // Detectar y normalizar diferentes formatos
          if (/^9\d{8}$/.test(cleaned)) {
            // Formato: 912345678 → +56912345678
            normalizedPhone = '+56' + cleaned;
          } else if (/^56\d{9}$/.test(cleaned)) {
            // Formato: 56912345678 → +56912345678
            normalizedPhone = '+' + cleaned;
          } else if (/^\+56\d{9}$/.test(cleaned)) {
            // Formato: +56912345678 → OK
            normalizedPhone = cleaned;
          } else if (/^\d{9}$/.test(cleaned)) {
            // Formato: 912345678 (sin 9 inicial) → +56912345678
            normalizedPhone = '+56' + cleaned;
          } else {
            // Formato no reconocido
            result.errors.push(`Fila ${rowNumber}: Formato celular inválido (${phoneNumber}). Formatos válidos: 912345678, 56912345678, +56912345678`);
            continue;
          }
        }

        // ✅ CAMBIO 15: Verificar duplicados por RUT (ADVERTIR, NO BLOQUEAR)
        if (rutsSeen.has(normalizedRut)) {
          result.duplicates++;
          result.errors.push(`Fila ${rowNumber}: RUT duplicado en archivo: ${normalizedRut} (se omitirá)`);
          continue; // Saltar duplicado pero seguir procesando
        }
        rutsSeen.add(normalizedRut);

        // ✅ CAMBIO 16: Crear objeto participante con TODOS los campos
        const participant = {
          nationalId: normalizedRut,
          email,
          phoneNumber: normalizedPhone,
          name: nameIndex >= 0 ? row[nameIndex]?.toString().trim() : undefined,
          department: departmentIndex >= 0 ? row[departmentIndex]?.toString().trim() : undefined,
          position: positionIndex >= 0 ? row[positionIndex]?.toString().trim() : undefined,
          location: locationIndex >= 0 ? row[locationIndex]?.toString().trim() : undefined,
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

// ✅ CAMBIO 17: Función actualizada con RUT + phone
async function loadParticipantsToDatabase(
  campaignId: string, 
  participants: Array<{
    nationalId: string;      // ✅ NUEVO
    email?: string;          // ✅ OPCIONAL
    phoneNumber?: string;    // ✅ NUEVO
    name?: string;
    department?: string;
    position?: string;
    location?: string;
    gender?: string;
    dateOfBirth?: Date;
    hireDate?: Date;
  }>
): Promise<{ 
  success: boolean; 
  totalLoaded: number; 
  duplicatesInDB: number; 
  unmappedDepartments?: string[];
  error?: string 
}> {
  
  try {
    // Verificar que la campaña existe y está en estado draft
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        id: true, 
        status: true, 
        totalInvited: true,
        accountId: true
      }
    });

    if (!campaign) {
      return { success: false, totalLoaded: 0, duplicatesInDB: 0, error: 'Campaña no encontrada' };
    }

    if (campaign.status !== 'draft') {
      return { success: false, totalLoaded: 0, duplicatesInDB: 0, error: 'Solo se pueden cargar participantes en campañas en estado draft' };
    }

    if (participants.length > 500) {
      return { success: false, totalLoaded: 0, duplicatesInDB: 0, error: 'Máximo 500 participantes permitidos por campaña' };
    }

    // ============= FLUJO DE CARGA TOLERANTE CON MAPEO DIFERIDO =============
    
    console.log('🚀 Iniciando Flujo de Carga Tolerante con Mapeo Diferido');
    
    // PASO 1: GARANTIZAR EL DEPARTAMENTO "PARAGUAS"
    let umbrellaDepId: string;
    
    const existingUmbrellaDep = await prisma.department.findFirst({
      where: {
        accountId: campaign.accountId,
        standardCategory: 'sin_asignar'
      },
      select: { id: true }
    });
    
    if (existingUmbrellaDep) {
      umbrellaDepId = existingUmbrellaDep.id;
      console.log('✅ Departamento paraguas existente encontrado:', umbrellaDepId);
    } else {
      const newUmbrellaDep = await prisma.department.create({
        data: {
          accountId: campaign.accountId,
          displayName: 'Departamentos sin Asignar',
          standardCategory: 'sin_asignar',
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'baja',
          emotionalComplexity: 'baja',
          marketScarcity: 'normal'
        }
      });
      umbrellaDepId = newUmbrellaDep.id;
      console.log('🆕 Departamento paraguas creado:', umbrellaDepId);
    }
    
    // PASO 2: MAPEAR DEPARTAMENTOS Y GERENCIAS VÁLIDAS
    const departmentNames = [...new Set(
      participants
        .map(p => p.department)
        .filter(Boolean) as string[]
    )];
    
    console.log(`📊 Total de unidades organizacionales únicas en CSV: ${departmentNames.length}`);
    
    const existingStructures = await prisma.department.findMany({
      where: {
        accountId: campaign.accountId,
        displayName: {
          in: departmentNames,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        displayName: true,
        unitType: true,
        level: true
      }
    });
    
    console.log(`✅ Encontradas ${existingStructures.length} estructuras existentes`);
    
    const departmentMapping: Record<string, string | null> = {};
    const structureMap = new Map(
      existingStructures.map(s => [s.displayName.toLowerCase(), s])
    );
    
    for (const deptName of departmentNames) {
      const structure = structureMap.get(deptName.toLowerCase());
      if (structure) {
        departmentMapping[deptName] = structure.id;
        console.log(`✅ Mapeado: "${deptName}" → ${structure.unitType} (${structure.id})`);
      } else {
        departmentMapping[deptName] = null;
        console.log(`⚠️ No encontrado: "${deptName}" → será asignado al paraguas`);
      }
    }
    
    // PASO 3: IDENTIFICAR Y REPORTAR DEPARTAMENTOS NO MAPEADOS
    const unmappedDepartments = departmentNames.filter(deptName => 
      !departmentMapping[deptName] || departmentMapping[deptName] === null
    );
    
    if (unmappedDepartments.length > 0) {
      console.warn(`⚠️ ${unmappedDepartments.length} términos no mapeados (serán asignados al paraguas):`, unmappedDepartments);
    }
    
    // ============= FIN FLUJO DE CARGA TOLERANTE =============

    // ✅ CAMBIO 18: Verificar duplicados por RUT (no email)
    const existingRuts = await prisma.participant.findMany({
      where: {
        campaignId,
        nationalId: { in: participants.map(p => p.nationalId) }
      },
      select: { nationalId: true }
    });

    const existingRutSet = new Set(existingRuts.map(p => p.nationalId));
    const newParticipants = participants.filter(p => !existingRutSet.has(p.nationalId));
    const duplicatesInDB = participants.length - newParticipants.length;

    if (newParticipants.length === 0) {
      return { 
        success: false, 
        totalLoaded: 0, 
        duplicatesInDB, 
        unmappedDepartments,
        error: 'Todos los participantes ya existen en la campaña' 
      };
    }

    // ✅ CAMBIO 19: ASIGNAR departmentId CON nationalId + phoneNumber
    const participantsToInsert = newParticipants.map(participant => {
      let assignedDepartmentId: string | null = null;
      
      if (participant.department) {
        assignedDepartmentId = departmentMapping[participant.department];
        
        if (!assignedDepartmentId) {
          assignedDepartmentId = umbrellaDepId;
          console.log(`🔄 Participante RUT ${participant.nationalId} con departamento "${participant.department}" → asignado al paraguas`);
        }
      } else {
        assignedDepartmentId = umbrellaDepId;
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
        gender: participant.gender || null,
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

// Handler principal POST (SIN CAMBIOS)
export async function POST(request: NextRequest) {
  try {
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
    const action = formData.get('action') as string;

    if (!file || !campaignId || !action) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: file, campaignId, action' },
        { status: 400 }
      );
    }

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

    const processingResult = await processFile(file);

    if (!processingResult.success) {
      return NextResponse.json({
        error: 'Error procesando archivo',
        details: processingResult.errors,
        ...processingResult
      }, { status: 400 });
    }

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

// Handler GET (SIN CAMBIOS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const withoutParticipants = searchParams.get('withoutParticipants') === 'true';

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