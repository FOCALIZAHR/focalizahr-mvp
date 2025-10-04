// ============================================
// HOOK: useMetricsUpload
// Gestión completa upload métricas departamentales
// CON SOPORTE targetAccountId para admin
// ============================================

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast-system';

// ============================================
// TIPOS
// ============================================

interface MetricData {
  costCenterCode: string;
  period: string;
  turnoverRate?: number;
  absenceRate?: number;
  issueCount?: number;
  overtimeHoursTotal?: number;
  overtimeHoursAvg?: number;
  headcountAvg?: number;
  turnoverCount?: number;
  absenceDaysTotal?: number;
  workingDaysTotal?: number;
  overtimeEmployeeCount?: number;
  notes?: string;
}

interface PreviewData extends MetricData {
  departmentName?: string;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface UploadResult {
  success: boolean;
  message?: string;
  missingCostCenterCodes?: string[];
  results?: Array<{
    success: boolean;
    departmentId?: string;
    period?: string;
    action?: 'created' | 'updated';
    message?: string;
    error?: string;
  }>;
}

interface UploadHistory {
  id: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  periodType: string;
  uploadedBy: string;
  uploadedAt: Date;
  uploadMethod: string;
  dataQuality: string;
  department: {
    displayName: string;
    costCenterCode: string;
  };
  turnoverRate?: number;
  absenceRate?: number;
  issueCount?: number;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useMetricsUpload(accountId?: string, userRole?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { success, error, warning, info } = useToast();

  // ============================================
  // PREVIEW DATOS (Sin guardar en BD)
  // ============================================

  const previewMetrics = useCallback(async (metrics: MetricData[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Validación básica client-side
      const validated = metrics.map(metric => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validar campos requeridos
        if (!metric.costCenterCode) {
          errors.push('Centro de costos requerido');
        }
        if (!metric.period) {
          errors.push('Período requerido');
        }

        // Validar al menos 1 KPI
        const hasKPI = metric.turnoverRate !== undefined || 
                      metric.absenceRate !== undefined || 
                      metric.issueCount !== undefined || 
                      metric.overtimeHoursTotal !== undefined;
        
        if (!hasKPI) {
          errors.push('Debe incluir al menos 1 KPI');
        }

        // Validar rangos
        if (metric.turnoverRate !== undefined && (metric.turnoverRate < 0 || metric.turnoverRate > 100)) {
          errors.push('Rotación debe estar entre 0-100%');
        }
        if (metric.absenceRate !== undefined && (metric.absenceRate < 0 || metric.absenceRate > 100)) {
          errors.push('Ausentismo debe estar entre 0-100%');
        }

        // Warnings
        if (metric.turnoverRate && metric.turnoverRate > 50) {
          warnings.push('Rotación muy alta (>50%)');
        }
        if (metric.absenceRate && metric.absenceRate > 15) {
          warnings.push('Ausentismo elevado (>15%)');
        }

        return {
          ...metric,
          validation: {
            valid: errors.length === 0,
            errors,
            warnings
          }
        };
      });

      setPreviewData(validated);

      const totalErrors = validated.reduce((sum, m) => sum + (m.validation?.errors.length || 0), 0);
      const totalWarnings = validated.reduce((sum, m) => sum + (m.validation?.warnings.length || 0), 0);

      if (totalErrors > 0) {
        error(`Se encontraron ${totalErrors} errores de validación`, 'Validación Fallida');
        return false;
      }

      if (totalWarnings > 0) {
        warning(`${totalWarnings} advertencias detectadas. Revisa los datos antes de confirmar.`, 'Advertencias');
      } else {
        success(`${validated.length} métricas validadas correctamente`, 'Preview Listo');
      }

      return true;

    } catch (err) {
      console.error('Preview error:', err);
      error('Error al validar métricas. Verifica el formato del archivo.', 'Error Preview');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [success, error, warning]);

  // ============================================
  // CONFIRMAR UPLOAD (Guardar en BD)
  // ============================================

  const confirmUpload = useCallback(async (): Promise<boolean> => {
    if (previewData.length === 0) {
      warning('No hay datos para confirmar', 'Sin Datos');
      return false;
    }

    setIsLoading(true);
    try {
      // Filtrar solo métricas válidas
      const validMetrics = previewData
        .filter(m => m.validation?.valid)
        .map(({ validation, departmentName, ...metric }) => metric);

      if (validMetrics.length === 0) {
        error('No hay métricas válidas para cargar', 'Validación');
        return false;
      }

      // ✅ CAMBIO CRÍTICO: Agregar targetAccountId al payload
      // ✅ CONSTRUCCIÓN CONDICIONAL DEL PAYLOAD
      const basePayload = validMetrics.length === 1 
        ? validMetrics[0]
        : { metrics: validMetrics };

      // Solo agregar targetAccountId si es FOCALIZAHR_ADMIN
      const payload = userRole === 'FOCALIZAHR_ADMIN' && accountId
        ? { ...basePayload, targetAccountId: accountId }
        : basePayload;

      const response = await fetch('/api/department-metrics/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data: UploadResult = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar métricas');
      }

      if (data.success) {
        const successCount = data.results?.filter(r => r.success).length || 0;
        const failCount = data.results?.filter(r => !r.success).length || 0;

        if (failCount === 0) {
          success(
            `${successCount} métricas cargadas exitosamente`,
            '¡Completado!'
          );
        } else {
          warning(
            `${successCount} exitosas, ${failCount} fallidas. Revisa el detalle.`,
            'Carga Parcial'
          );
        }

        // Limpiar preview
        setPreviewData([]);

        // Recargar histórico
        if (accountId) {
          await fetchHistory(accountId);
        }

        return true;
      } else {
        throw new Error(data.message || 'Error desconocido');
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      
      // ============================================
      // MANEJO ESPECIAL: CENTROS DE COSTOS NO ENCONTRADOS
      // ============================================
      
      // Intentar parsear la respuesta del servidor
      let errorData: any = {};
      try {
        if (err.message && err.message.includes('{')) {
          errorData = JSON.parse(err.message);
        } else if (err.response) {
          errorData = err.response;
        }
      } catch (parseErr) {
        errorData = { message: err.message };
      }

      // ============================================
      // MANEJO ESPECÍFICO DE ERRORES POR TIPO
      // ============================================
      
      // ERROR 1: Centros de costos no encontrados
      if (errorData.missingCostCenterCodes && Array.isArray(errorData.missingCostCenterCodes)) {
        const missingCodes = errorData.missingCostCenterCodes;
        
        error(
          `Los códigos "${missingCodes.join('", "')}" NO existen en la cuenta seleccionada. ` +
          `Verifique los códigos en el sistema ERP/Contable y corrija el Excel.`,
          'Centros de Costos No Encontrados'
        );
        
        setTimeout(() => {
          info(
            'Los códigos de centros de costos deben coincidir exactamente con los de su sistema contable. ' +
            'Contacte a soporte@focalizahr.com si necesita agregar nuevos departamentos.',
            'Ayuda'
          );
        }, 1500);
        
        return false;
      }
      
      // ERROR 2: Cliente intentando usar targetAccountId (seguridad)
      if (errorData.attempted === 'targetAccountId override') {
        error(
          'No tiene permisos para cargar datos a otras cuentas. ' +
          'Esta funcionalidad está reservada para administradores de FocalizaHR.',
          'Acceso Denegado'
        );
        return false;
      }
      
      // ERROR 3: Target account no encontrada (admin)
      if (errorData.error && errorData.error.includes('Cuenta objetivo no encontrada')) {
        error(
          'La empresa seleccionada no existe en el sistema. ' +
          'Por favor, verifique la selección en el selector de empresas.',
          'Empresa No Encontrada'
        );
        return false;
      }
      
      // ERROR 4: Target account inactiva (admin)
      if (errorData.accountStatus && errorData.accountStatus !== 'ACTIVE') {
        error(
          `La cuenta "${errorData.companyName || 'seleccionada'}" no está activa (Estado: ${errorData.accountStatus}). ` +
          'Solo se pueden cargar métricas a cuentas activas.',
          'Cuenta Inactiva'
        );
        return false;
      }
      
      // ERROR 5: No autorizado (rol incorrecto)
      if (errorData.error && errorData.error.includes('No autorizado')) {
        error(
          'Su rol no tiene permisos para cargar métricas departamentales. ' +
          'Contacte al administrador de su cuenta.',
          'Sin Permisos'
        );
        return false;
      }
      
      // ERROR GENÉRICO: Otros errores
      error(
        errorData.message || errorData.error || err.message || 'Error al cargar métricas. Intenta nuevamente.',
        'Error Upload'
      );
      return false;
      
    } finally {
      setIsLoading(false);
    }
  }, [previewData, accountId, success, error, warning, info]);

  // ============================================
  // FETCH HISTÓRICO
  // ============================================

  const fetchHistory = useCallback(async (targetAccountId?: string): Promise<void> => {
    const effectiveAccountId = targetAccountId || accountId;
    if (!effectiveAccountId) return;

    setIsLoadingHistory(true);
    try {
      // Obtener token
      const token = localStorage.getItem('focalizahr_token');

      const response = await fetch(
        `/api/department-metrics?limit=50`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar histórico');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setHistory(data.data);
      }

    } catch (err) {
      console.error('History fetch error:', err);
      // No mostrar toast para evitar spam en carga inicial
    } finally {
      setIsLoadingHistory(false);
    }
  }, [accountId]);

  // ============================================
  // CANCELAR PREVIEW
  // ============================================

  const cancelPreview = useCallback(() => {
    setPreviewData([]);
    info('Preview cancelado', 'Cancelado');
  }, [info]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Estados
    isLoading,
    isLoadingHistory,
    previewData,
    history,

    // Métodos
    previewMetrics,
    confirmUpload,
    cancelPreview,
    fetchHistory
  };
}