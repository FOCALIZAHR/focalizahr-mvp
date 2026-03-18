// ═══════════════════════════════════════════════════════════════════════════════
// DD_PREV/page.tsx — SERVER COMPONENT con verificación de acceso
// ═══════════════════════════════════════════════════════════════════════════════
// 
// SEGURIDAD: Esta página contiene datos de compensaciones confidenciales.
// Protegida por acuerdos de confidencialidad con Derechos Digitales.
//
// ARQUITECTURA DE SEGURIDAD (3 capas):
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ CAPA 1: Middleware (src/middleware.ts)                                      │
// │   → Intercepta TODAS las requests a /dashboard/*                            │
// │   → Valida JWT (cookie o header Authorization)                              │
// │   → Inyecta headers: x-account-id, x-user-role, x-user-email               │
// │   → Si no hay token válido → Redirige a /login                             │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CAPA 2: Este Server Component                                               │
// │   → Lee headers inyectados por middleware                                   │
// │   → Verifica que accountId === DD_ACCOUNT_ID                               │
// │   → O que el rol sea FOCALIZAHR_ADMIN (soporte)                            │
// │   → Si no coincide → Renderiza "Acceso Restringido"                        │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CAPA 3: Datos hardcodeados (personas.ts)                                    │
// │   → Los salarios NO están en la BD                                         │
// │   → No hay API que pueda filtrar/exponer datos                             │
// │   → Solo se renderizan si las capas 1 y 2 pasan                            │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// PARA EL MAIL A DD: Nadie puede acceder a esta página sin:
// 1. Tener una cuenta válida en FocalizaHR (JWT firmado)
// 2. Que esa cuenta sea específicamente la de Derechos Digitales
// 3. O ser administrador de FocalizaHR (para soporte técnico)
//
// ═══════════════════════════════════════════════════════════════════════════════

import { headers } from "next/headers";
import DDPrevClient from "./DDPrevClient";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE ACCESO — SOLO ESTAS CUENTAS PUEDEN VER LA PÁGINA
// ─────────────────────────────────────────────────────────────────────────────
// 
// ⚠️ IMPORTANTE: Reemplazar con el accountId real de Derechos Digitales
// Obtenerlo con: SELECT id FROM "Account" WHERE "companyName" ILIKE '%derechos%';
//
const AUTHORIZED_ACCOUNT_IDS = [
  "cmmv0idz40000xwa7jleqgn9r", // Derechos Digitales
];

// Roles que siempre tienen acceso (para soporte técnico de FocalizaHR)
const ADMIN_BYPASS_ROLES = ["FOCALIZAHR_ADMIN"];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE DE ACCESO DENEGADO
// ─────────────────────────────────────────────────────────────────────────────
function AccesoDenegado() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
        {/* Icono */}
        <div className="text-6xl mb-6">🔒</div>
        
        {/* Título */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Acceso Restringido
        </h1>
        
        {/* Mensaje principal */}
        <p className="text-slate-400 mb-6">
          Esta página contiene información de compensaciones protegida por 
          acuerdos de confidencialidad.
        </p>
        
        {/* Detalle */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-left text-sm">
          <p className="text-slate-500 mb-2">
            <strong className="text-slate-400">¿Por qué veo esto?</strong>
          </p>
          <ul className="text-slate-500 space-y-1 list-disc list-inside">
            <li>Tu cuenta no tiene permisos para ver esta información</li>
            <li>Solo usuarios autorizados de la organización pueden acceder</li>
            <li>Si crees que esto es un error, contacta al administrador</li>
          </ul>
        </div>
        
        {/* Footer legal */}
        <p className="text-xs text-slate-600 mt-6">
          Datos protegidos bajo contrato de confidencialidad.
          Acceso registrado y auditado.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT (SERVER COMPONENT)
// ─────────────────────────────────────────────────────────────────────────────
export default async function DDPrevPage() {
  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN DE ACCESO SERVER-SIDE
  // ═══════════════════════════════════════════════════════════════════════════
  // 
  // Los headers son inyectados por el middleware DESPUÉS de validar el JWT.
  // Si llegamos aquí, el usuario YA está autenticado (tiene token válido).
  // Ahora verificamos que tenga AUTORIZACIÓN para ver estos datos específicos.
  //
  const headersList = await headers();
  
  // Extraer información del usuario desde headers inyectados por middleware
  const accountId = headersList.get("x-account-id") || "";
  const userRole = headersList.get("x-user-role") || headersList.get("x-effective-role") || "";
  const userEmail = headersList.get("x-user-email") || "";
  
  // Log para auditoría (en producción esto iría a un sistema de logs)
  console.log(`[DD_PREV] Intento de acceso:`, {
    accountId: accountId.substring(0, 8) + "...", // Solo primeros 8 chars por seguridad
    userRole,
    userEmail,
    timestamp: new Date().toISOString(),
  });

  // ─── CHECK 1: ¿Es admin de FocalizaHR? (bypass para soporte) ───
  if (ADMIN_BYPASS_ROLES.includes(userRole)) {
    console.log(`[DD_PREV] ✅ Acceso autorizado (rol admin): ${userRole}`);
    return <DDPrevClient userEmail={userEmail} />;
  }

  // ─── CHECK 2: ¿Es cuenta autorizada de DD? ───
  if (AUTHORIZED_ACCOUNT_IDS.includes(accountId)) {
    console.log(`[DD_PREV] ✅ Acceso autorizado (cuenta DD): ${accountId.substring(0, 8)}...`);
    return <DDPrevClient userEmail={userEmail} />;
  }

  // ─── ACCESO DENEGADO ───
  console.log(`[DD_PREV] ❌ Acceso denegado: cuenta ${accountId.substring(0, 8)}... no autorizada`);
  return <AccesoDenegado />;
}

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────
export const metadata = {
  title: "Compensaciones 2026 | Derechos Digitales",
  description: "Fichas de conversación 1:1 para el proceso de compensaciones",
  robots: "noindex, nofollow", // No indexar en buscadores
};
