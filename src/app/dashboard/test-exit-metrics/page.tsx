// src/app/dashboard/test-exit-metrics/page.tsx

'use client';

import { useExitMetrics } from '@/hooks/useExitMetrics';

export default function TestExitMetricsPage() {
  // PRUEBA 1: Global company scope
  const { 
    data: dataCompany, 
    departments: deptsCompany, 
    summary: summaryCompany,
    loading: loadingCompany, 
    error: errorCompany 
  } = useExitMetrics(undefined, 'company');
  
  // PRUEBA 2: Filtered scope
  const { 
    departments: deptsFiltered, 
    loading: loadingFiltered 
  } = useExitMetrics(undefined, 'filtered');
  
  // PRUEBA 3: Con período
  const { 
    departments: deptsPeriod,
    loading: loadingPeriod 
  } = useExitMetrics({ period: '2024-12' }, 'company');

  return (
    <div className="fhr-bg-main">
      <div className="fhr-content">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="fhr-hero-title mb-2">
            🧪 Test <span className="fhr-title-gradient">Exit Metrics Hook</span>
          </h1>
          <p className="fhr-text-secondary">
            Verificación de integración con patrón HttpOnly cookies
          </p>
        </div>

        <div className="space-y-6">
          
          {/* PRUEBA 1: Company Scope */}
          <div className="fhr-card">
            <h2 className="fhr-title-card mb-4">
              1. Company Scope (todas las gerencias)
            </h2>
            
            {loadingCompany && (
              <p className="fhr-text-secondary">⏳ Cargando...</p>
            )}
            
            {errorCompany && (
              <div className="fhr-alert fhr-alert-error">
                <p className="fhr-alert-title">❌ Error</p>
                <p className="fhr-alert-description">{errorCompany}</p>
              </div>
            )}
            
            {summaryCompany && (
              <div className="space-y-4">
                <div className="fhr-metric-row">
                  <span className="fhr-metric-label">Total Departamentos:</span>
                  <span className="fhr-metric-value">{deptsCompany.length}</span>
                </div>
                
                <div className="fhr-metric-row">
                  <span className="fhr-metric-label">Total Exits:</span>
                  <span className="fhr-metric-value">{summaryCompany.totalExits}</span>
                </div>
                
                <div className="fhr-metric-row">
                  <span className="fhr-metric-label">EIS Global:</span>
                  <span className="fhr-metric-value text-cyan-400">
                    {summaryCompany.globalAvgEIS?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                
                <details className="mt-4">
                  <summary className="fhr-btn fhr-btn-secondary cursor-pointer">
                    Ver JSON completo
                  </summary>
                  <pre className="mt-4 p-4 bg-slate-900 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(summaryCompany, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* PRUEBA 2: Filtered Scope */}
          <div className="fhr-card">
            <h2 className="fhr-title-card mb-4">
              2. Filtered Scope (mi área)
            </h2>
            
            {loadingFiltered && (
              <p className="fhr-text-secondary">⏳ Cargando...</p>
            )}
            
            {deptsFiltered.length > 0 ? (
              <div className="space-y-3">
                <p className="fhr-text-secondary mb-3">
                  ✅ Departamentos filtrados: <span className="text-cyan-400 font-bold">{deptsFiltered.length}</span>
                </p>
                <div className="space-y-2">
                  {deptsFiltered.map(d => (
                    <div 
                      key={d.departmentId}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-200">
                          {d.departmentName}
                        </span>
                        <span className="text-cyan-400 font-bold">
                          EIS: {d.avgEIS?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !loadingFiltered && (
                <p className="fhr-text-muted">Sin departamentos filtrados</p>
              )
            )}
          </div>

          {/* PRUEBA 3: Con Período */}
          <div className="fhr-card">
            <h2 className="fhr-title-card mb-4">
              3. Con Período (2024-12)
            </h2>
            
            {loadingPeriod && (
              <p className="fhr-text-secondary">⏳ Cargando...</p>
            )}
            
            {deptsPeriod.length > 0 ? (
              <div className="fhr-alert fhr-alert-success">
                <p className="fhr-alert-title">✅ Datos encontrados</p>
                <p className="fhr-alert-description">
                  Departamentos en período: <strong>{deptsPeriod.length}</strong>
                </p>
              </div>
            ) : (
              !loadingPeriod && (
                <p className="fhr-text-muted">Sin datos para este período</p>
              )
            )}
          </div>

          {/* CONSOLA DE DEBUG */}
          <div className="fhr-card bg-slate-900 border-2 border-cyan-500/20">
            <h2 className="fhr-title-card mb-4 flex items-center gap-2">
              <span>🔍</span>
              <span>Instrucciones de Debugging</span>
            </h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-cyan-400 font-semibold mb-2">
                  1. Abre DevTools (F12) → Console
                </p>
                <p className="fhr-text-secondary">
                  Deberías ver logs como:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-slate-400">
                  <li>[useExitMetrics] 🔄 Fetching: /api/exit/metrics?scope=company</li>
                  <li>[useExitMetrics] ✅ Data received: ...</li>
                </ul>
              </div>
              
              <div>
                <p className="text-purple-400 font-semibold mb-2">
                  2. Verifica Network Tab (F12 → Network)
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-slate-400">
                  <li>Request: GET /api/exit/metrics</li>
                  <li>Status: <span className="text-green-400">200</span></li>
                  <li>Headers: <code className="text-cyan-300">Cookie: focalizahr_token=...</code></li>
                  <li><strong>NO</strong> debe tener: <code className="line-through">Authorization: Bearer</code></li>
                </ul>
              </div>
              
              <div>
                <p className="text-amber-400 font-semibold mb-2">
                  3. Test de Seguridad HttpOnly
                </p>
                <div className="p-3 bg-slate-800 rounded-lg mt-2">
                  <p className="text-slate-300 mb-2">Ejecuta en Console:</p>
                  <code className="text-xs text-cyan-300">
                    document.cookie
                  </code>
                  <p className="text-slate-400 mt-2 text-xs">
                    ✅ Si NO ves "focalizahr_token" = Cookie HttpOnly funcionando correctamente (token protegido)
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}