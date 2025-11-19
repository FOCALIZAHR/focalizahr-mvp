'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';
import { CyanButton, NeutralButton } from '@/components/ui/MinimalistButton';
import { z } from 'zod';

/**
 * FORMULARIO ENROLLMENT - Onboarding Journey Intelligence
 * 
 * PROPÓSITO:
 * Inscribir colaboradores en el sistema Onboarding Journey Intelligence
 * que crea automáticamente un journey con 4 etapas (Day 1, 7, 30, 90)
 * 
 * VALIDACIONES:
 * - RUT chileno con módulo 11
 * - Email O phoneNumber obligatorio (al menos uno)
 * - Fecha contratación obligatoria (no futura)
 * - Departamento obligatorio (con filtrado RBAC)
 * 
 * INTEGRACIÓN:
 * - POST /api/onboarding/enroll
 * - Carga departamentos con filtrado jerárquico
 * - Success redirect a /dashboard/onboarding/pipeline
 */

// ============================================
// VALIDACIÓN RUT CHILENO (MÓDULO 11)
// ============================================

const validateRUT = (rut: string): boolean => {
  // Limpiar RUT (quitar puntos y guión)
  const cleanRUT = rut.replace(/[.-]/g, '');
  
  // Debe tener entre 8 y 9 caracteres
  if (cleanRUT.length < 8 || cleanRUT.length > 9) {
    return false;
  }
  
  // Separar cuerpo y dígito verificador
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toUpperCase();
  
  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) {
    return false;
  }
  
  // Algoritmo módulo 11
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
// SCHEMA ZOD VALIDACIÓN
// ============================================

const enrollmentSchema = z.object({
  nationalId: z.string()
    .min(1, 'RUT es obligatorio')
    .regex(/^\d{7,8}-[\dkK]$/, 'Formato RUT: 12345678-9 o 1234567-K')
    .refine(validateRUT, 'RUT inválido (verificador incorrecto)'),
  
  fullName: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo'),
  
  participantEmail: z.string()
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
  
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']).optional(),
  
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  
  hireDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .min(1, 'Fecha de contratación es obligatoria')
    .refine((date) => {
      if (!date) return true;
      const hireDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return hireDate <= today;
    }, 'Fecha de contratación no puede ser futura'),
  
  location: z.string()
    .max(100, 'Ubicación demasiado larga')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(500, 'Notas demasiado largas')
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => data.participantEmail || data.phoneNumber,
  {
    message: 'Debe proporcionar al menos email o teléfono',
    path: ['participantEmail']
  }
);

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

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
// COMPONENTE PRINCIPAL
// ============================================

export default function EnrollmentPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { success, error: showError } = useToast();
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema)
    });

    // Watch para validación en vivo
    const emailValue = watch('participantEmail');
    const phoneValue = watch('phoneNumber');
    const hasContactMethod = !!emailValue || !!phoneValue;

    // ============================================
    // CARGAR DEPARTAMENTOS (con filtrado RBAC)
    // ============================================
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/departments', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error cargando departamentos');
                }

                const data = await response.json();

                // ✅ FIX: Cambiar data.data → data.departments
                if (data.success && Array.isArray(data.departments)) {
                    setDepartments(data.departments);
                } else {
                    throw new Error('Formato de respuesta inválido');
                }
            } catch (err: any) {
                console.error('Error cargando departamentos:', err);
                setError(err.message || 'Error al cargar departamentos');
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);
  // ============================================
  // SUBMIT FORM
  // ============================================

  const onSubmit = async (data: EnrollmentFormData) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/onboarding/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

        if (!response.ok) {
            // Si hay detalles de validación, mostrarlos
            if (result.details && result.details.length > 0) {
                const errores = result.details
                    .map((d: any) => `• ${d.message}`)  // ← Eliminé ${d.field}:
                    .join('\n');
                throw new Error(`Errores de validación:\n${errores}`);
            }
            throw new Error(result.error || 'Error al inscribir colaborador');
        }

        // Success: mostrar mensaje y redirect
        // ✅ REEMPLÁZALO CON ESTO:
        // Success: mostrar toast corporativo con Journey ID real
        // Success: mostrar toast corporativo
        success(
            `Colaborador "${data.fullName}" inscrito exitosamente. Se han programado 4 encuestas automáticas (Día 1, 7, 30, 90).`,
            '¡Éxito!'
        );

        setTimeout(() => {
            router.push('/dashboard/onboarding/pipeline');
        }, 1500);

      } catch (err: any) {
          console.error('Error al inscribir:', err);

          const errorMessage = err.message || 'Error al inscribir colaborador';
          setError(errorMessage);

          // Scroll automático hacia arriba para mostrar el error
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Mostrar Toast de error
          showError(errorMessage, 'Error de Validación');
      } finally {
          setSubmitting(false);
      }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER FORM
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {/* Botón volver */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Volver</span>
          </button>

          {/* Hero Icon */}
          <div className="inline-flex p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 mb-4">
            <UserPlus className="h-12 w-12 text-purple-400" />
          </div>

          {/* Título */}
          <h1 className="text-4xl font-extralight text-white mb-2">
            Inscribir Colaborador
          </h1>
          <p className="text-slate-400 text-sm">
            Onboarding Journey Intelligence · Sistema predictivo 4C Bauer
          </p>
        </motion.div>

        {/* ERROR GLOBAL */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-sm">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* FORMULARIO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-8 backdrop-blur-sm"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-4">
              <h2 className="text-xl font-light text-white border-b border-slate-700 pb-2">
                Datos Personales
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
                    Email Corporativo
                  </label>
                  <input
                    {...register('participantEmail')}
                    type="email"
                    placeholder="juan.perez@empresa.cl"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  />
                  {errors.participantEmail && (
                    <p className="text-red-400 text-xs mt-1">{errors.participantEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Teléfono WhatsApp
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

              {/* Info: Al menos 1 canal obligatorio */}
              <div className={`flex items-start gap-2 p-3 rounded-lg border ${hasContactMethod ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${hasContactMethod ? 'text-green-400' : 'text-amber-400'}`} />
                <p className={`text-xs ${hasContactMethod ? 'text-green-300' : 'text-amber-300'}`}>
                  {hasContactMethod 
                    ? '✓ Canal de contacto proporcionado' 
                    : 'Debe proporcionar al menos email o teléfono para enviar encuestas'}
                </p>
              </div>

              {/* Género (opcional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Género (Opcional)
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                >
                  <option value="">Seleccionar...</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Femenino</option>
                  <option value="NON_BINARY">No Binario</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              {/* Fecha Nacimiento (opcional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Fecha de Nacimiento (Opcional)
                </label>
                <input
                  {...register('birthDate')}
                  type="date"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.birthDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.birthDate.message}</p>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: DATOS ORGANIZACIONALES */}
            <div className="space-y-4">
              <h2 className="text-xl font-light text-white border-b border-slate-700 pb-2">
                Datos Organizacionales
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
                  <option value="">Seleccionar departamento...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.displayName}
                      {dept.level && ` (Nivel ${dept.level})`}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <p className="text-red-400 text-xs mt-1">{errors.departmentId.message}</p>
                )}
                {departments.length === 0 && (
                  <p className="text-amber-400 text-xs mt-1">
                    ⚠️ No hay departamentos disponibles. Contacte al administrador.
                  </p>
                )}
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Cargo (Opcional)
                </label>
                <input
                  {...register('position')}
                  type="text"
                  placeholder="Analista de Datos"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.position && (
                  <p className="text-red-400 text-xs mt-1">{errors.position.message}</p>
                )}
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Ubicación (Opcional)
                </label>
                <input
                  {...register('location')}
                  type="text"
                  placeholder="Santiago Centro"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.location && (
                  <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>
                )}
              </div>

              {/* Fecha Contratación */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Fecha de Contratación <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('hireDate')}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                {errors.hireDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.hireDate.message}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  ℹ️ El sistema calculará automáticamente las 4 fechas de encuesta (día 1, 7, 30, 90)
                </p>
              </div>
            </div>

            {/* SECCIÓN 3: NOTAS ADICIONALES */}
            <div className="space-y-4">
              <h2 className="text-xl font-light text-white border-b border-slate-700 pb-2">
                Información Adicional
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Notas (Opcional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Información adicional relevante..."
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition resize-none"
                />
                {errors.notes && (
                  <p className="text-red-400 text-xs mt-1">{errors.notes.message}</p>
                )}
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
              <NeutralButton
                onClick={() => router.back()}
                disabled={submitting}
                icon={ArrowLeft}
                iconPosition="left"
                size="md"
              >
                Cancelar
              </NeutralButton>

              <CyanButton
                type="submit"
                disabled={submitting || departments.length === 0}
                icon={submitting ? Loader2 : CheckCircle}
                iconPosition="left"
                size="md"
                isLoading={submitting}
              >
                {submitting ? 'Inscribiendo...' : 'Inscribir Colaborador'}
              </CyanButton>
            </div>
          </form>
        </motion.div>

        {/* FOOTER INFO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300 space-y-1">
              <p className="font-medium">¿Qué sucede después de la inscripción?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-200">
                <li>Se crea un Journey único para este colaborador</li>
                <li>Se programan 4 encuestas automáticas (Día 1, 7, 30, 90)</li>
                <li>El colaborador recibirá emails en las fechas calculadas</li>
                <li>Podrás monitorear el progreso en el Dashboard Onboarding</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}