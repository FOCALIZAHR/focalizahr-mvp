// ============================================
// COMPONENTE: ExcelDropzone
// Drag & Drop upload con validación
// ============================================

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-system';
import Papa from 'papaparse';

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
  // PROCESAR ARCHIVO
  // ============================================

  const processFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setIsProcessing(true);
    setSelectedFile(file);

    try {
      // Leer archivo
      const text = await file.text();

      // Parsear CSV con Papaparse
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => {
          // Normalizar headers
          const normalized = header.trim().toLowerCase();
          const mapping: Record<string, string> = {
            'centro costos': 'costCenterCode',
            'centro de costos': 'costCenterCode',
            'código centro costos': 'costCenterCode',
            'período': 'period',
            'periodo': 'period',
            'rotación (%)': 'turnoverRate',
            'rotacion': 'turnoverRate',
            'ausentismo (%)': 'absenceRate',
            'ausentismo': 'absenceRate',
            'denuncias (#)': 'issueCount',
            'denuncias': 'issueCount',
            'horas extras total': 'overtimeHoursTotal',
            'horas extras promedio': 'overtimeHoursAvg',
            'dotación promedio': 'headcountAvg',
            'salidas (#)': 'turnoverCount',
            'días ausencia total': 'absenceDaysTotal',
            'días laborales total': 'workingDaysTotal',
            'empleados horas extras': 'overtimeEmployeeCount',
            'notas': 'notes'
          };

          return mapping[normalized] || header;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            warning(
              `${results.errors.length} errores encontrados al parsear. Revisa el formato.`,
              'Errores Parseo'
            );
          }

          if (results.data.length === 0) {
            error('El archivo está vacío o no tiene datos válidos', 'Sin Datos');
            setSelectedFile(null);
            return;
          }

          if (results.data.length > 100) {
            error('Máximo 100 registros por carga. Divide el archivo.', 'Límite Excedido');
            setSelectedFile(null);
            return;
          }

          // Filtrar filas vacías
          const validData = results.data.filter((row: any) => {
            return row.costCenterCode && row.period;
          });

          if (validData.length === 0) {
            error('No se encontraron filas válidas con Centro Costos y Período', 'Sin Datos Válidos');
            setSelectedFile(null);
            return;
          }

          info(
            `Archivo procesado: ${validData.length} métricas detectadas`,
            'Procesado'
          );

          onFileProcessed(validData);
        },
        error: (err) => {
          console.error('Parse error:', err);
          error('Error al leer el archivo. Verifica el formato.', 'Error Parseo');
          setSelectedFile(null);
        }
      });

    } catch (err) {
      console.error('File processing error:', err);
      error('Error al procesar archivo. Intenta nuevamente.', 'Error');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [validateFile, onFileProcessed, error, warning, info]);

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