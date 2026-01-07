// src/hooks/useExitBatchUpload.ts
// Hook custom para carga masiva Exit Intelligence
// Adaptado de useOnboardingBatchUpload para el producto Exit

'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useToast } from '@/components/ui/toast-system';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// 13 valores de exitReason para análisis "Hipótesis RRHH vs Realidad"
export type ExitReason = 
  | 'mejor_oportunidad' 
  | 'compensacion' 
  | 'crecimiento_carrera'
  | 'balance_vida_trabajo' 
  | 'mal_clima' 
  | 'problemas_liderazgo'
  | 'relocalizacion' 
  | 'motivos_personales' 
  | 'estudios' 
  | 'salud'
  | 'abandono_trabajo' 
  | 'jubilacion' 
  | 'otro';

export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  'mejor_oportunidad': 'Mejor oportunidad laboral',
  'compensacion': 'Compensación / Sueldo',
  'crecimiento_carrera': 'Falta de crecimiento',
  'balance_vida_trabajo': 'Balance vida-trabajo',
  'mal_clima': 'Mal clima laboral',
  'problemas_liderazgo': 'Problemas con liderazgo',
  'relocalizacion': 'Relocalización geográfica',
  'motivos_personales': 'Motivos personales',
  'estudios': 'Estudios / Formación',
  'salud': 'Motivos de salud',
  'abandono_trabajo': 'Abandono de trabajo',
  'jubilacion': 'Jubilación',
  'otro': 'Otro motivo'
};

interface ExitEmployee {
  nationalId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  departmentId: string;
  departmentName?: string;
  exitDate: string;
  exitReason?: ExitReason;
  position?: string;
  
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
  exitRecordId?: string;
  error?: string;
}

interface BatchUploadResponse {
  success: boolean;
  total: number;
  processed: number;
  failed: number;
  results: Array<{
    nationalId: string;
    success: boolean;
    exitRecordId?: string;
    error?: string;
  }>;
}

type UploadState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'complete' | 'error';

interface UseExitBatchUploadProps {
  onSuccess?: (result: BatchUploadResponse) => void;
  onError?: (error: string) => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useExitBatchUpload({
  onSuccess,
  onError
}: UseExitBatchUploadProps = {}) {
  const { success: showSuccess, error: showError } = useToast();
  const [state, setState] = useState<UploadState>('idle');
  const [employees, setEmployees] = useState<ExitEmployee[]>([]);
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
                       dvCalculado === 10 ? 'k' : 
                       dvCalculado.toString();
    
    return dv.toLowerCase() === dvEsperado;
  }, []);
  
  /**
   * Normalizar RUT a formato estándar (12345678-9)
   */
  const normalizeRUT = useCallback((rut: string): string => {
    if (!rut) return '';
    
    const cleaned = rut.replace(/[.\s]/g, '').trim();
    const match = /^(\d{7,8})-?([\dkK])$/.exec(cleaned);
    
    if (!match) return cleaned;
    
    const [, num, dv] = match;
    return `${num}-${dv.toUpperCase()}`;
  }, []);
  
  /**
   * Normalizar teléfono a formato +56XXXXXXXXX
   */
  const normalizePhone = useCallback((phone: string): string | undefined => {
    if (!phone) return undefined;
    
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (/^9\d{8}$/.test(cleaned)) {
      return `+56${cleaned}`;
    }
    if (/^56\d{9}$/.test(cleaned)) {
      return `+${cleaned}`;
    }
    if (/^\+56\d{9}$/.test(cleaned)) {
      return cleaned;
    }
    
    return undefined;
  }, []);
  
  /**
   * Parsear fecha desde múltiples formatos
   */
  const parseDate = useCallback((dateStr: string): string | null => {
    if (!dateStr) return null;
    
    const trimmed = dateStr.trim();
    
    // Formato ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const date = new Date(trimmed);
      return isNaN(date.getTime()) ? null : trimmed;
    }
    
    // Formato DD/MM/YYYY o DD-MM-YYYY
    const dmyMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Formato MM/DD/YYYY (US)
    const mdyMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      // Si month > 12, probablemente es DD/MM/YYYY
      if (monthNum <= 12 && dayNum <= 31) {
        const date = new Date(parseInt(year), monthNum - 1, dayNum);
        if (!isNaN(date.getTime())) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }, []);
  
  /**
   * Mapear exitReason desde texto libre
   */
  const mapExitReason = useCallback((reason: string): ExitReason | undefined => {
    if (!reason) return undefined;
    
    const normalized = reason.trim().toLowerCase();
    
    const reasonMap: Record<string, ExitReason> = {
      // Mejor oportunidad
      'mejor_oportunidad': 'mejor_oportunidad',
      'mejor oportunidad': 'mejor_oportunidad',
      'nueva oportunidad': 'mejor_oportunidad',
      'mejor oferta': 'mejor_oportunidad',
      'oportunidad laboral': 'mejor_oportunidad',
      
      // Compensación
      'compensacion': 'compensacion',
      'compensación': 'compensacion',
      'sueldo': 'compensacion',
      'salario': 'compensacion',
      'remuneracion': 'compensacion',
      'remuneración': 'compensacion',
      
      // Crecimiento carrera
      'crecimiento_carrera': 'crecimiento_carrera',
      'crecimiento': 'crecimiento_carrera',
      'falta de crecimiento': 'crecimiento_carrera',
      'sin crecimiento': 'crecimiento_carrera',
      'desarrollo profesional': 'crecimiento_carrera',
      
      // Balance vida-trabajo
      'balance_vida_trabajo': 'balance_vida_trabajo',
      'balance': 'balance_vida_trabajo',
      'vida personal': 'balance_vida_trabajo',
      'calidad de vida': 'balance_vida_trabajo',
      
      // Mal clima
      'mal_clima': 'mal_clima',
      'clima laboral': 'mal_clima',
      'mal ambiente': 'mal_clima',
      'ambiente toxico': 'mal_clima',
      'ambiente tóxico': 'mal_clima',
      
      // Problemas liderazgo
      'problemas_liderazgo': 'problemas_liderazgo',
      'liderazgo': 'problemas_liderazgo',
      'jefatura': 'problemas_liderazgo',
      'mal jefe': 'problemas_liderazgo',
      'conflicto con jefe': 'problemas_liderazgo',
      
      // Relocalización
      'relocalizacion': 'relocalizacion',
      'relocalización': 'relocalizacion',
      'mudanza': 'relocalizacion',
      'cambio de ciudad': 'relocalizacion',
      'cambio de pais': 'relocalizacion',
      'cambio de país': 'relocalizacion',
      
      // Motivos personales
      'motivos_personales': 'motivos_personales',
      'personal': 'motivos_personales',
      'familia': 'motivos_personales',
      'motivos familiares': 'motivos_personales',
      
      // Estudios
      'estudios': 'estudios',
      'estudio': 'estudios',
      'universidad': 'estudios',
      'postgrado': 'estudios',
      'formacion': 'estudios',
      'formación': 'estudios',
      
      // Salud
      'salud': 'salud',
      'enfermedad': 'salud',
      'motivos de salud': 'salud',
      'licencia medica': 'salud',
      'licencia médica': 'salud',
      
      // Abandono
      'abandono_trabajo': 'abandono_trabajo',
      'abandono': 'abandono_trabajo',
      'desercion': 'abandono_trabajo',
      'deserción': 'abandono_trabajo',
      'no se presento': 'abandono_trabajo',
      'no se presentó': 'abandono_trabajo',
      
      // Jubilación
      'jubilacion': 'jubilacion',
      'jubilación': 'jubilacion',
      'retiro': 'jubilacion',
      'pension': 'jubilacion',
      'pensión': 'jubilacion',
      
      // Otro
      'otro': 'otro',
      'otros': 'otro',
      'other': 'otro',
      'n/a': 'otro',
      'na': 'otro'
    };
    
    return reasonMap[normalized];
  }, []);
  
  /**
   * Validar empleado individual
   */
  const validateEmployee = useCallback((
    employee: Partial<ExitEmployee>, 
    departments: Map<string, string>
  ): ExitEmployee => {
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
    
    // Validar canal contacto (email O phone obligatorio)
    if (!employee.email && !employee.phoneNumber) {
      errors.push('Debe proporcionar Email O Celular');
    }
    
    // Validar email si existe
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.push('Email inválido');
    }
    
    // Validar teléfono si existe
    const normalizedPhone = employee.phoneNumber ? normalizePhone(employee.phoneNumber) : undefined;
    if (employee.phoneNumber && !normalizedPhone) {
      errors.push('Celular debe ser formato +56912345678');
    }
    
    // Validar departamento
    let resolvedDepartmentId = employee.departmentId;
    const departmentName = employee.departmentName;
    
    if (!resolvedDepartmentId && employee.departmentName) {
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
    
    // Validar fecha salida (obligatoria, formato válido)
    const parsedExitDate = employee.exitDate ? parseDate(employee.exitDate) : null;
    if (!parsedExitDate) {
      errors.push('Fecha de salida es obligatoria y debe ser válida');
    }
    
    // Mapear exitReason si existe
    let mappedExitReason: ExitReason | undefined;
    if (employee.exitReason) {
      mappedExitReason = mapExitReason(employee.exitReason as string);
      if (!mappedExitReason) {
        warnings.push(`Motivo "${employee.exitReason}" no reconocido (se omitirá)`);
      }
    }
    
    return {
      nationalId: employee.nationalId ? normalizeRUT(employee.nationalId) : '',
      fullName: employee.fullName || '',
      email: employee.email?.toLowerCase().trim(),
      phoneNumber: normalizedPhone,
      departmentId: resolvedDepartmentId || '',
      departmentName,
      exitDate: parsedExitDate || '',
      exitReason: mappedExitReason,
      position: employee.position?.trim(),
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [validateRUT, normalizeRUT, normalizePhone, parseDate, mapExitReason]);
  
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
          const normalized = header.trim().toLowerCase();
          
          const headerMap: Record<string, string> = {
            // RUT
            'rut': 'nationalId',
            'nationalid': 'nationalId',
            'national_id': 'nationalId',
            
            // Nombre
            'nombre': 'fullName',
            'nombre completo': 'fullName',
            'fullname': 'fullName',
            'full_name': 'fullName',
            
            // Email
            'email': 'email',
            'correo': 'email',
            'correo electronico': 'email',
            'correo electrónico': 'email',
            
            // Teléfono
            'celular': 'phoneNumber',
            'telefono': 'phoneNumber',
            'teléfono': 'phoneNumber',
            'phonenumber': 'phoneNumber',
            'phone': 'phoneNumber',
            
            // Departamento
            'departamento': 'departmentName',
            'department': 'departmentName',
            'area': 'departmentName',
            'área': 'departmentName',
            'departmentid': 'departmentId',
            
            // Fecha salida
            'fecha salida': 'exitDate',
            'fechasalida': 'exitDate',
            'fecha_salida': 'exitDate',
            'fecha desvinculacion': 'exitDate',
            'fecha desvinculación': 'exitDate',
            'fecha egreso': 'exitDate',
            'exitdate': 'exitDate',
            'exit_date': 'exitDate',
            
            // Motivo salida
            'motivo': 'exitReason',
            'motivo salida': 'exitReason',
            'motivo_salida': 'exitReason',
            'razon': 'exitReason',
            'razón': 'exitReason',
            'exitreason': 'exitReason',
            'exit_reason': 'exitReason',
            
            // Cargo
            'cargo': 'position',
            'position': 'position',
            'puesto': 'position'
          };
          
          return headerMap[normalized] || header;
        },
        complete: (results) => {
          const parsedEmployees = results.data
            .filter((row: any) => row.nationalId || row.fullName)
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
      setError('No hay registros válidos para cargar');
      return;
    }
    
    setState('uploading');
    setUploadProgress(0);
    setError(null);
    
    try {
      // Preparar payload para API Exit
      const payload = {
        exits: validEmployees.map(e => ({
          nationalId: e.nationalId,
          fullName: e.fullName,
          email: e.email,
          phoneNumber: e.phoneNumber,
          departmentId: e.departmentId,
          exitDate: e.exitDate,
          exitReason: e.exitReason,
          position: e.position
        }))
      };
      
      // Simular progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch('/api/exit/register/batch', {
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
        
        if (errorData.validationErrors && errorData.validationErrors.length > 0) {
          const errores = errorData.validationErrors
            .map((d: any) => `• ${d.nationalId}: ${d.errors?.join(', ') || d.error}`)
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
      
      showSuccess(
        `${result.processed} salida(s) registrada(s) exitosamente de ${result.total}`,
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
  }, [employees, onSuccess, onError, showSuccess, showError]);
  
  // ============================================================================
  // DOWNLOAD TEMPLATE
  // ============================================================================
  
  /**
   * Descargar plantilla CSV
   */
  const downloadTemplate = useCallback(() => {
    const headers = [
      'RUT',
      'Nombre',
      'Email',
      'Celular',
      'Departamento',
      'Fecha Salida',
      'Motivo',
      'Cargo'
    ];
    
    const exampleRows = [
      [
        '12345678-9',
        'Juan Pérez González',
        'juan.perez@empresa.com',
        '+56912345678',
        'Ventas',
        '2025-01-15',
        'mejor_oportunidad',
        'Ejecutivo Comercial'
      ],
      [
        '16608325-7',
        'María González Silva',
        'maria.gonzalez@empresa.com',
        '912345679',
        'Marketing',
        '15/01/2025',
        'crecimiento_carrera',
        'Analista Marketing'
      ],
      [
        '11843233-9',
        'Carlos López Muñoz',
        '',
        '+56923456789',
        'Tecnología',
        '2025-01-20',
        'compensacion',
        'Desarrollador Senior'
      ]
    ];
    
    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_salidas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);
  
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
    downloadTemplate,
    reset
  };
}

// Export types
export type { ExitEmployee, BatchUploadResponse, UploadState };