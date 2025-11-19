// src/hooks/useOnboardingBatchUpload.ts
// Hook custom para carga masiva Onboarding Journey Intelligence
// Reutiliza patrón de useMetricsUpload adaptado a API /api/onboarding/enroll/batch

'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useToast } from '@/components/ui/toast-system';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OnboardingEmployee {
  nationalId: string;
  fullName: string;
  participantEmail?: string;
  phoneNumber?: string;
  departmentId: string;
  departmentName?: string; // Para display
  hireDate: string;
  position?: string;
  location?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  dateOfBirth?: string;
  
  // Validación
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface UploadResult {
  index: number;
  nationalId: string;
  fullName: string;
  success: boolean;
  journeyId?: string;
  error?: string;
}

interface BatchUploadResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: UploadResult[];
}

type UploadState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'complete' | 'error';

interface UseOnboardingBatchUploadProps {
  onSuccess?: (result: BatchUploadResponse) => void;
  onError?: (error: string) => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useOnboardingBatchUpload({
  onSuccess,
  onError
}: UseOnboardingBatchUploadProps = {}) {
  const { success: showSuccess, error: showError } = useToast();
  const [state, setState] = useState<UploadState>('idle');
  const [employees, setEmployees] = useState<OnboardingEmployee[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BatchUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // ============================================================================
  // VALIDACIONES
  // ============================================================================
  
  /**
   * Validar RUT chileno (módulo 11)
   */
  const validateRUT = useCallback((rut: string): boolean => {
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
                       dvCalculado === 10 ? 'K' : 
                       dvCalculado.toString();
    
    return dv.toUpperCase() === dvEsperado;
  }, []);
  
  /**
   * Normalizar teléfono a formato +56912345678
   */
  const normalizePhone = useCallback((phone: string): string | undefined => {
    if (!phone) return undefined;
    
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Ya tiene +56
    if (cleaned.startsWith('+56') && cleaned.length === 12) {
      return cleaned;
    }
    
    // Solo tiene 56
    if (cleaned.startsWith('56') && cleaned.length === 11) {
      return `+${cleaned}`;
    }
    
    // Solo número (9 dígitos)
    if (cleaned.startsWith('9') && cleaned.length === 9) {
      return `+56${cleaned}`;
    }
    
    return phone; // Retornar original si no coincide
  }, []);
  
  /**
   * Parse fecha flexible (DD/MM/YYYY o YYYY-MM-DD)
   */
  const parseDate = useCallback((dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // YYYY-MM-DD (ya correcto)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // DD/MM/YYYY
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // DD-MM-YYYY
    const ddmmyyyyDashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
  }, []);
  
  /**
   * Mapear género a enum válido
   */
  const mapGender = useCallback((gender?: string): 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | undefined => {
    if (!gender) return undefined;
    
    const normalized = gender.trim().toUpperCase();
    
    // Mapeo de valores comunes
    const genderMap: Record<string, 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY'> = {
      'M': 'MALE',
      'MALE': 'MALE',
      'MASCULINO': 'MALE',
      'HOMBRE': 'MALE',
      'F': 'FEMALE',
      'FEMALE': 'FEMALE',
      'FEMENINO': 'FEMALE',
      'MUJER': 'FEMALE',
      'NB': 'NON_BINARY',
      'NON_BINARY': 'NON_BINARY',
      'NO BINARIO': 'NON_BINARY',
      'NS': 'PREFER_NOT_TO_SAY',
      'PREFER_NOT_TO_SAY': 'PREFER_NOT_TO_SAY',
      'PREFIERO NO DECIR': 'PREFER_NOT_TO_SAY'
    };
    
    return genderMap[normalized];
  }, []);
  
  /**
   * Validar empleado individual
   */
  const validateEmployee = useCallback((employee: Partial<OnboardingEmployee>, departments: Map<string, string>): OnboardingEmployee => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validar RUT
    if (!employee.nationalId) {
      errors.push('RUT es obligatorio');
    } else if (!validateRUT(employee.nationalId)) {
      errors.push('RUT inválido');
    }
    
    // Validar nombre
    if (!employee.fullName || employee.fullName.trim().length < 2) {
      errors.push('Nombre completo es obligatorio');
    }
    
    // Validar canal contacto
    if (!employee.participantEmail && !employee.phoneNumber) {
      errors.push('Debe proporcionar Email O Celular');
    }
    
    // Validar email si existe
    if (employee.participantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.participantEmail)) {
      errors.push('Email inválido');
    }
    
    // Validar teléfono si existe
    const normalizedPhone = employee.phoneNumber ? normalizePhone(employee.phoneNumber) : undefined;
    if (employee.phoneNumber && normalizedPhone && !/^\+56\d{9}$/.test(normalizedPhone)) {
      errors.push('Celular debe ser formato +56912345678');
    }
    
    // Validar departamento
    let resolvedDepartmentId = employee.departmentId;
    let departmentName = employee.departmentName;
    
    if (!resolvedDepartmentId && employee.departmentName) {
      // Intentar resolver por nombre
      const deptId = departments.get(employee.departmentName.trim().toLowerCase());
      if (deptId) {
        resolvedDepartmentId = deptId;
      } else {
        errors.push(`Departamento "${employee.departmentName}" no encontrado`);
      }
    }
    
    if (!resolvedDepartmentId) {
      errors.push('Departamento es obligatorio');
    }
    
    // Validar fecha ingreso
    const parsedHireDate = employee.hireDate ? parseDate(employee.hireDate) : null;
    if (!parsedHireDate) {
      errors.push('Fecha ingreso es obligatoria y debe ser válida');
    } else {
      const hireDate = new Date(parsedHireDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (hireDate > today) {
        errors.push('Fecha ingreso no puede ser futura');
      }
    }
    
    // Validar fecha nacimiento si existe
    let parsedDateOfBirth: string | undefined;
    if (employee.dateOfBirth) {
      parsedDateOfBirth = parseDate(employee.dateOfBirth) || undefined;
      if (!parsedDateOfBirth) {
        warnings.push('Fecha nacimiento inválida (se omitirá)');
      }
    }
    
    // Mapear género
    const mappedGender = employee.gender ? mapGender(employee.gender) : undefined;
    if (employee.gender && !mappedGender) {
      warnings.push(`Género "${employee.gender}" no reconocido (se omitirá)`);
    }
    
    return {
      nationalId: employee.nationalId || '',
      fullName: employee.fullName || '',
      participantEmail: employee.participantEmail,
      phoneNumber: normalizedPhone,
      departmentId: resolvedDepartmentId || '',
      departmentName,
      hireDate: parsedHireDate || '',
      position: employee.position,
      location: employee.location,
      gender: mappedGender,
      dateOfBirth: parsedDateOfBirth,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [validateRUT, normalizePhone, parseDate, mapGender]);
  
  // ============================================================================
  // PARSE CSV
  // ============================================================================
  
  /**
   * Procesar archivo CSV
   */
  const parseFile = useCallback(async (uploadedFile: File, departments: Map<string, string>) => {
    setState('parsing');
    setFile(uploadedFile);
    setError(null);
    
    try {
      const text = await uploadedFile.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalizar headers
          const normalized = header.trim().toLowerCase();
          
          const headerMap: Record<string, string> = {
            'rut': 'nationalId',
            'nombre': 'fullName',
            'nombre completo': 'fullName',
            'email': 'participantEmail',
            'correo': 'participantEmail',
            'celular': 'phoneNumber',
            'telefono': 'phoneNumber',
            'teléfono': 'phoneNumber',
            'departamento': 'departmentName',
            'department': 'departmentName',
            'departmentid': 'departmentId',
            'fecha ingreso': 'hireDate',
            'fechaingreso': 'hireDate',
            'hiredate': 'hireDate',
            'cargo': 'position',
            'position': 'position',
            'ubicacion': 'location',
            'ubicación': 'location',
            'location': 'location',
            'genero': 'gender',
            'género': 'gender',
            'gender': 'gender',
            'fecha nacimiento': 'dateOfBirth',
            'fechanacimiento': 'dateOfBirth',
            'dateofbirth': 'dateOfBirth'
          };
          
          return headerMap[normalized] || header;
        },
        complete: (results) => {
          const parsedEmployees = results.data
            .filter((row: any) => row.nationalId || row.fullName) // Filtrar filas vacías
            .map((row: any) => validateEmployee(row, departments));
          
          setEmployees(parsedEmployees);
          setState('preview');
        },
        error: (error: Error) => {
          setError(`Error parseando CSV: ${error.message}`);
          setState('error');
          onError?.(`Error parseando CSV: ${error.message}`);
        }
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      setState('error');
      onError?.(errorMsg);
    }
  }, [validateEmployee, onError]);
  
  // ============================================================================
  // UPLOAD TO API
  // ============================================================================
  
  /**
   * Confirmar y subir empleados válidos a API batch
   */
  const confirmUpload = useCallback(async () => {
    const validEmployees = employees.filter(e => e.isValid);
    
    if (validEmployees.length === 0) {
      setError('No hay empleados válidos para cargar');
      return;
    }
    
    setState('uploading');
    setUploadProgress(0);
    setError(null);
    
    try {
      // Preparar payload para API
      const payload = {
        employees: validEmployees.map(e => ({
          nationalId: e.nationalId,
          fullName: e.fullName,
          participantEmail: e.participantEmail,
          phoneNumber: e.phoneNumber,
          departmentId: e.departmentId,
          hireDate: e.hireDate,
          position: e.position,
          location: e.location,
          gender: e.gender,
          dateOfBirth: e.dateOfBirth
        }))
      };
      
      // Simular progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch('/api/onboarding/enroll/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
     if (!response.ok) {
  const errorData = await response.json();
  
  // Mostrar error detallado si hay
         if (errorData.details && errorData.details.length > 0) {
             const errores = errorData.details
                 .map((d: any) => `• ${d.message}`)
                 .join('\n');
             const errorMessage = `Errores de validación:\n${errores}`;
             showError(errorMessage, 'Error de Validación');
             throw new Error(errorMessage);
         }

         const errorMessage = errorData.error || `Error HTTP ${response.status}`;
         showError(errorMessage, 'Error en Carga');
         throw new Error(errorMessage);
     }
      
      const result: BatchUploadResponse = await response.json();
        // Mostrar Toast de éxito
        showSuccess(
            `${result.successCount} colaborador(es) inscrito(s) exitosamente de ${result.totalProcessed}`,
            '¡Carga Completa!'
        );
      setUploadResult(result);
      setState('complete');
      onSuccess?.(result);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      setState('error');
      onError?.(errorMsg);
    }
  }, [employees, onSuccess, onError]);
  
  // ============================================================================
  // RESET
  // ============================================================================
  
  const reset = useCallback(() => {
    setState('idle');
    setEmployees([]);
    setFile(null);
    setUploadResult(null);
    setError(null);
    setUploadProgress(0);
  }, []);
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const validCount = employees.filter(e => e.isValid).length;
  const invalidCount = employees.filter(e => !e.isValid).length;
  const canUpload = state === 'preview' && validCount > 0;
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // State
    state,
    employees,
    file,
    uploadResult,
    error,
    uploadProgress,
    
    // Computed
    validCount,
    invalidCount,
    canUpload,
    
    // Actions
    parseFile,
    confirmUpload,
    reset
  };
}