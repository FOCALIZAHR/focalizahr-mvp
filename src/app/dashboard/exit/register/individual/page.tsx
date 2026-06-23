// src/app/dashboard/exit/register/individual/page.tsx
// Formulario Registro Individual - Exit Intelligence
// Gate D D2: anclado al maestro Employee (bloqueo duro). Flujo: buscar -> prepoblar -> registrar.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  UserMinus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
  Mail,
  Phone,
  Search,
  Database,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';
import { CyanButton, NeutralButton, SuccessButton } from '@/components/ui/MinimalistButton';
import { z } from 'zod';
import type { ExitEmployeeLookupResult } from '@/types/exit';
import { EXIT_REGISTRATION_ERROR_CODES } from '@/types/exit';
import '@/styles/focalizahr-design-system.css';

/**
 * FORMULARIO REGISTRO INDIVIDUAL - Exit Intelligence (Gate D D2)
 *
 * Bloqueo duro: nadie registra una salida si la persona no está en el maestro.
 * Flujo:
 *   1. Buscar a la persona en el maestro (RUT o nombre), respetando scope jerárquico.
 *   2. Si existe -> prepoblar datos personales (read-only) + pedir 3 datos del egreso.
 *   3. Si no existe (en su scope) -> bloquear y redirigir al sync del maestro.
 *
 * El exit NUNCA crea Employee. La única vía de alta al maestro es el sync.
 */

// ============================================
// 13 OPCIONES exitReason (ESPAÑOL)
// ============================================

const EXIT_REASON_OPTIONS = [
  { value: 'mejor_oportunidad', label: 'Mejor oportunidad laboral' },
  { value: 'compensacion', label: 'Compensación / Sueldo' },
  { value: 'crecimiento_carrera', label: 'Falta de crecimiento profesional' },
  { value: 'balance_vida_trabajo', label: 'Balance vida-trabajo' },
  { value: 'mal_clima', label: 'Mal clima laboral' },
  { value: 'problemas_liderazgo', label: 'Problemas con liderazgo' },
  { value: 'relocalizacion', label: 'Relocalización geográfica' },
  { value: 'motivos_personales', label: 'Motivos personales' },
  { value: 'estudios', label: 'Estudios / Formación' },
  { value: 'salud', label: 'Motivos de salud' },
  { value: 'abandono_trabajo', label: 'Abandono de trabajo' },
  { value: 'jubilacion', label: 'Jubilación' },
  { value: 'otro', label: 'Otro motivo' }
] as const;

// ============================================
// OPCIONES CLASIFICACIÓN TALENTO (OBLIGATORIO)
// ============================================

const TALENT_CLASSIFICATION_OPTIONS = [
  { value: 'key_talent', label: 'Talento Clave / Alto Potencial' },
  { value: 'meets_expectations', label: 'Buen Desempeño / Cumple' },
  { value: 'poor_fit', label: 'Bajo Ajuste / Error de Contratación' }
] as const;

// ============================================
// SCHEMA ZOD — solo datos del egreso (lo personal viene del maestro)
// ============================================

const exitDetailsSchema = z.object({
  exitDate: z.string()
    .min(1, 'Fecha de salida es obligatoria')
    .refine(val => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !isNaN(date.getTime()) && date <= today;
    }, 'Fecha de salida no puede ser futura'),

  exitReason: z.enum([
    'mejor_oportunidad', 'compensacion', 'crecimiento_carrera',
    'balance_vida_trabajo', 'mal_clima', 'problemas_liderazgo',
    'relocalizacion', 'motivos_personales', 'estudios',
    'salud', 'abandono_trabajo', 'jubilacion', 'otro'
  ]).optional().or(z.literal('')),

  talentClassification: z.enum(['key_talent', 'meets_expectations', 'poor_fit'], {
    required_error: 'Clasificación de talento es obligatoria'
  })
});

type ExitDetailsFormData = z.infer<typeof exitDetailsSchema>;

interface SuccessResult {
  exitRecordId: string;
  participantId: string;
  surveyToken: string;
  message: string;
  emailScheduledFor?: string;
  hasEmail: boolean;
}

const SYNC_ROUTE = '/dashboard/admin/employees';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ExitRegisterIndividualPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  // Búsqueda en el maestro
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ExitEmployeeLookupResult[] | null>(null);
  const [notInMaster, setNotInMaster] = useState(false);

  // Persona seleccionada (prepoblada desde el maestro)
  const [selected, setSelected] = useState<ExitEmployeeLookupResult | null>(null);

  // Registro
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ExitDetailsFormData>({
    resolver: zodResolver(exitDetailsSchema),
    defaultValues: {
      exitDate: new Date().toISOString().split('T')[0]
    }
  });

  // ============================================
  // BUSCAR EN EL MAESTRO
  // ============================================

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = searchInput.trim();
    if (query.length < 2) {
      showError('Escribe al menos 2 caracteres (RUT o nombre)', 'Búsqueda');
      return;
    }

    setSearching(true);
    setNotInMaster(false);
    setResults(null);

    try {
      const response = await fetch(
        `/api/exit/employee-lookup?q=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error buscando en el maestro');
      }

      const found: ExitEmployeeLookupResult[] = data.data?.results || [];
      setResults(found);
      setNotInMaster(found.length === 0);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error desconocido', 'Error');
    } finally {
      setSearching(false);
    }
  };

  // ============================================
  // SUBMIT REGISTRO
  // ============================================

  const onSubmit = async (data: ExitDetailsFormData) => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/exit/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Identidad + datos personales: del maestro (el server los reconfirma)
          nationalId: selected.nationalId,
          fullName: selected.fullName,
          departmentId: selected.departmentId,
          email: selected.email || undefined,
          phoneNumber: selected.phoneNumber || undefined,
          position: selected.position || undefined,
          // Datos del egreso (form)
          exitDate: data.exitDate,
          exitReason: data.exitReason || undefined,
          talentClassification: data.talentClassification
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Bloqueo duro defensivo (p.ej. el maestro cambió entre búsqueda y submit)
        if (result.code === EXIT_REGISTRATION_ERROR_CODES.EMPLOYEE_NOT_IN_MASTER) {
          setSelected(null);
          setResults([]);
          setNotInMaster(true);
          showError(result.error, 'No está en el maestro');
          return;
        }
        throw new Error(result.error || 'Error registrando salida');
      }

      setSuccessResult({
        exitRecordId: result.exitRecordId,
        participantId: result.participantId,
        surveyToken: result.surveyToken,
        message: result.message,
        emailScheduledFor: result.emailScheduledFor,
        hasEmail: !!selected.email
      });
      success('Salida registrada exitosamente', '¡Registro Completo!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      showError(errorMsg, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const handleCopyLink = () => {
    if (successResult?.surveyToken) {
      const surveyUrl = `${window.location.origin}/encuesta/${successResult.surveyToken}`;
      navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      success('Link copiado al portapapeles', '¡Copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegisterAnother = () => {
    setSuccessResult(null);
    setCopied(false);
    setSelected(null);
    setResults(null);
    setNotInMaster(false);
    setSearchInput('');
    reset();
  };

  const backToSearch = () => {
    setSelected(null);
    setError(null);
  };

  // ============================================
  // RENDER: SUCCESS
  // ============================================

  if (successResult) {
    const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/encuesta/${successResult.surveyToken}`;

    return (
      <div className="min-h-screen fhr-bg-main p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fhr-card p-6 md:p-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">¡Salida Registrada!</h1>
            <p className="text-slate-400 mb-6">{successResult.message}</p>

            <div className="space-y-4 mb-8">
              {successResult.hasEmail && (
                <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <Mail className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Email programado</p>
                    <p className="text-slate-400 text-xs">
                      {successResult.emailScheduledFor
                        ? `Se enviará el ${new Date(successResult.emailScheduledFor).toLocaleDateString('es-CL', {
                            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                          })}`
                        : 'Se enviará invitación a la encuesta automáticamente'}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <p className="text-slate-400 text-xs mb-2">Link de encuesta:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-cyan-400 bg-slate-900 px-3 py-2 rounded truncate">
                    {surveyUrl}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                    title="Copiar link"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
                  </button>
                  <a
                    href={surveyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                    title="Abrir encuesta"
                  >
                    <ExternalLink className="h-4 w-4 text-slate-300" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <NeutralButton onClick={handleRegisterAnother}>
                <UserMinus className="h-4 w-4 mr-2" />
                Registrar Otra Salida
              </NeutralButton>
              <SuccessButton onClick={() => router.push('/dashboard/exit/records')}>
                Ver Registros de Salida
              </SuccessButton>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: PÁGINA (búsqueda / confirmación)
  // ============================================

  return (
    <div className="min-h-screen fhr-bg-main p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <UserMinus className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Registrar{' '}
                <span className="fhr-title-gradient">Salida Individual</span>
              </h1>
              <p className="text-slate-400">
                Busca a la persona en tu maestro de colaboradores
              </p>
            </div>
          </div>
        </div>

        {/* Error Global */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error en el registro</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* ===================== PASO 1: BÚSQUEDA ===================== */}
        {!selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fhr-card p-6 space-y-5"
          >
            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Buscar colaborador (RUT o nombre)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  placeholder="12345678-9 o Juan Pérez"
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                <CyanButton type="submit" disabled={searching}>
                  {searching ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" />Buscar</>
                  )}
                </CyanButton>
              </div>
            </form>

            {/* Resultados */}
            {results && results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-widest">
                  {results.length} {results.length === 1 ? 'coincidencia' : 'coincidencias'}
                </p>
                {results.map((emp) => (
                  <button
                    key={emp.employeeId}
                    onClick={() => setSelected(emp)}
                    className="w-full text-left p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-cyan-500/40 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-medium">{emp.fullName}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {emp.nationalId}
                          {emp.departmentName ? ` · ${emp.departmentName}` : ''}
                          {emp.position ? ` · ${emp.position}` : ''}
                        </p>
                      </div>
                      {!emp.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-400/70 border border-slate-700/50 font-light whitespace-nowrap">
                          inactivo
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* BLOQUEO: no está en el maestro (o fuera de scope) */}
            {notInMaster && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 bg-amber-500/5 border border-amber-500/30 rounded-lg space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Esta persona no está en tu maestro</p>
                    <p className="text-slate-400 text-sm mt-1">
                      No encontramos a nadie con ese RUT o nombre en tu maestro de colaboradores.
                      Para registrar su salida, primero sincroniza el maestro y vuelve a buscarla.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <NeutralButton onClick={() => { setNotInMaster(false); setResults(null); }}>
                    Buscar de nuevo
                  </NeutralButton>
                  <CyanButton onClick={() => router.push(SYNC_ROUTE)}>
                    <Database className="h-4 w-4 mr-2" />
                    Ir a sincronizar el maestro
                  </CyanButton>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ===================== PASO 2: CONFIRMACIÓN ===================== */}
        {selected && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="fhr-card p-6 space-y-6"
          >
            {/* Datos del maestro (read-only) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Datos del colaborador</h2>
                <button
                  type="button"
                  onClick={backToSearch}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Cambiar persona
                </button>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white font-medium">{selected.fullName}</p>
                  {!selected.isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-400/70 border border-slate-700/50 font-light">
                      inactivo
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {selected.nationalId}
                  {selected.departmentName ? ` · ${selected.departmentName}` : ''}
                  {selected.position ? ` · ${selected.position}` : ''}
                </p>
                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {selected.email || 'Sin email'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {selected.phoneNumber || 'Sin teléfono'}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos del egreso */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white border-b border-slate-700 pb-2">
                Datos de la salida
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Fecha de Salida <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('exitDate')}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.exitDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.exitDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Motivo de Salida (Hipótesis RRHH)
                </label>
                <select
                  {...register('exitReason')}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                >
                  <option value="">Sin especificar</option>
                  {EXIT_REASON_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Este motivo se comparará con la respuesta del colaborador en la encuesta
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Clasificación de Talento <span className="text-red-400">*</span>
                </label>
                <select
                  {...register('talentClassification')}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                >
                  <option value="">Seleccione clasificación...</option>
                  {TALENT_CLASSIFICATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.talentClassification && (
                  <p className="text-red-400 text-xs mt-1">{errors.talentClassification.message}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Esta clasificación es confidencial y solo visible para RRHH
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
              <NeutralButton type="button" onClick={backToSearch} disabled={submitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </NeutralButton>
              <CyanButton type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Registrar Salida</>
                )}
              </CyanButton>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
