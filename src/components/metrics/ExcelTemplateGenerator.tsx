// ============================================
// COMPONENTE: ExcelTemplateGenerator v2.0
// Genera y descarga template Excel (.xlsx) profesional
// ============================================

'use client';

import { Download, FileSpreadsheet, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-system';
import * as XLSX from 'xlsx';

interface ExcelTemplateGeneratorProps {
  accountId?: string;
  className?: string;
}

export default function ExcelTemplateGenerator({ 
  accountId, 
  className = '' 
}: ExcelTemplateGeneratorProps) {
  const { success } = useToast();

  const generateTemplate = () => {
    // ============================================
    // HOJA 1: INSTRUCCIONES
    // ============================================
    
    const instrucciones = [
      // Header de la tabla
      ['Campo', '¿Qué es?', 'Ejemplo'],
      
      // KPIs ESENCIALES (7 campos)
      [
        'Centro Costos',
        'Código único que identifica al departamento en el sistema. DEBE EXISTIR en tu empresa.',
        'DEPT-001 (usa códigos reales de tu organización)'
      ],
      [
        'Período',
        'Período temporal que representan los datos. Usa formato: YYYY-Q1 (trimestre), YYYY-MM (mes), o YYYY (año)',
        '2025-Q1, 2025-01, 2025'
      ],
      [
        'Rotación %',
        'Porcentaje de colaboradores que salieron del departamento en el período',
        '12.5'
      ],
      [
        'Ausentismo %',
        'Porcentaje de días de ausencia respecto a días laborales totales',
        '3.2'
      ],
      [
        'Denuncias #',
        'Número total de denuncias o reportes registrados en el período',
        '2'
      ],
      [
        'Horas Extras Total',
        'Suma total de horas extras trabajadas por todo el equipo',
        '450'
      ],
      [
        'Horas Extras Promedio',
        'Promedio de horas extras por colaborador que hizo horas extras',
        '15'
      ],
      
      // CONTEXTO CÁLCULO (8 campos)
      [
        'Dotación Promedio',
        'Número promedio de colaboradores en el departamento durante el período',
        '30'
      ],
      [
        'Salidas #',
        'Número total de colaboradores que salieron (usado para calcular rotación)',
        '4'
      ],
      [
        'Días Ausencia Total',
        'Suma total de días de ausencia de todos los colaboradores',
        '96'
      ],
      [
        'Días Laborales Total',
        'Total de días laborales del período multiplicado por dotación',
        '3000'
      ],
      [
        'Empleados Horas Extras',
        'Cantidad de colaboradores que realizaron horas extras',
        '18'
      ],
      [
        'Rotación Lamentable %',
        'Porcentaje de rotación de talento crítico que la empresa no quería perder',
        '5.0'
      ],
      [
        'Salidas Lamentables #',
        'Número de salidas de talento crítico o alto desempeño',
        '2'
      ],
      [
        'Notas',
        'Observaciones adicionales o contexto relevante del período',
        'Q1 con reestructuración organizacional'
      ]
    ];

    // Crear worksheet de instrucciones
    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);

    // Aplicar anchos de columna para mejor legibilidad
    wsInstrucciones['!cols'] = [
      { wch: 25 },  // Campo
      { wch: 60 },  // ¿Qué es?
      { wch: 35 }   // Ejemplo
    ];

    // ============================================
    // HOJA 2: CARGA DE DATOS
    // ============================================
    
    // Headers de los 15 campos
    const headers = [
      // KPIs ESENCIALES (7 primeros - con styling)
      'Centro Costos',
      'Período',
      'Rotación %',
      'Ausentismo %',
      'Denuncias #',
      'Horas Extras Total',
      'Horas Extras Promedio',
      
      // CONTEXTO CÁLCULO (8 restantes - formato estándar)
      'Dotación Promedio',
      'Salidas #',
      'Días Ausencia Total',
      'Días Laborales Total',
      'Empleados Horas Extras',
      'Rotación Lamentable %',
      'Salidas Lamentables #',
      'Notas'
    ];

    // Crear worksheet con solo headers
    const wsCargaDatos = XLSX.utils.aoa_to_sheet([headers]);

    // ============================================
    // APLICAR STYLING DIFERENCIADO
    // ============================================
    
    // Estilo para KPIs ESENCIALES (A1:G1) - Azul + Negrita
    const kpiStyle = {
      fill: { fgColor: { rgb: '4A90E2' } },  // Azul profesional
      font: { bold: true, color: { rgb: 'FFFFFF' } },  // Texto blanco y negrita
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // Estilo para CONTEXTO (H1:O1) - Estándar
    const contextoStyle = {
      fill: { fgColor: { rgb: 'E8E8E8' } },  // Gris claro
      font: { bold: true, color: { rgb: '000000' } },  // Texto negro y negrita
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // Aplicar estilos a las celdas de headers
    const kpiColumns = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'];  // 7 KPIs
    const contextoColumns = ['H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1'];  // 8 Contexto

    kpiColumns.forEach(cell => {
      if (wsCargaDatos[cell]) {
        wsCargaDatos[cell].s = kpiStyle;
      }
    });

    contextoColumns.forEach(cell => {
      if (wsCargaDatos[cell]) {
        wsCargaDatos[cell].s = contextoStyle;
      }
    });

    // Configurar anchos de columna
    wsCargaDatos['!cols'] = [
      { wch: 15 },  // Centro Costos
      { wch: 12 },  // Período
      { wch: 12 },  // Rotación %
      { wch: 14 },  // Ausentismo %
      { wch: 12 },  // Denuncias #
      { wch: 18 },  // Horas Extras Total
      { wch: 20 },  // Horas Extras Promedio
      { wch: 18 },  // Dotación Promedio
      { wch: 12 },  // Salidas #
      { wch: 20 },  // Días Ausencia Total
      { wch: 20 },  // Días Laborales Total
      { wch: 20 },  // Empleados Horas Extras
      { wch: 22 },  // Rotación Lamentable %
      { wch: 22 },  // Salidas Lamentables #
      { wch: 40 }   // Notas
    ];

    // ============================================
    // CREAR WORKBOOK Y AGREGAR HOJAS
    // ============================================
    
    const wb = XLSX.utils.book_new();
    
    // Agregar hoja 1: Instrucciones
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');
    
    // Agregar hoja 2: Carga de Datos
    XLSX.utils.book_append_sheet(wb, wsCargaDatos, 'Carga de Datos');

    // ============================================
    // DESCARGAR ARCHIVO
    // ============================================
    
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `FocalizaHR_Template_Metricas_${fecha}.xlsx`;
    
    XLSX.writeFile(wb, filename);

    // Notificación exitosa
    success(
      'Template descargado exitosamente. Archivo listo para usar.',
      '¡Listo!'
    );
  };

  return (
    <div className={`fhr-card mb-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
          <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-2">
            Template Excel Profesional
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Descarga la plantilla Excel con instrucciones detalladas y formato guiado.
            Incluye explicación de cada campo y diferenciación visual de KPIs prioritarios.
          </p>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-cyan-200 space-y-2">
                <p className="font-semibold">El template incluye:</p>
                <ul className="list-disc list-inside space-y-1 text-cyan-300">
                  <li><strong>Hoja "Instrucciones":</strong> Guía completa de cada campo con ejemplos</li>
                  <li><strong>Hoja "Carga de Datos":</strong> Formato listo para llenar con indicadores visuales</li>
                  <li><strong>KPIs Destacados:</strong> Los 7 campos esenciales resaltados en azul</li>
                  <li><strong>Validación Automática:</strong> El sistema valida los datos al cargar</li>
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