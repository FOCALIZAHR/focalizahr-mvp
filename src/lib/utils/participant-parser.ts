// ====================================================================
// FOCALIZAHR PARTICIPANTUPLOADER v2.0 - MOTOR DE PARSEO
// src/lib/utils/participant-parser.ts
// FASE 2.1: Pure Functions Parser - Arquitectura 3 Capas
// ====================================================================

import * as XLSX from 'xlsx';
import { z } from 'zod';

// ✅ TIPOS EXTENDIDOS PARA DEMOGRAFÍA
export interface ParticipantData {
  email: string;
  name?: string;
  department?: string;
  position?: string;
  location?: string;
  // ✅ NUEVOS CAMPOS DEMOGRÁFICOS
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
}

export interface ParsingResult {
  success: boolean;
  totalProcessed: number;
  validRecords: number;
  duplicates: number;
  errors: string[];
  participants: ParticipantData[];
  demographicsDetected: {
    hasDateOfBirth: boolean;
    hasGender: boolean;
    genderDistribution?: Record<string, number>;
    ageRanges?: Record<string, number>;
  };
}

// ✅ SCHEMA VALIDACIÓN EXTENDIDO
const participantSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional(),
});

// ✅ HEADER MAPPING INTELIGENTE EXTENDIDO
interface HeaderMapping {
  emailIndex: number;
  nameIndex: number;
  departmentIndex: number;
  positionIndex: number;
  locationIndex: number;
  // ✅ NUEVOS MAPEOS DEMOGRÁFICOS
  dateOfBirthIndex: number;
  genderIndex: number;
}

/**
 * 🎯 FUNCIÓN PRINCIPAL: PARSEAR ARCHIVO CSV/EXCEL
 * Pure function que procesa archivos y retorna ParticipantData[]
 */
export async function parseParticipantsFile(file: File): Promise<ParsingResult> {
  const result: ParsingResult = {
    success: false,
    totalProcessed: 0,
    validRecords: 0,
    duplicates: 0,
    errors: [],
    participants: [],
    demographicsDetected: {
      hasDateOfBirth: false,
      hasGender: false,
      genderDistribution: {},
      ageRanges: {},
    }
  };

  try {
    // ✅ STEP 1: LEER ARCHIVO SEGÚN TIPO
    const buffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const csvData = new TextDecoder().decode(buffer);
      workbook = XLSX.read(csvData, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'array' });
    }

    // ✅ STEP 2: EXTRAER DATOS PRIMERA HOJA
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

    // ✅ STEP 3: DETECTAR HEADERS INTELIGENTE
    const headers = jsonData[0] as string[];
    const mapping = detectHeaderMapping(headers);
    const dataRows = jsonData.slice(1);

    result.totalProcessed = dataRows.length;

    // ✅ STEP 4: PROCESAR CADA FILA CON VALIDACIÓN
    const processedParticipants: ParticipantData[] = [];
    const seenEmails = new Set<string>();
    let duplicatesInFile = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      
      try {
        // Extraer datos básicos
        const rawParticipant = {
          email: getColumnValue(row, mapping.emailIndex)?.toString().trim(),
          name: getColumnValue(row, mapping.nameIndex)?.toString().trim(),
          department: getColumnValue(row, mapping.departmentIndex)?.toString().trim(),
          position: getColumnValue(row, mapping.positionIndex)?.toString().trim(),
          location: getColumnValue(row, mapping.locationIndex)?.toString().trim(),
        };

        // ✅ PROCESAR DEMOGRAFÍA EXTENDIDA
        const dateOfBirthRaw = getColumnValue(row, mapping.dateOfBirthIndex);
        const genderRaw = getColumnValue(row, mapping.genderIndex)?.toString().trim();

        // Procesar fecha de nacimiento
        let dateOfBirth: Date | undefined;
        if (dateOfBirthRaw) {
          dateOfBirth = parseDate(dateOfBirthRaw);
        }

        // Procesar género
        let gender: ParticipantData['gender'];
        if (genderRaw) {
          gender = parseGender(genderRaw);
        }

        const participant: ParticipantData = {
          ...rawParticipant,
          dateOfBirth,
          gender,
        };

        // ✅ VALIDACIÓN ZOD
        const validation = participantSchema.safeParse(participant);
        if (!validation.success) {
          result.errors.push(`Fila ${i + 2}: ${validation.error.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        // ✅ DETECTAR DUPLICADOS EN ARCHIVO
        if (participant.email && seenEmails.has(participant.email)) {
          duplicatesInFile++;
          result.errors.push(`Fila ${i + 2}: Email duplicado en archivo: ${participant.email}`);
          continue;
        }

        if (participant.email) {
          seenEmails.add(participant.email);
        }

        processedParticipants.push(participant);
        result.validRecords++;

      } catch (error) {
        result.errors.push(`Fila ${i + 2}: Error procesando - ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // ✅ STEP 5: ANÁLISIS DEMOGRÁFICO
    result.demographicsDetected = analyzeDemographics(processedParticipants);
    result.participants = processedParticipants;
    result.duplicates = duplicatesInFile;
    result.success = result.validRecords > 0;

    return result;

  } catch (error) {
    result.errors.push(`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return result;
  }
}

// ✅ FUNCIONES AUXILIARES INTELIGENTES

/**
 * Detecta automáticamente el mapeo de columnas en headers
 */
function detectHeaderMapping(headers: string[]): HeaderMapping {
  const mapping: HeaderMapping = {
    emailIndex: -1,
    nameIndex: -1,
    departmentIndex: -1,
    positionIndex: -1,
    locationIndex: -1,
    dateOfBirthIndex: -1,
    genderIndex: -1,
  };

  headers.forEach((header, index) => {
    if (!header) return;
    
    const h = header.toLowerCase().trim();
    
    // Email patterns
    if (h.includes('email') || h.includes('correo') || h.includes('mail')) {
      mapping.emailIndex = index;
    }
    // Name patterns
    else if (h.includes('name') || h.includes('nombre') || h.includes('nom')) {
      mapping.nameIndex = index;
    }
    // Department patterns
    else if (h.includes('department') || h.includes('departamento') || h.includes('area') || h.includes('equipo')) {
      mapping.departmentIndex = index;
    }
    // Position patterns
    else if (h.includes('position') || h.includes('cargo') || h.includes('puesto') || h.includes('rol')) {
      mapping.positionIndex = index;
    }
    // Location patterns
    else if (h.includes('location') || h.includes('ubicacion') || h.includes('ciudad') || h.includes('oficina')) {
      mapping.locationIndex = index;
    }
    // ✅ DATE OF BIRTH PATTERNS
    else if (h.includes('fecha') && (h.includes('nacimiento') || h.includes('birth')) || 
             h.includes('birthday') || h.includes('age') || h.includes('edad')) {
      mapping.dateOfBirthIndex = index;
    }
    // ✅ GENDER PATTERNS  
    else if (h.includes('gender') || h.includes('genero') || h.includes('género') || h.includes('sexo')) {
      mapping.genderIndex = index;
    }
  });

  return mapping;
}

/**
 * Obtiene valor de columna manejando índices inválidos
 */
function getColumnValue(row: any[], index: number): any {
  if (index === -1 || index >= row.length) return undefined;
  const value = row[index];
  return value !== null && value !== undefined && value !== '' ? value : undefined;
}

/**
 * Parsea fecha flexible (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
 */
function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  try {
    // Si es un número de Excel (días desde 1900)
    if (typeof value === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
      return isValidDate(date) ? date : undefined;
    }
    
    // Si es string, intentar varios formatos
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // Formato DD/MM/YYYY o DD-MM-YYYY
      const ddmmyyyy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(dateStr);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isValidDate(date) ? date : undefined;
      }
      
      // Formato YYYY-MM-DD
      const yyyymmdd = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(dateStr);
      if (yyyymmdd) {
        const [, year, month, day] = yyyymmdd;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isValidDate(date) ? date : undefined;
      }
    }
    
    // Fallback: usar constructor Date
    const date = new Date(value);
    return isValidDate(date) ? date : undefined;
    
  } catch {
    return undefined;
  }
}

/**
 * Parsea género con variaciones comunes
 */
function parseGender(value: string): ParticipantData['gender'] | undefined {
  if (!value) return undefined;
  
  const normalized = value.toLowerCase().trim();
  
  if (['m', 'male', 'masculino', 'hombre', 'man'].includes(normalized)) {
    return 'MALE';
  }
  
  if (['f', 'female', 'femenino', 'mujer', 'woman'].includes(normalized)) {
    return 'FEMALE';
  }
  
  if (['nb', 'non-binary', 'no binario', 'nobinario', 'other', 'otro'].includes(normalized)) {
    return 'NON_BINARY';
  }
  
  if (['prefer not to say', 'prefiero no decir', 'no especifica', 'n/a'].includes(normalized)) {
    return 'PREFER_NOT_TO_SAY';
  }
  
  return undefined;
}

/**
 * Valida que una fecha sea válida
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.getFullYear() > 1900 && date.getFullYear() < 2030;
}

/**
 * Analiza distribución demográfica de participantes
 */
function analyzeDemographics(participants: ParticipantData[]) {
  const analysis = {
    hasDateOfBirth: false,
    hasGender: false,
    genderDistribution: {} as Record<string, number>,
    ageRanges: {} as Record<string, number>,
  };

  participants.forEach(p => {
    // Analizar fechas de nacimiento
    if (p.dateOfBirth) {
      analysis.hasDateOfBirth = true;
      const age = new Date().getFullYear() - p.dateOfBirth.getFullYear();
      const ageRange = getAgeRange(age);
      analysis.ageRanges[ageRange] = (analysis.ageRanges[ageRange] || 0) + 1;
    }

    // Analizar géneros
    if (p.gender) {
      analysis.hasGender = true;
      analysis.genderDistribution[p.gender] = (analysis.genderDistribution[p.gender] || 0) + 1;
    }
  });

  return analysis;
}

/**
 * Categoriza edad en rangos para análisis
 */
function getAgeRange(age: number): string {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
}