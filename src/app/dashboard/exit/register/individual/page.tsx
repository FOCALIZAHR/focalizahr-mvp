// src/app/dashboard/exit/register/individual/page.tsx
// Formulario Registro Individual - Exit Intelligence
// Adaptado de onboarding/enroll/page.tsx

'use client';

import { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';
import { CyanButton, NeutralButton, SuccessButton } from '@/components/ui/MinimalistButton';
import { z } from 'zod';
import '@/styles/focalizahr-design-system.css';

/**
 * FORMULARIO REGISTRO INDIVIDUAL - Exit Intelligence
 * 
 * PROPÓSITO:
 * Registrar salidas individuales que crean:
 * - ExitRecord (registro de salida)
 * - Participant con uniqueToken (para encuesta)
 * - Email automático programado
 * 
 * VALIDACIONES:
 * - RUT chileno con módulo 11
 * - Email O phoneNumber obligatorio (al menos uno)
 * - Fecha salida obligatoria (no futura)
 * - Departamento obligatorio (con filtrado RBAC)
 * 
 * INTEGRACIÓN:
 * - POST /api/exit/register
 * - Carga departamentos con filtrado jerárquico
 * - Success muestra link encuesta + opción copiar
 */

// ============================================
// VALIDACIÓN RUT CHILENO (MÓDULO 11)
// ============================================

const validateRUT = (rut: string): boolean => {
  const cleanRUT = rut.replace(/[.-]/g, '');
  
  if (cleanRUT.length < 8 || cleanRUT.length > 9) {
    return false;
  }
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(body)) {
    return false;
  }
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const dvChar = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return dv === dvChar;
};

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
  {
    value: 'key_talent',
    label: '🔴 Talento Clave / Alto Potencial',
    description: 'Impacto crítico en el negocio'
  },
  {
    value: 'meets_expectations',
    label: '🟡 Buen Desempeño / Cumple',
    description: 'Cumple expectativas del rol'
  },
  {
    value: 'poor_fit',
    label: '🟢 Bajo Ajuste / Error de Contratación',
    description: 'No alcanzó el nivel esperado'
  }
] as const;

type TalentClassificationValue = typeof TALENT_CLASSIFICATION_OPTIONS[number]['value'];

type ExitReasonValue = typeof EXIT_REASON_OPTIONS[number]['value'];

// ============================================
// SCHEMA ZOD VALIDACIÓN
// ============================================

const exitRegisterSchema = z.object({
  nationalId: z.string()
    .min(1, 'RUT es obligatorio')
    .regex(/^\d{7,8}-[\dkK]$/, 'Formato RUT: 12345678-9 o 1234567-K')
    .refine(validateRUT, 'RUT inválido (verificador incorrecto)'),
  
  fullName: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  phoneNumber: z.string()
    .regex(/^\+56\d{9}$/, 'Formato: +56912345678')
    .optional()
    .or(z.literal('')),
  
  departmentId: z.string()
    .min(1, 'Departamento es obligatorio'),
  
  position: z.string()
    .min(2, 'Cargo debe tener al menos 2 caracteres')
    .max(100, 'Cargo demasiado largo')
    .optional()
    .or(z.literal('')),
  
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
  ]).optional(),

  talentClassification: z.enum([
    'key_talent', 'meets_expectations', 'poor_fit'
  ], {
    required_error: 'Clasificación de talento es obligatoria'
  })

}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: 'Debe proporcionar al menos email o teléfono',
    path: ['email']
  }
);

type ExitRegisterFormData = z.infer<typeof exitRegisterSchema>;

// ============================================
// INTERFACE DEPARTMENT
// ============================================

interface Department {
  id: string;
  displayName: string;
  unitType: string;
  level: number;
}

// ============================================
// INTERFACE SUCCESS RESULT
// ============================================

interface SuccessResult {
  exitRecordId: string;
  participantId: string;
  surveyToken: string;
  message: string;
  emailScheduledFor?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ExitRegisterIndividualPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { success, error: showError } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<ExitRegisterFormData>({
    resolver: zodResolver(exitRegisterSchema),
    defaultValues: {
      exitDate: new Date().toISOString().split('T')[0] // Hoy por defecto
    }
  });

  // Watch para validación en vivo
  const emailValue = watch('email');
  const phoneValue = watch('phoneNumber');
  const hasContactMethod = !!(emailValue || phoneValue);

  // ============================================
  // CARGAR DEPARTAMENTOS
  // ============================================

  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await fetch('/api/departments', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Error cargando departamentos');
        }
        
        const data = await response.json();
        setDepartments(data.departments || []);
      } catch (err) {
        console.error('Error cargando departamentos:', err);
        showError('Error cargando departamentos', 'Error');
      } finally {
        setLoading(false);
      }
    }
    
    loadDepartments();
  }, [showError]);

  // ============================================
  // SUBMIT HANDLER
  // ============================================

  const onSubmit = async (data: ExitRegisterFormData) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/exit/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nationalId: data.nationalId,
          fullName: data.fullName,
          email: data.email || undefined,
          phoneNumber: data.phoneNumber || undefined,
          departmentId: data.departmentId,
          exitDate: data.exitDate,
          position: data.position || undefined,
          exitReason: data.exitReason || undefined,
          talentClassification: data.talentClassification
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error registrando salida');
      }
      
      // Success
      setSuccessResult({
        exitRecordId: result.exitRecordId,
        participantId: result.participantId,
        surveyToken: result.surveyToken,
        message: result.message,
        emailScheduledFor: result.emailScheduledFor
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
  // COPIAR LINK ENCUESTA
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

  // ============================================
  // REGISTRAR OTRO
  // ============================================

  const handleRegisterAnother = () => {
    setSuccessResult(null);
    setCopied(false);
    reset();
  };

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen fhr-bg-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: SUCCESS
  // ============================================

  if (successResult) {
    const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/encuesta/${successResult.surveyToken}`;
    const hasEmail = !!watch('email');
    
    return (
      <div className="min-h-screen fhr-bg-main p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fhr-card p-8 text-center"
          >
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              ¡Salida Registrada!
            </h1>
            
            <p className="text-slate-400 mb-6">
              {successResult.message}
            </p>
            
            {/* Info Cards */}
            <div className="space-y-4 mb-8">
              {/* Email programado */}
              {hasEmail && (
                <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <Mail className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Email programado</p>
                    <p className="text-slate-400 text-xs">
                      {successResult.emailScheduledFor 
                        ? `Se enviará el ${new Date(successResult.emailScheduledFor).toLocaleDateString('es-CL', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : 'Se enviará invitación a la encuesta automáticamente'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {/* Link encuesta */}
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
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-300" />
                    )}
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
            
            {/* Action Buttons */}
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
  // RENDER: FORMULARIO
  // ============================================

  return (
    <div className="min-h-screen fhr-bg-main p-6">
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
                Registrar Salida Individual
              </h1>
              <p className="text-slate-400">
                Complete los datos del colaborador que deja la empresa
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

        {/* Formulario */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="fhr-card p-6 space-y-6"
        >
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white border-b border-slate-700 pb-2">
              Datos del Colaborador
            </h2>

            {/* RUT */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                RUT <span className="text-red-400">*</span>
              </label>
              <input
                {...register('nationalId')}
                type="text"
                placeholder="12345678-9"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
              {errors.nationalId && (
                <p className="text-red-400 text-xs mt-1">{errors.nationalId.message}</p>
              )}
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre Completo <span className="text-red-400">*</span>
              </label>
              <input
                {...register('fullName')}
                type="text"
                placeholder="Juan Pérez González"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
              {errors.fullName && (
                <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Grid 2 columnas: Email + Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email <span className="text-yellow-400">†</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="juan@empresa.com"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Teléfono <span className="text-yellow-400">†</span>
                </label>
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  placeholder="+56912345678"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.phoneNumber && (
                  <p className="text-red-400 text-xs mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>
            
            {/* Indicador contacto */}
            {!hasContactMethod && (
              <p className="text-yellow-400 text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span className="text-yellow-400">†</span> Debe proporcionar al menos email o teléfono
              </p>
            )}
          </div>

          {/* SECCIÓN 2: DATOS LABORALES */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white border-b border-slate-700 pb-2">
              Datos de Salida
            </h2>

            {/* Departamento */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Departamento <span className="text-red-400">*</span>
              </label>
              <select
                {...register('departmentId')}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              >
                <option value="">Seleccione departamento...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.displayName}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="text-red-400 text-xs mt-1">{errors.departmentId.message}</p>
              )}
            </div>

            {/* Grid 2 columnas: Cargo + Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Cargo
                </label>
                <input
                  {...register('position')}
                  type="text"
                  placeholder="Analista Senior"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.position && (
                  <p className="text-red-400 text-xs mt-1">{errors.position.message}</p>
                )}
              </div>
              
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
            </div>

            {/* Motivo de Salida */}
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
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                ℹ️ Este motivo se comparará con la respuesta del colaborador en la encuesta
              </p>
            </div>

            {/* Clasificación de Talento (OBLIGATORIO) */}
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
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.talentClassification && (
                <p className="text-red-400 text-xs mt-1">{errors.talentClassification.message}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                ⚠️ Esta clasificación es confidencial y solo visible para RRHH
              </p>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
            <NeutralButton
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </NeutralButton>

            <CyanButton
              type="submit"
              disabled={submitting || departments.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registrar Salida
                </>
              )}
            </CyanButton>
          </div>
        </motion.form>

        {/* Info adicional */}
        <div className="mt-6 p-4 fhr-card">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-400">
              <p className="font-medium text-slate-300 mb-1">¿Qué sucede después?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Se crea el registro de salida en el sistema</li>
                <li>Si hay email, se programa invitación a encuesta para mañana</li>
                <li>El colaborador completa la encuesta de salida</li>
                <li>El sistema calcula el EIS (Exit Intelligence Score)</li>
                <li>Se detectan alertas automáticas si aplica</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}