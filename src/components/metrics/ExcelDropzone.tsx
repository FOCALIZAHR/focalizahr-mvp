// ============================================
// COMPONENTE: ExcelDropzone v3.0
// FIXED: Limpieza de símbolos % y #
// ============================================

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-system';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ExcelDropzoneProps {
  accountId: string;
  accountName?: string;
  onFileProcessed: (data: any[]) => void;
  className?: string;
}

export default function ExcelDropzone({
  accountId,
  accountName,
  onFileProcessed,
  className = ''
}: ExcelDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { error, warning, info } = useToast();

  // ============================================
  // VALIDAR ARCHIVO
  // ============================================

  const validateFile = useCallback((file: File): boolean => {
    // Validar tipo
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      error('Formato no válido. Usa CSV o Excel (.xlsx, .xls)', 'Formato Incorrecto');
      return false;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      error('Archivo muy grande. Máximo 10MB permitido.', 'Tamaño Excedido');
      return false;
    }

    return true;
  }, [error]);

  // ============================================
  // NORMALIZAR HEADERS (Función compartida)
  // ============================================

  const normalizeHeader = useCallback((header: string): string => {
    const normalized = header.trim().toLowerCase();
    const mapping: Record<string, string> = {
      'centro costos': 'costCenterCode',
      'centro de costos': 'costCenterCode',
      'código centro costos': 'costCenterCode',
      'período': 'period',
      'periodo': 'period',
      'rotación (%)': 'turnoverRate',
      'rotación %': 'turnoverRate',
      'rotacion': 'turnoverRate',
      'ausentismo (%)': 'absenceRate',
      'ausentismo %': 'absenceRate',
      'ausentismo': 'absenceRate',
      'denuncias (#)': 'issueCount',
      'denuncias #': 'issueCount',
      'denuncias': 'issueCount',
      'horas extras total': 'overtimeHoursTotal',
      'horas extras promedio': 'overtimeHoursAvg',
      'dotación promedio': 'headcountAvg',
      'salidas (#)': 'turnoverCount',
      'salidas #': 'turnoverCount',
      'salidas': 'turnoverCount',
      'días ausencia total': 'absenceDaysTotal',
      'dias ausencia total': 'absenceDaysTotal',
      'días laborales total': 'workingDaysTotal',
      'dias laborales total': 'workingDaysTotal',
      'empleados horas extras': 'overtimeEmployeeCount',
      'rotación lamentable %': 'turnoverRegrettableRate',
      'rotacion lamentable %': 'turnoverRegrettableRate',
      'salidas lamentables #': 'turnoverRegrettableCount',
      'salidas lamentables': 'turnoverRegrettableCount',
      // Fase 2: Métricas de Desempeño
      'score desempeño': 'performanceScore',
      'score desempeno': 'performanceScore',
      'desempeño': 'performanceScore',
      'desempeno': 'performanceScore',
      'performance score': 'performanceScore',
      'performance': 'performanceScore',
      '% metas cumplidas': 'goalsAchievedRate',
      '% metas': 'goalsAchievedRate',
      'metas cumplidas': 'goalsAchievedRate',
      'goals achieved': 'goalsAchievedRate',
      'cumplimiento metas': 'goalsAchievedRate',
      'notas': 'notes'
    };

    return mapping[normalized] || header;
  }, []);

  // ============================================
  // LIMPIAR VALORES (NUEVO - CRÍTICO)
  // ============================================

  const cleanValue = useCallback((key: string, value: any): any => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    // Convertir a string para procesar
    const strValue = String(value).trim();

    // Campos de porcentaje: eliminar % y convertir a número
    if (['turnoverRate', 'absenceRate', 'turnoverRegrettableRate', 'performanceScore', 'goalsAchievedRate'].includes(key)) {
      const cleaned = strValue.replace(/%/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    }

    // Campos enteros: eliminar # y convertir a número
    if (['issueCount', 'turnoverCount', 'absenceDaysTotal', 'workingDaysTotal', 
         'overtimeEmployeeCount', 'turnoverRegrettableCount'].includes(key)) {
      const cleaned = strValue.replace(/#/g, '').trim();
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? undefined : num;
    }

    // Campos float: convertir a número
    if (['overtimeHoursTotal', 'overtimeHoursAvg', 'headcountAvg'].includes(key)) {
      // Remover unidades comunes (h, hrs, horas)
      const cleaned = strValue.replace(/h(rs?|oras?)?$/i, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    }

    // Campos string: mantener como están
    if (['costCenterCode', 'period', 'notes'].includes(key)) {
      return strValue;
    }

    // Default: devolver valor original
    return value;
  }, []);

  // ============================================
  // VALIDAR Y PROCESAR DATOS (Función compartida)
  // ============================================

  const validateAndProcessData = useCallback((rawData: any[]) => {
    if (rawData.length === 0) {
      error('El archivo está vacío o no tiene datos válidos', 'Sin Datos');
      setSelectedFile(null);
      setIsProcessing(false);
      return;
    }

    if (rawData.length > 100) {
      error('Máximo 100 registros por carga. Divide el archivo.', 'Límite Excedido');
      setSelectedFile(null);
      setIsProcessing(false);
      return;
    }

    // Filtrar filas vacías
    const validData = rawData.filter((row: any) => {
      return row.costCenterCode && row.period;
    });

    if (validData.length === 0) {
      error('No se encontraron filas válidas con Centro Costos y Período', 'Sin Datos Válidos');
      setSelectedFile(null);
      setIsProcessing(false);
      return;
    }

    info(
      `Archivo procesado: ${validData.length} métricas detectadas`,
      'Procesado'
    );

    onFileProcessed(validData);
    setIsProcessing(false);
  }, [error, info, onFileProcessed]);

  // ============================================
  // PROCESAR ARCHIVO EXCEL (.xlsx, .xls)
  // ============================================

  const processExcelFile = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Buscar la hoja "Carga de Datos" o usar la primera hoja
      let sheetName = workbook.SheetNames[0];
      if (workbook.SheetNames.includes('Carga de Datos')) {
        sheetName = 'Carga de Datos';
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Mantener valores como strings
        defval: undefined // Valores vacíos como undefined
      });

      // Normalizar headers Y limpiar valores
      const normalizedData = rawData.map(row => {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = normalizeHeader(key);
          const cleanedValue = cleanValue(normalizedKey, row[key]);
          if (cleanedValue !== undefined) {
            normalizedRow[normalizedKey] = cleanedValue;
          }
        });
        return normalizedRow;
      });

      // Validar y procesar
      validateAndProcessData(normalizedData);

    } catch (err) {
      console.error('Excel processing error:', err);
      error('Error al procesar archivo Excel. Verifica el formato.', 'Error Excel');
      setSelectedFile(null);
      setIsProcessing(false);
    }
  }, [normalizeHeader, cleanValue, validateAndProcessData, error]);

  // ============================================
  // PROCESAR ARCHIVO CSV
  // ============================================

  const processCSVFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Mantener como strings para procesar
        encoding: 'UTF-8',  // ✅ AGREGAR ESTA LÍNEA
        transformHeader: (header) => normalizeHeader(header),
        complete: (results) => {
          if (results.errors.length > 0) {
            warning(
              `${results.errors.length} errores encontrados al parsear. Revisa el formato.`,
              'Errores Parseo'
            );
          }

          // Limpiar valores de cada fila
          const cleanedData = results.data.map((row: any) => {
            const cleanedRow: any = {};
            Object.keys(row).forEach(key => {
              const cleanedValue = cleanValue(key, row[key]);
              if (cleanedValue !== undefined) {
                cleanedRow[key] = cleanedValue;
              }
            });
            return cleanedRow;
          });

          validateAndProcessData(cleanedData);
        },
     
        // ✅ CORRECTO (renombrar parámetro):
        error: (err: Error) => {
          console.error('CSV parse error:', err);
          error('Error al leer el archivo CSV. Verifica el formato.', 'Error CSV');
          setSelectedFile(null);
          setIsProcessing(false);
        }
      });

    } catch (err) {
      console.error('CSV processing error:', err);
      error('Error al procesar archivo CSV. Intenta nuevamente.', 'Error');
      setSelectedFile(null);
      setIsProcessing(false);
    }
  }, [normalizeHeader, cleanValue, validateAndProcessData, error, warning]);

  // ============================================
  // PROCESAR ARCHIVO (Router principal)
  // ============================================

  const processFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setIsProcessing(true);
    setSelectedFile(file);

    // Detectar tipo de archivo por extensión
    const isExcel = file.name.match(/\.(xlsx|xls)$/i);

    if (isExcel) {
      // Procesar archivo Excel
      await processExcelFile(file);
    } else {
      // Procesar archivo CSV
      await processCSVFile(file);
    }
  }, [validateFile, processExcelFile, processCSVFile]);

  // ============================================
  // HANDLERS DRAG & DROP
  // ============================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`fhr-card mb-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
          <Upload className="w-6 h-6 text-purple-400" />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-2">
            Cargar Métricas
          </h2>
          {accountName && (
            <p className="text-sm text-cyan-300 mb-3">
              📊 Empresa: <span className="font-semibold">{accountName}</span>
            </p>
          )}

          {/* Dropzone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8
              transition-all duration-200 cursor-pointer
              ${isDragging 
                ? 'border-cyan-400 bg-cyan-500/10' 
                : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
              }
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="text-center">
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-cyan-400' : 'text-slate-400'}`} />
                <p className="text-white font-semibold mb-2">
                  {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel o haz click'}
                </p>
                <p className="text-sm text-slate-400">
                  Formatos soportados: CSV, XLSX, XLS (máximo 10MB)
                </p>
                {isProcessing && (
                  <p className="text-sm text-cyan-400 mt-2 animate-pulse">
                    Procesando archivo...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-white font-semibold">{selectedFile.name}</p>
                    <p className="text-sm text-slate-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Info adicional */}
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-200">
                Asegúrate de usar el template correcto. Máximo 100 registros por carga.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}