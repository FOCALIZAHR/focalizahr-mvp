// ============================================
// COMPONENTE: ExcelTemplateGenerator
// Genera y descarga template Excel para upload
// ============================================

'use client';

import { Download, FileSpreadsheet, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-system';

interface ExcelTemplateGeneratorProps {
  accountId?: string;
  className?: string;
}

export default function ExcelTemplateGenerator({ 
  accountId, 
  className = '' 
}: ExcelTemplateGeneratorProps) {
  const { success, info } = useToast();

  const generateTemplate = () => {
    // CSV Template con headers y ejemplos
    const headers = [
      'Centro Costos',
      'Período',
      'Rotación (%)',
      'Ausentismo (%)',
      'Denuncias (#)',
      'Horas Extras Total',
      'Horas Extras Promedio',
      'Dotación Promedio',
      'Salidas (#)',
      'Días Ausencia Total',
      'Días Laborales Total',
      'Empleados Horas Extras',
      'Notas'
    ];

    const examples = [
      [
        'DEPT-001',
        '2025-Q1',
        '12.5',
        '3.2',
        '2',
        '450',
        '15',
        '30',
        '4',
        '96',
        '3000',
        '18',
        'Q1 con alta rotación por reestructuración'
      ],
      [
        'DEPT-002',
        '2025-01',
        '8.3',
        '2.1',
        '0',
        '220',
        '7.3',
        '30',
        '3',
        '63',
        '3000',
        '12',
        'Mes normal, sin incidencias'
      ],
      [
        'DEPT-003',
        '2025',
        '15.2',
        '4.5',
        '5',
        '890',
        '22.5',
        '40',
        '6',
        '180',
        '4000',
        '25',
        'Año con múltiples desafíos'
      ]
    ];

    // Generar CSV
    let csv = headers.join(',') + '\n';
    examples.forEach(row => {
      csv += row.join(',') + '\n';
    });

    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-metricas-departamentales-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success('Template descargado exitosamente', '¡Listo!');
  };

  return (
    <div className={`fhr-card mb-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
          <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-2">
            Template Excel
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Descarga la plantilla con el formato correcto para cargar métricas departamentales.
            Incluye ejemplos para cada tipo de período (mensual, trimestral, anual).
          </p>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-cyan-200 space-y-2">
                <p className="font-semibold">Formato del Template:</p>
                <ul className="list-disc list-inside space-y-1 text-cyan-300">
                  <li><strong>Centro Costos:</strong> Código exacto de departamento (ej: DEPT-001)</li>
                  <li><strong>Período:</strong> Formato YYYY-Q1 (trimestre), YYYY-MM (mes), YYYY (año)</li>
                  <li><strong>Porcentajes:</strong> Números decimales 0-100 (ej: 12.5)</li>
                  <li><strong>Al menos 1 KPI:</strong> Rotación O Ausentismo O Denuncias O Horas Extras</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botón Descarga */}
          <Button
            onClick={generateTemplate}
            className="fhr-btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Template Excel
          </Button>
        </div>
      </div>
    </div>
  );
}