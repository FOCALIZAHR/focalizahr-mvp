# 🎯 PLAN DE IMPLEMENTACIÓN: PositionAdapter
## Sistema de Mapeo de Cargos - FocalizaHR Enterprise

**Versión:** 1.2  
**Fecha:** Diciembre 2025  
**Basado en:** Arquitectura exitosa de DepartmentAdapter  
**v1.1:** Clasificación Performance Track para Evaluación de Desempeño  
**v1.2:** Integración con Employee Master + Flujo Híbrido

---

## 📋 ÍNDICE

1. [Contexto y Objetivo](#1-contexto-y-objetivo)
2. [Análisis de Arquitectura Actual](#2-análisis-de-arquitectura-actual)
3. [Diseño del PositionAdapter](#3-diseño-del-positionadapter)
4. [Taxonomía de 7 Niveles](#4-taxonomía-de-7-niveles)
5. [Cambios en Schema Prisma](#5-cambios-en-schema-prisma)
6. [Implementación del Motor](#6-implementación-del-motor)
7. [Integración con Carga de Participantes](#7-integración-con-carga-de-participantes)
8. [UI Job Mapping Review](#8-ui-job-mapping-review)
9. [Scripts de Migración](#9-scripts-de-migración)
10. [Plan de Ejecución por Días](#10-plan-de-ejecución-por-días)
11. [Clasificación Performance Track](#11-clasificación-performance-track) 🔄 SIMPLIFICADO
12. [Integración Employee Master](#12-integración-employee-master) 🆕 v1.2

---

## 1. CONTEXTO Y OBJETIVO

### 1.1 El Problema

```yaml
SITUACIÓN ACTUAL:
  Participant.position: "Jefe Operaciones Bodega"  # Input libre del cliente
  Participant.seniorityLevel: "senior"             # Legacy, manual, subjetivo

CONSECUENCIAS:
  ❌ Imposible comparar "Gerente Comercial" vs "Sales Manager" en benchmarks
  ❌ seniorityLevel es subjetivo (cada cliente define diferente)
  ❌ Reports inútiles: "El 60% de 'otros cargos' está insatisfecho"
  ❌ Zero capacidad de segmentar por nivel jerárquico real
  ❌ No hay comparabilidad cross-empresa
```

### 1.2 La Solución

```yaml
REPLICAR ARQUITECTURA EXITOSA:

  ACTUAL (Departments):
    input:       "Ventas Tienda Santiago Centro"
    adapter:     DepartmentAdapter.getGerenciaCategory()
    output:      standardCategory: "comercial"
  
  NUEVO (Positions):
    input:       "Jefe Operaciones Bodega"
    adapter:     PositionAdapter.getJobLevel()
    output:      standardJobLevel: "jefe"

BENEFICIOS:
  ✅ Benchmarking: Comparar todos los "jefe" cross-empresa
  ✅ Segmentación: Reports por nivel (Director, Gerente, Jefe, Operativo)
  ✅ Inteligencia: "El 70% de mandos_medios en Retail está en riesgo"
  ✅ Escalabilidad: Mapeo automático con motor de aliases
```

### 1.3 Principio Arquitectónico

> **"Si funciona para departments, funciona para positions"**
>
> El DepartmentAdapter ha procesado exitosamente 200+ términos de departamentos
> con 70%+ de cobertura automática. Replicamos el mismo patrón.

---

## 2. ANÁLISIS DE ARQUITECTURA ACTUAL

### 2.1 Cómo Funciona DepartmentAdapter

```typescript
// UBICACIÓN: src/lib/services/DepartmentAdapter.ts

export class DepartmentAdapter {
  
  // 🎯 8 CATEGORÍAS ESTÁNDAR
  private static gerenciaAliases = {
    'personas': ['rrhh', 'recursos humanos', 'people', 'talento', ...], // 30+ aliases
    'comercial': ['ventas', 'sales', 'business', 'revenue', ...],       // 25+ aliases
    'marketing': ['marketing', 'mercadeo', 'branding', ...],            // 20+ aliases
    'tecnologia': ['ti', 'it', 'sistemas', 'desarrollo', ...],          // 35+ aliases
    'operaciones': ['operaciones', 'logistica', 'produccion', ...],     // 30+ aliases
    'finanzas': ['finanzas', 'contabilidad', 'tesoreria', ...],         // 25+ aliases
    'servicio': ['atencion', 'soporte', 'customer', ...],               // 20+ aliases
    'legal': ['legal', 'juridico', 'compliance', ...]                   // 15+ aliases
  };
  
  // 🔥 MÉTODO PRINCIPAL - ÚNICA FUENTE DE VERDAD
  static getGerenciaCategory(displayName: string): string | null {
    if (!displayName) return null;
    
    const normalized = displayName.toLowerCase().trim();
    const categoryScores: Record<string, number> = {};
    
    // Nivel 1: Match exacto de aliases
    for (const [category, aliases] of Object.entries(this.gerenciaAliases)) {
      for (const alias of aliases) {
        if (normalized === alias) {
          return category; // Match perfecto → retorno inmediato
        }
        
        // Scoring por inclusión
        if (normalized.includes(alias) || alias.includes(normalized)) {
          categoryScores[category] = (categoryScores[category] || 0) + 10;
        }
      }
    }
    
    // Nivel 2: Retornar categoría con mayor score
    const entries = Object.entries(categoryScores);
    if (entries.length === 0) return null;
    
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][1] > 0 ? entries[0][0] : null;
  }
}
```

### 2.2 Flujo Actual de Carga

```yaml
PASO 1 - CSV contiene:
  Email, Nombre, Departamento, Cargo
  juan@empresa.com, Juan, "Ventas", "Vendedor Senior"

PASO 2 - API extrae valores únicos:
  departments: ["Ventas"]
  positions: ["Vendedor Senior"]  # ← ACTUALMENTE NO SE PROCESA

PASO 3 - Mapeo Departments:
  DepartmentAdapter.getGerenciaCategory("Ventas") → "comercial"
  Participant.departmentId → dept con standardCategory='comercial'

PASO 4 - Mapeo Positions (FALTANTE):
  ❌ NO EXISTE PositionAdapter
  ❌ position queda como string libre
  ❌ seniorityLevel es opcional/manual
```

### 2.3 Componentes a Crear (Espejo de Departments)

| Departments (EXISTE) | Positions (A CREAR) |
|---------------------|---------------------|
| `DepartmentAdapter.ts` | `PositionAdapter.ts` |
| `standardCategory` campo | `standardJobLevel` campo |
| 8 categorías | 7 niveles jerárquicos |
| 200+ aliases | 300+ aliases |
| `mapping-review` UI | `job-mapping-review` UI |
| Script migración | Script migración |

---

## 3. DISEÑO DEL POSITIONADAPTER

### 3.1 Estructura del Motor

```typescript
// UBICACIÓN: src/lib/services/PositionAdapter.ts

export interface PositionMapping {
  standardJobLevel: string | null;  // Nivel estandarizado
  mappingConfidence: number;        // 0.0 - 1.0
  mappingMethod: 'exact' | 'fuzzy' | 'historic' | 'failed';
  matchedAlias?: string;            // Para debugging
}

export class PositionAdapter {
  
  // ══════════════════════════════════════════════════════════════
  // TAXONOMÍA 7 NIVELES JERÁRQUICOS - VALIDADA POR VICTOR
  // ══════════════════════════════════════════════════════════════
  
  private static jobLevelAliases: Record<string, string[]> = {
    
    'gerente_director': [
      // NIVEL 1: C-Suite y Alta Dirección
      // ~50 aliases
    ],
    
    'subgerente_subdirector': [
      // NIVEL 2: Segunda línea
      // ~30 aliases
    ],
    
    'jefe': [
      // NIVEL 3: Jefaturas de área
      // ~40 aliases
    ],
    
    'supervisor_coordinador': [
      // NIVEL 4: Primera línea de mando
      // ~35 aliases
    ],
    
    'profesional_analista': [
      // NIVEL 5: Contribuidores individuales senior
      // ~100 aliases
    ],
    
    'asistente_otros': [
      // NIVEL 6: Soporte y administrativos
      // ~50 aliases
    ],
    
    'operativo_auxiliar': [
      // NIVEL 7: Nivel de entrada
      // ~60 aliases
    ]
  };
  
  // 🔥 MÉTODO PRINCIPAL - ÚNICA FUENTE DE VERDAD
  static getJobLevel(positionTitle: string): string | null {
    // Implementación idéntica a DepartmentAdapter.getGerenciaCategory()
  }
}
```

### 3.2 Por Qué 7 Niveles (No 5, No 10)

```yaml
ANÁLISIS VICTOR (Experiencia Real):

  ❌ 5 Niveles → Muy grueso
     - No distingue "Gerente" de "Director"
     - "Coordinador" y "Jefe" quedan juntos
     - Pierde granularidad para analytics

  ❌ 10 Niveles → Muy granular
     - Difícil mantener consistencia
     - Clientes confundidos
     - Over-engineering

  ✅ 7 Niveles → Balance perfecto
     - Suficiente granularidad para analytics
     - Colapsable a 4 para CEO
     - Alineado con jerarquías típicas Chile
     - Mantenible (350-400 aliases total)

VALIDACIÓN EMPÍRICA:
  - Retail Chile: 6-7 niveles típicos
  - Clínicas: 6-8 niveles
  - Tech: 5-7 niveles (flat)
  - Industria: 7-9 niveles
```

### 3.3 Agregación para Dashboards CEO (4 Niveles)

```typescript
// Utility para colapsar 7 → 4 niveles
export function getAcotadoLevel(standardJobLevel: string): string {
  const mapping: Record<string, string> = {
    'gerente_director': 'alta_gerencia',
    'subgerente_subdirector': 'alta_gerencia',
    
    'jefe': 'mandos_medios',
    'supervisor_coordinador': 'mandos_medios',
    
    'profesional_analista': 'profesionales',
    
    'asistente_otros': 'base_operativa',
    'operativo_auxiliar': 'base_operativa'
  };
  
  return mapping[standardJobLevel] || 'sin_clasificar';
}
```

**Visualización:**

```
┌──────────────────────────────────────────────────────────────┐
│              SEGMENTO AMPLIO (7)  →  SEGMENTO ACOTADO (4)    │
├──────────────────────────────────────────────────────────────┤
│  1. gerente_director       ─┬─►  ALTA GERENCIA               │
│  2. subgerente_subdirector ─┘                                │
├──────────────────────────────────────────────────────────────┤
│  3. jefe                   ─┬─►  MANDOS MEDIOS               │
│  4. supervisor_coordinador ─┘                                │
├──────────────────────────────────────────────────────────────┤
│  5. profesional_analista   ────►  PROFESIONALES              │
├──────────────────────────────────────────────────────────────┤
│  6. asistente_otros        ─┬─►  BASE OPERATIVA              │
│  7. operativo_auxiliar     ─┘                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. TAXONOMÍA DE 7 NIVELES

### 4.1 Nivel 1: Gerentes/Directores (`gerente_director`)

```typescript
'gerente_director': [
  // ═══ ESPAÑOL - C-SUITE ═══
  'ceo', 'chief executive officer', 'presidente ejecutivo',
  'cfo', 'chief financial officer', 
  'cto', 'chief technology officer',
  'cmo', 'chief marketing officer',
  'coo', 'chief operating officer',
  'cio', 'chief information officer',
  'chro', 'chief human resources officer',
  
  // ═══ ESPAÑOL - GERENCIA GENERAL ═══
  'gerente general', 'gerenta general',
  'director general', 'directora general',
  'director ejecutivo', 'directora ejecutiva',
  'gerente de división', 'director de división',
  
  // ═══ ESPAÑOL - GERENCIAS FUNCIONALES ═══
  'gerente', 'gerenta',
  'director', 'directora',
  'gerente de área', 'gerenta de área',
  'director de área', 'directora de área',
  
  // ═══ INGLÉS ═══
  'general manager', 'managing director',
  'executive director', 'senior director',
  'division manager', 'division director',
  'head of division', 'department head',
  'country manager', 'regional director',
  
  // ═══ SALUD ESPECÍFICO ═══
  'director médico', 'directora médica',
  'director clínico', 'directora clínica',
  'gerente médico', 'director de enfermería',
  
  // ═══ RETAIL ESPECÍFICO ═══
  'gerente de tienda', 'director de tienda',
  'gerente retail', 'gerente de sucursal',
  'director de sucursal', 'gerente regional'
]
```

**Total aliases:** ~50

### 4.2 Nivel 2: Subgerentes/Subdirectores (`subgerente_subdirector`)

```typescript
'subgerente_subdirector': [
  // ═══ ESPAÑOL ═══
  'subgerente', 'subgerenta',
  'subdirector', 'subdirectora',
  'subgerente general', 'subdirector general',
  'gerente adjunto', 'gerenta adjunta',
  'director adjunto', 'directora adjunta',
  
  // ═══ VICEPRESIDENCIAS ═══
  'vicepresidente', 'vicepresidenta',
  'vp', 'vice president',
  'vicepresidente ejecutivo', 'svp',
  'senior vice president',
  
  // ═══ INGLÉS ═══
  'deputy director', 'deputy manager',
  'assistant director', 'assistant general manager',
  'associate director', 'second in command'
]
```

**Total aliases:** ~30

### 4.3 Nivel 3: Jefes (`jefe`)

```typescript
'jefe': [
  // ═══ ESPAÑOL - JEFATURAS ═══
  'jefe', 'jefa',
  'jefe de', 'jefa de',
  'jefe de área', 'jefa de área',
  'jefe de departamento', 'jefa de departamento',
  'jefe de sección', 'jefa de sección',
  'jefe de unidad', 'jefa de unidad',
  
  // ═══ ESPAÑOL - ENCARGADOS ═══
  'encargado', 'encargada',
  'responsable', 'responsable de',
  'líder de área', 'lider de area',
  
  // ═══ INGLÉS ═══
  'head of', 'area head',
  'department head', 'section head',
  'unit head', 'team head',
  'lead', 'area lead',
  
  // ═══ SALUD ESPECÍFICO ═══
  'jefe de servicio', 'jefa de servicio',
  'jefe de pabellón', 'jefe de turno médico',
  'enfermera jefe', 'enfermero jefe',
  
  // ═══ RETAIL ESPECÍFICO ═══
  'jefe de local', 'jefa de local',
  'jefe de piso', 'jefa de piso',
  'jefe de bodega', 'jefa de bodega'
]
```

**Total aliases:** ~40

### 4.4 Nivel 4: Supervisores/Coordinadores (`supervisor_coordinador`)

```typescript
'supervisor_coordinador': [
  // ═══ ESPAÑOL - SUPERVISIÓN ═══
  'supervisor', 'supervisora',
  'supervisor de', 'supervisora de',
  'supervisor de turno', 'supervisora de turno',
  'supervisor de área', 'supervisora de área',
  'supervisor de operaciones', 'supervisora de operaciones',
  
  // ═══ ESPAÑOL - COORDINACIÓN ═══
  'coordinador', 'coordinadora',
  'coordinador de', 'coordinadora de',
  'coordinador de proyectos', 'coordinadora de proyectos',
  'coordinador de área', 'coordinadora de área',
  
  // ═══ INGLÉS ═══
  'team lead', 'team leader',
  'shift lead', 'shift leader',
  'shift supervisor', 'floor supervisor',
  'coordinator', 'project coordinator',
  
  // ═══ OPERACIONES ═══
  'capataz', 'capataza',
  'mayordomo', 'mayordoma',
  'encargado de turno', 'líder de equipo'
]
```

**Total aliases:** ~35

### 4.5 Nivel 5: Profesionales/Analistas (`profesional_analista`)

```typescript
'profesional_analista': [
  // ═══ ANALISTAS ═══
  'analista', 'analista de', 'analista senior',
  'analista de datos', 'analista de negocios',
  'analista de sistemas', 'analista financiero',
  'analista contable', 'analista de rrhh',
  
  // ═══ PROFESIONALES TÉCNICOS ═══
  'ingeniero', 'ingeniera',
  'arquitecto', 'arquitecta',
  'desarrollador', 'desarrolladora',
  'programador', 'programadora',
  'diseñador', 'diseñadora',
  
  // ═══ PROFESIONALES FUNCIONALES ═══
  'contador', 'contadora',
  'abogado', 'abogada',
  'economista', 'consultor', 'consultora',
  
  // ═══ ESPECIALISTAS ═══
  'especialista', 'especialista en',
  'especialista senior', 'experto', 'experta',
  
  // ═══ EJECUTIVOS (NO SENIOR) ═══
  'ejecutivo', 'ejecutiva',
  'ejecutivo de cuentas', 'ejecutiva de cuentas',
  'ejecutivo de ventas', 'ejecutiva de ventas',
  'ejecutivo comercial', 'ejecutiva comercial',
  
  // ═══ SALUD PROFESIONAL ═══
  'médico', 'médica', 'doctor', 'doctora',
  'enfermero', 'enfermera', // (no jefe)
  'kinesiólogo', 'kinesióloga',
  'nutricionista', 'psicólogo', 'psicóloga',
  'tecnólogo médico', 'terapeuta',
  
  // ═══ INGLÉS ═══
  'analyst', 'senior analyst',
  'engineer', 'senior engineer',
  'developer', 'senior developer',
  'specialist', 'consultant',
  'account executive', 'sales executive'
]
```

**Total aliases:** ~100

### 4.6 Nivel 6: Asistentes/Otros (`asistente_otros`)

```typescript
'asistente_otros': [
  // ═══ ASISTENTES ═══
  'asistente', 'asistente de',
  'asistente administrativo', 'asistente administrativa',
  'asistente ejecutivo', 'asistente ejecutiva',
  'asistente de gerencia', 'asistente contable',
  
  // ═══ SECRETARIAS ═══
  'secretaria', 'secretario',
  'secretaria ejecutiva', 'secretario ejecutivo',
  'secretaria de gerencia', 'recepcionista',
  
  // ═══ ADMINISTRATIVOS ═══
  'administrativo', 'administrativa',
  'administrativo contable', 'administrativa de personal',
  'auxiliar administrativo', 'auxiliar administrativa',
  
  // ═══ TÉCNICOS ═══
  'técnico', 'técnica',
  'técnico de', 'técnica de',
  'técnico en', 'técnica en',
  
  // ═══ SALUD TÉCNICO ═══
  'paramédico', 'tens',
  'auxiliar de enfermería', 'técnico paramédico',
  
  // ═══ INGLÉS ═══
  'assistant', 'administrative assistant',
  'executive assistant', 'secretary',
  'receptionist', 'clerk'
]
```

**Total aliases:** ~50

### 4.7 Nivel 7: Operativos/Auxiliares (`operativo_auxiliar`)

```typescript
'operativo_auxiliar': [
  // ═══ OPERARIOS ═══
  'operario', 'operaria',
  'operador', 'operadora',
  'operador de máquinas', 'operador de producción',
  
  // ═══ AUXILIARES ═══
  'auxiliar', 'auxiliar de',
  'auxiliar de bodega', 'auxiliar de aseo',
  'auxiliar de servicios', 'auxiliar de cocina',
  
  // ═══ RETAIL PISO ═══
  'vendedor', 'vendedora',
  'cajero', 'cajera',
  'repositor', 'repositora',
  'promotor', 'promotora',
  'reponedor', 'reponedora',
  
  // ═══ LOGÍSTICA ═══
  'bodeguero', 'bodeguera',
  'despachador', 'despachadora',
  'picker', 'packer',
  'estibador', 'cargador',
  
  // ═══ SERVICIOS ═══
  'guardia', 'vigilante',
  'conserje', 'portero', 'portera',
  'aseador', 'aseadora',
  'chofer', 'conductor', 'conductora',
  'mensajero', 'mensajera',
  
  // ═══ NIVEL ENTRADA ═══
  'junior', 'trainee',
  'practicante', 'becario', 'becaria',
  'aprendiz', 'interno', 'interna',
  
  // ═══ INGLÉS ═══
  'operator', 'warehouse worker',
  'cashier', 'sales associate',
  'driver', 'cleaner', 'janitor',
  'security guard', 'intern'
]
```

**Total aliases:** ~60

---

## 5. CAMBIOS EN SCHEMA PRISMA

### 5.1 Modelo Participant (Modificación)

```prisma
// prisma/schema.prisma

model Participant {
  id          String  @id @default(cuid())
  campaignId  String  @map("campaign_id")
  email       String?
  uniqueToken String  @unique @map("unique_token")
  name        String?
  nationalId  String  @map("national_id")
  phoneNumber String? @map("phone_number")

  // ═══ SEGMENTACIÓN - CAMPOS EXISTENTES ═══
  department     String?
  position       String?                          // Input libre del cliente
  seniorityLevel String? @map("seniority_level")  // Legacy - NO TOCAR
  location       String?
  
  // ═══ 🆕 NUEVO CAMPO - MAPEO ESTANDARIZADO ═══
  standardJobLevel String? @map("standard_job_level")
  // Valores: 'gerente_director' | 'subgerente_subdirector' | 'jefe' |
  //          'supervisor_coordinador' | 'profesional_analista' | 
  //          'asistente_otros' | 'operativo_auxiliar' | 'sin_asignar'
  
  // ═══ 🆕 METADATA DE MAPEO ═══
  jobMappingMethod     String?   @map("job_mapping_method")     // 'exact'|'fuzzy'|'historic'|'manual'
  jobMappingConfidence Float?    @map("job_mapping_confidence") // 0.0-1.0
  jobMappedAt          DateTime? @map("job_mapped_at")

  // ... resto de campos existentes ...

  // ═══ 🆕 NUEVO ÍNDICE ═══
  @@index([campaignId, standardJobLevel])
  @@index([standardJobLevel])
  
  @@map("participants")
}
```

### 5.2 Modelo JobMappingHistory (Nuevo)

```prisma
// prisma/schema.prisma

// ═══════════════════════════════════════════════════════════════
// 🆕 NUEVO MODELO: Historial de Mapeo para Feedback Loop
// ═══════════════════════════════════════════════════════════════

model JobMappingHistory {
  id                  String   @id @default(cuid())
  accountId           String   @map("account_id")
  
  // Input original del cliente
  clientPositionTitle String   @map("client_position_title")  // "Jefe Bodega Central"
  
  // Mapeo resultante
  standardJobLevel    String   @map("standard_job_level")     // "jefe"
  
  // Metadata de mapeo
  mappingMethod       String   @map("mapping_method")         // 'manual'|'algorithm'|'historic'
  confidence          Float    @default(1.0)
  correctedBy         String?  @map("corrected_by")           // Email admin que corrigió
  
  // Auditoría
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  // Constraints
  @@unique([accountId, clientPositionTitle])
  @@index([accountId])
  @@index([standardJobLevel])
  @@map("job_mapping_history")
}
```

### 5.3 Migración SQL

```sql
-- Paso 1: Agregar nuevos campos a Participant
ALTER TABLE participants 
ADD COLUMN standard_job_level VARCHAR(50),
ADD COLUMN job_mapping_method VARCHAR(20),
ADD COLUMN job_mapping_confidence FLOAT,
ADD COLUMN job_mapped_at TIMESTAMP;

-- Paso 2: Crear índices
CREATE INDEX idx_participants_job_level 
ON participants(campaign_id, standard_job_level);

CREATE INDEX idx_participants_standard_job 
ON participants(standard_job_level);

-- Paso 3: Crear tabla JobMappingHistory
CREATE TABLE job_mapping_history (
  id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  account_id VARCHAR(30) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_position_title VARCHAR(255) NOT NULL,
  standard_job_level VARCHAR(50) NOT NULL,
  mapping_method VARCHAR(20) NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  corrected_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(account_id, client_position_title)
);

CREATE INDEX idx_job_mapping_account ON job_mapping_history(account_id);
CREATE INDEX idx_job_mapping_level ON job_mapping_history(standard_job_level);
```

---

## 6. IMPLEMENTACIÓN DEL MOTOR

### 6.1 PositionAdapter.ts Completo

```typescript
// src/lib/services/PositionAdapter.ts

import { prisma } from '@/lib/prisma';

// ════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════

export interface PositionMapping {
  standardJobLevel: string | null;
  mappingConfidence: number;
  mappingMethod: 'exact' | 'fuzzy' | 'historic' | 'failed';
  matchedAlias?: string;
}

interface JobLevelConfig {
  label_es: string;
  label_en: string;
  order: number;  // Para ordenamiento en UI
}

// ════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ════════════════════════════════════════════════════════════════

export class PositionAdapter {
  
  // ══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE NIVELES
  // ══════════════════════════════════════════════════════════════
  
  static readonly JOB_LEVEL_CONFIG: Record<string, JobLevelConfig> = {
    'gerente_director': { 
      label_es: 'Gerentes/Directores', 
      label_en: 'Managers/Directors',
      order: 1 
    },
    'subgerente_subdirector': { 
      label_es: 'Subgerentes/Subdirectores', 
      label_en: 'Deputy Managers/Directors',
      order: 2 
    },
    'jefe': { 
      label_es: 'Jefes', 
      label_en: 'Heads/Chiefs',
      order: 3 
    },
    'supervisor_coordinador': { 
      label_es: 'Supervisores/Coordinadores', 
      label_en: 'Supervisors/Coordinators',
      order: 4 
    },
    'profesional_analista': { 
      label_es: 'Profesionales/Analistas', 
      label_en: 'Professionals/Analysts',
      order: 5 
    },
    'asistente_otros': { 
      label_es: 'Asistentes/Administrativos', 
      label_en: 'Assistants/Administrative',
      order: 6 
    },
    'operativo_auxiliar': { 
      label_es: 'Operativos/Auxiliares', 
      label_en: 'Operatives/Entry Level',
      order: 7 
    }
  };

  // ══════════════════════════════════════════════════════════════
  // SISTEMA DE ALIASES - 350+ TÉRMINOS
  // ══════════════════════════════════════════════════════════════
  
  private static jobLevelAliases: Record<string, string[]> = {
    
    'gerente_director': [
      // C-Suite
      'ceo', 'chief executive officer', 'presidente ejecutivo',
      'cfo', 'chief financial officer',
      'cto', 'chief technology officer',
      'cmo', 'chief marketing officer',
      'coo', 'chief operating officer',
      'cio', 'chief information officer',
      'chro', 'chief human resources officer',
      // Gerencia General
      'gerente general', 'gerenta general',
      'director general', 'directora general',
      'director ejecutivo', 'directora ejecutiva',
      'gerente de división', 'director de división',
      // Gerencias Funcionales
      'gerente', 'gerenta',
      'director', 'directora',
      'gerente de área', 'gerenta de área',
      'director de área', 'directora de área',
      // Inglés
      'general manager', 'managing director',
      'executive director', 'senior director',
      'division manager', 'division director',
      'head of division', 'department head',
      'country manager', 'regional director',
      // Salud
      'director médico', 'directora médica',
      'director clínico', 'directora clínica',
      'gerente médico', 'director de enfermería',
      // Retail
      'gerente de tienda', 'director de tienda',
      'gerente retail', 'gerente de sucursal',
      'director de sucursal', 'gerente regional'
    ],
    
    'subgerente_subdirector': [
      'subgerente', 'subgerenta',
      'subdirector', 'subdirectora',
      'subgerente general', 'subdirector general',
      'gerente adjunto', 'gerenta adjunta',
      'director adjunto', 'directora adjunta',
      'vicepresidente', 'vicepresidenta',
      'vp', 'vice president',
      'vicepresidente ejecutivo', 'svp',
      'senior vice president',
      'deputy director', 'deputy manager',
      'assistant director', 'assistant general manager',
      'associate director', 'second in command'
    ],
    
    'jefe': [
      'jefe', 'jefa',
      'jefe de', 'jefa de',
      'jefe de área', 'jefa de área',
      'jefe de departamento', 'jefa de departamento',
      'jefe de sección', 'jefa de sección',
      'jefe de unidad', 'jefa de unidad',
      'encargado', 'encargada',
      'responsable', 'responsable de',
      'líder de área', 'lider de area',
      'head of', 'area head',
      'department head', 'section head',
      'unit head', 'team head',
      'lead', 'area lead',
      // Salud
      'jefe de servicio', 'jefa de servicio',
      'jefe de pabellón', 'jefe de turno médico',
      'enfermera jefe', 'enfermero jefe',
      // Retail
      'jefe de local', 'jefa de local',
      'jefe de piso', 'jefa de piso',
      'jefe de bodega', 'jefa de bodega'
    ],
    
    'supervisor_coordinador': [
      'supervisor', 'supervisora',
      'supervisor de', 'supervisora de',
      'supervisor de turno', 'supervisora de turno',
      'supervisor de área', 'supervisora de área',
      'supervisor de operaciones', 'supervisora de operaciones',
      'coordinador', 'coordinadora',
      'coordinador de', 'coordinadora de',
      'coordinador de proyectos', 'coordinadora de proyectos',
      'coordinador de área', 'coordinadora de área',
      'team lead', 'team leader',
      'shift lead', 'shift leader',
      'shift supervisor', 'floor supervisor',
      'coordinator', 'project coordinator',
      'capataz', 'capataza',
      'mayordomo', 'mayordoma',
      'encargado de turno', 'líder de equipo'
    ],
    
    'profesional_analista': [
      // Analistas
      'analista', 'analista de', 'analista senior',
      'analista de datos', 'analista de negocios',
      'analista de sistemas', 'analista financiero',
      'analista contable', 'analista de rrhh',
      // Profesionales Técnicos
      'ingeniero', 'ingeniera',
      'arquitecto', 'arquitecta',
      'desarrollador', 'desarrolladora',
      'programador', 'programadora',
      'diseñador', 'diseñadora',
      // Profesionales Funcionales
      'contador', 'contadora',
      'abogado', 'abogada',
      'economista', 'consultor', 'consultora',
      // Especialistas
      'especialista', 'especialista en',
      'especialista senior', 'experto', 'experta',
      // Ejecutivos (no senior)
      'ejecutivo', 'ejecutiva',
      'ejecutivo de cuentas', 'ejecutiva de cuentas',
      'ejecutivo de ventas', 'ejecutiva de ventas',
      'ejecutivo comercial', 'ejecutiva comercial',
      // Salud Profesional
      'médico', 'médica', 'doctor', 'doctora',
      'enfermero', 'enfermera',
      'kinesiólogo', 'kinesióloga',
      'nutricionista', 'psicólogo', 'psicóloga',
      'tecnólogo médico', 'terapeuta',
      // Inglés
      'analyst', 'senior analyst',
      'engineer', 'senior engineer',
      'developer', 'senior developer',
      'specialist', 'consultant',
      'account executive', 'sales executive'
    ],
    
    'asistente_otros': [
      'asistente', 'asistente de',
      'asistente administrativo', 'asistente administrativa',
      'asistente ejecutivo', 'asistente ejecutiva',
      'asistente de gerencia', 'asistente contable',
      'secretaria', 'secretario',
      'secretaria ejecutiva', 'secretario ejecutivo',
      'secretaria de gerencia', 'recepcionista',
      'administrativo', 'administrativa',
      'administrativo contable', 'administrativa de personal',
      'auxiliar administrativo', 'auxiliar administrativa',
      'técnico', 'técnica',
      'técnico de', 'técnica de',
      'técnico en', 'técnica en',
      'paramédico', 'tens',
      'auxiliar de enfermería', 'técnico paramédico',
      'assistant', 'administrative assistant',
      'executive assistant', 'secretary',
      'receptionist', 'clerk'
    ],
    
    'operativo_auxiliar': [
      // Operarios
      'operario', 'operaria',
      'operador', 'operadora',
      'operador de máquinas', 'operador de producción',
      // Auxiliares
      'auxiliar', 'auxiliar de',
      'auxiliar de bodega', 'auxiliar de aseo',
      'auxiliar de servicios', 'auxiliar de cocina',
      // Retail Piso
      'vendedor', 'vendedora',
      'cajero', 'cajera',
      'repositor', 'repositora',
      'promotor', 'promotora',
      'reponedor', 'reponedora',
      // Logística
      'bodeguero', 'bodeguera',
      'despachador', 'despachadora',
      'picker', 'packer',
      'estibador', 'cargador',
      // Servicios
      'guardia', 'vigilante',
      'conserje', 'portero', 'portera',
      'aseador', 'aseadora',
      'chofer', 'conductor', 'conductora',
      'mensajero', 'mensajera',
      // Nivel Entrada
      'junior', 'trainee',
      'practicante', 'becario', 'becaria',
      'aprendiz', 'interno', 'interna',
      // Inglés
      'operator', 'warehouse worker',
      'cashier', 'sales associate',
      'driver', 'cleaner', 'janitor',
      'security guard', 'intern'
    ]
  };

  // ══════════════════════════════════════════════════════════════
  // KEYWORDS FUERTES (Mayor peso en scoring)
  // ══════════════════════════════════════════════════════════════
  
  private static strongKeywords: Record<string, string[]> = {
    'gerente_director': ['gerente', 'director', 'ceo', 'cfo', 'cto'],
    'subgerente_subdirector': ['subgerente', 'subdirector', 'vicepresidente', 'vp'],
    'jefe': ['jefe', 'jefa', 'encargado', 'responsable'],
    'supervisor_coordinador': ['supervisor', 'coordinador', 'team lead'],
    'profesional_analista': ['analista', 'ingeniero', 'especialista', 'ejecutivo'],
    'asistente_otros': ['asistente', 'secretaria', 'administrativo', 'técnico'],
    'operativo_auxiliar': ['operario', 'auxiliar', 'vendedor', 'cajero', 'junior']
  };

  // ══════════════════════════════════════════════════════════════
  // MÉTODO PRINCIPAL - ÚNICA FUENTE DE VERDAD
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Mapea un cargo libre a un nivel jerárquico estandarizado
   * @param positionTitle - Cargo tal como viene del cliente
   * @returns standardJobLevel o null si no hay match
   */
  static getJobLevel(positionTitle: string): string | null {
    if (!positionTitle) return null;
    
    // Normalización
    const normalized = positionTitle
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
    
    const levelScores: Record<string, number> = {};
    
    // ═══ NIVEL 1: Match exacto de frase completa ═══
    for (const [level, aliases] of Object.entries(this.jobLevelAliases)) {
      if (aliases.includes(normalized)) {
        console.log(`✅ [PositionAdapter] Match exacto: "${positionTitle}" → ${level}`);
        return level;
      }
    }
    
    // ═══ NIVEL 2: Scoring por palabras clave ═══
    const words = normalized.split(/[\s\-_\/]+/).filter(w => w.length > 1);
    
    for (const word of words) {
      for (const [level, aliases] of Object.entries(this.jobLevelAliases)) {
        // Keyword fuerte: +10 puntos
        if (this.strongKeywords[level]?.includes(word)) {
          levelScores[level] = (levelScores[level] || 0) + 10;
        }
        // Alias general: +3 puntos
        else if (aliases.includes(word)) {
          levelScores[level] = (levelScores[level] || 0) + 3;
        }
        // Contiene alias: +1 punto
        else if (aliases.some(alias => alias.includes(word) || word.includes(alias))) {
          levelScores[level] = (levelScores[level] || 0) + 1;
        }
      }
    }
    
    // ═══ NIVEL 3: Determinar ganador ═══
    if (Object.keys(levelScores).length === 0) {
      console.warn(`⚠️ [PositionAdapter] Sin mapeo: "${positionTitle}"`);
      return null;
    }
    
    const sortedScores = Object.entries(levelScores).sort((a, b) => b[1] - a[1]);
    const [bestLevel, bestScore] = sortedScores[0];
    const secondMatch = sortedScores[1];
    
    // Regla de ambigüedad
    if (secondMatch && bestScore < secondMatch[1] * 2) {
      console.warn(`⚠️ [PositionAdapter] Mapeo ambiguo: "${positionTitle}" - Scores:`, levelScores);
      return null;
    }
    
    console.log(`🧠 [PositionAdapter] Match por scoring: "${positionTitle}" → ${bestLevel} (Score: ${bestScore})`);
    return bestLevel;
  }

  // ══════════════════════════════════════════════════════════════
  // MÉTODO COMPLETO CON HISTÓRICO
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Mapea posición con prioridad: histórico > algoritmo
   */
  static async mapPosition(
    positionTitle: string,
    accountId: string
  ): Promise<PositionMapping> {
    
    if (!positionTitle) {
      return {
        standardJobLevel: null,
        mappingConfidence: 0,
        mappingMethod: 'failed'
      };
    }
    
    const normalizedTitle = positionTitle.toLowerCase().trim();
    
    // ═══ PRIORIDAD 1: Buscar en histórico (feedback loop) ═══
    const historicMapping = await prisma.jobMappingHistory.findUnique({
      where: {
        accountId_clientPositionTitle: {
          accountId,
          clientPositionTitle: normalizedTitle
        }
      }
    });
    
    if (historicMapping) {
      console.log(`📚 [PositionAdapter] Match histórico: "${positionTitle}" → ${historicMapping.standardJobLevel}`);
      return {
        standardJobLevel: historicMapping.standardJobLevel,
        mappingConfidence: 1.0,
        mappingMethod: 'historic'
      };
    }
    
    // ═══ PRIORIDAD 2: Algoritmo de aliases ═══
    const algorithmResult = this.getJobLevel(positionTitle);
    
    if (algorithmResult) {
      return {
        standardJobLevel: algorithmResult,
        mappingConfidence: 0.85,
        mappingMethod: 'exact'
      };
    }
    
    // ═══ FALLBACK: Sin mapeo ═══
    return {
      standardJobLevel: null,
      mappingConfidence: 0,
      mappingMethod: 'failed'
    };
  }

  // ══════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Obtiene el label en español para un nivel
   */
  static getLevelLabel(standardJobLevel: string, lang: 'es' | 'en' = 'es'): string {
    const config = this.JOB_LEVEL_CONFIG[standardJobLevel];
    if (!config) return 'Sin Clasificar';
    return lang === 'es' ? config.label_es : config.label_en;
  }
  
  /**
   * Agrega mapeo al histórico (feedback loop)
   */
  static async saveToHistory(
    accountId: string,
    clientPositionTitle: string,
    standardJobLevel: string,
    correctedBy?: string
  ): Promise<void> {
    await prisma.jobMappingHistory.upsert({
      where: {
        accountId_clientPositionTitle: {
          accountId,
          clientPositionTitle: clientPositionTitle.toLowerCase().trim()
        }
      },
      create: {
        accountId,
        clientPositionTitle: clientPositionTitle.toLowerCase().trim(),
        standardJobLevel,
        mappingMethod: correctedBy ? 'manual' : 'algorithm',
        confidence: correctedBy ? 1.0 : 0.85,
        correctedBy
      },
      update: {
        standardJobLevel,
        mappingMethod: 'manual',
        confidence: 1.0,
        correctedBy
      }
    });
  }
  
  /**
   * Debug: Muestra estadísticas del sistema de aliases
   */
  static debugAliases(): void {
    console.log('📋 SISTEMA DE ALIASES PARA 7 NIVELES JERÁRQUICOS:');
    console.log('═══════════════════════════════════════════════════');
    
    let totalAliases = 0;
    
    for (const [level, aliases] of Object.entries(this.jobLevelAliases)) {
      console.log(`\n👔 NIVEL: ${level.toUpperCase()}`);
      console.log(`   Label: ${this.JOB_LEVEL_CONFIG[level].label_es}`);
      console.log(`   Total aliases: ${aliases.length}`);
      console.log(`   Muestra: ${aliases.slice(0, 8).join(', ')}...`);
      totalAliases += aliases.length;
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`📊 TOTAL ALIASES EN SISTEMA: ${totalAliases}`);
    console.log('═══════════════════════════════════════════════════');
  }
}

// ════════════════════════════════════════════════════════════════
// UTILITY: Agregación 7 → 4 niveles
// ════════════════════════════════════════════════════════════════

export function getAcotadoLevel(standardJobLevel: string): string {
  const mapping: Record<string, string> = {
    'gerente_director': 'alta_gerencia',
    'subgerente_subdirector': 'alta_gerencia',
    'jefe': 'mandos_medios',
    'supervisor_coordinador': 'mandos_medios',
    'profesional_analista': 'profesionales',
    'asistente_otros': 'base_operativa',
    'operativo_auxiliar': 'base_operativa'
  };
  
  return mapping[standardJobLevel] || 'sin_clasificar';
}

export const ACOTADO_LABELS: Record<string, string> = {
  'alta_gerencia': 'Alta Gerencia',
  'mandos_medios': 'Mandos Medios',
  'profesionales': 'Profesionales',
  'base_operativa': 'Base Operativa',
  'sin_clasificar': 'Sin Clasificar'
};
```

---

## 7. INTEGRACIÓN CON CARGA DE PARTICIPANTES

### 7.1 Modificar API de Carga

```typescript
// src/app/api/campaigns/[id]/participants/route.ts

import { PositionAdapter } from '@/lib/services/PositionAdapter';

// Dentro del POST handler, después de mapear departments:

// ═══ MAPEO DE POSITIONS (NUEVO) ═══
const participantsWithMapping = await Promise.all(
  parsedRows.map(async (row) => {
    // Mapear department (existente)
    const departmentId = departmentMapping[row.department] || fallbackDeptId;
    
    // 🆕 MAPEAR POSITION (NUEVO)
    const positionMapping = await PositionAdapter.mapPosition(
      row.position,
      accountId
    );
    
    return {
      email: row.email,
      fullName: row.fullName,
      nationalId: row.nationalId,
      phoneNumber: row.phoneNumber,
      position: row.position,              // Original (input libre)
      departmentId,
      location: row.location,
      
      // 🆕 CAMPOS NUEVOS
      standardJobLevel: positionMapping.standardJobLevel,
      jobMappingMethod: positionMapping.mappingMethod,
      jobMappingConfidence: positionMapping.mappingConfidence,
      jobMappedAt: new Date()
    };
  })
);

// ═══ REPORTE DE CALIDAD DE MAPEO ═══
const jobMappingStats = {
  total: participantsWithMapping.length,
  mapped: participantsWithMapping.filter(p => p.standardJobLevel).length,
  unmapped: participantsWithMapping.filter(p => !p.standardJobLevel).length,
  byMethod: {
    historic: participantsWithMapping.filter(p => p.jobMappingMethod === 'historic').length,
    exact: participantsWithMapping.filter(p => p.jobMappingMethod === 'exact').length,
    failed: participantsWithMapping.filter(p => p.jobMappingMethod === 'failed').length
  },
  avgConfidence: (
    participantsWithMapping.reduce((sum, p) => sum + (p.jobMappingConfidence || 0), 0) /
    participantsWithMapping.length
  ).toFixed(2)
};

// Agregar al response
return NextResponse.json({
  success: true,
  participantsLoaded: participantsWithMapping.length,
  jobMappingQuality: jobMappingStats,
  unmappedPositions: participantsWithMapping
    .filter(p => !p.standardJobLevel)
    .map(p => p.position)
    .filter((v, i, a) => a.indexOf(v) === i), // Unique
  message: jobMappingStats.unmapped > 0 
    ? `⚠️ ${jobMappingStats.unmapped} cargos requieren revisión manual`
    : '✅ Todos los cargos mapeados exitosamente'
});
```

### 7.2 Reporte de Calidad en Frontend

```typescript
// En el componente de upload, mostrar:

{uploadResult?.jobMappingQuality && (
  <div className="fhr-card mt-4">
    <h4 className="fhr-title-gradient text-lg mb-3">
      📊 Calidad de Mapeo de Cargos
    </h4>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard 
        label="Mapeados" 
        value={uploadResult.jobMappingQuality.mapped}
        total={uploadResult.jobMappingQuality.total}
        color="green"
      />
      <MetricCard 
        label="Sin Mapear" 
        value={uploadResult.jobMappingQuality.unmapped}
        total={uploadResult.jobMappingQuality.total}
        color={uploadResult.jobMappingQuality.unmapped > 0 ? "yellow" : "green"}
      />
      <MetricCard 
        label="Confianza Promedio" 
        value={`${(uploadResult.jobMappingQuality.avgConfidence * 100).toFixed(0)}%`}
        color="cyan"
      />
    </div>
    
    {uploadResult.unmappedPositions?.length > 0 && (
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400 text-sm mb-2">
          ⚠️ Cargos sin mapear (requieren revisión):
        </p>
        <ul className="text-slate-300 text-sm">
          {uploadResult.unmappedPositions.slice(0, 5).map((pos, i) => (
            <li key={i}>• {pos}</li>
          ))}
          {uploadResult.unmappedPositions.length > 5 && (
            <li className="text-slate-500">
              ... y {uploadResult.unmappedPositions.length - 5} más
            </li>
          )}
        </ul>
        <Link 
          href="/dashboard/admin/job-mapping-review"
          className="fhr-btn-secondary mt-3 inline-block"
        >
          Revisar Mapeo de Cargos →
        </Link>
      </div>
    )}
  </div>
)}
```

---

## 8. UI JOB MAPPING REVIEW

### 8.1 Página Principal

```typescript
// src/app/dashboard/admin/job-mapping-review/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { PositionAdapter } from '@/lib/services/PositionAdapter';

interface UnmappedPosition {
  position: string;
  participantCount: number;
  suggestedLevel: string | null;
  accountId: string;
  companyName: string;
}

export default function JobMappingReviewPage() {
  const [unmappedPositions, setUnmappedPositions] = useState<UnmappedPosition[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUnmappedPositions();
  }, []);
  
  const fetchUnmappedPositions = async () => {
    const res = await fetch('/api/admin/job-mapping-review');
    const data = await res.json();
    setUnmappedPositions(data.data);
    setLoading(false);
  };
  
  const handleAssignLevel = async (position: string, accountId: string, level: string) => {
    await fetch('/api/admin/job-mapping-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, accountId, standardJobLevel: level })
    });
    
    // Actualizar lista
    fetchUnmappedPositions();
  };
  
  const JOB_LEVELS = Object.entries(PositionAdapter.JOB_LEVEL_CONFIG);
  
  return (
    <div className="p-6">
      <h1 className="fhr-title-gradient text-2xl mb-6">
        👔 Revisión de Mapeo de Cargos
      </h1>
      
      <p className="text-slate-400 mb-6">
        Los siguientes cargos no pudieron ser clasificados automáticamente.
        Asigne manualmente el nivel jerárquico correspondiente.
      </p>
      
      {loading ? (
        <div className="fhr-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        </div>
      ) : unmappedPositions.length === 0 ? (
        <div className="fhr-card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-400">¡Todos los cargos están clasificados!</p>
        </div>
      ) : (
        <div className="fhr-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left p-4 text-slate-300">Cargo Original</th>
                <th className="text-left p-4 text-slate-300">Empresa</th>
                <th className="text-center p-4 text-slate-300">Participantes</th>
                <th className="text-left p-4 text-slate-300">Sugerencia</th>
                <th className="text-left p-4 text-slate-300">Asignar Nivel</th>
              </tr>
            </thead>
            <tbody>
              {unmappedPositions.map((item, idx) => (
                <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-4 font-medium text-white">
                    {item.position}
                  </td>
                  <td className="p-4 text-slate-400">
                    {item.companyName}
                  </td>
                  <td className="p-4 text-center">
                    <span className="fhr-badge-active">
                      {item.participantCount}
                    </span>
                  </td>
                  <td className="p-4">
                    {item.suggestedLevel ? (
                      <span className="text-cyan-400">
                        {PositionAdapter.getLevelLabel(item.suggestedLevel)}
                      </span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      onChange={(e) => handleAssignLevel(
                        item.position, 
                        item.accountId, 
                        e.target.value
                      )}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccionar nivel...</option>
                      {JOB_LEVELS.map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label_es}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### 8.2 API Job Mapping Review

```typescript
// src/app/api/admin/job-mapping-review/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PositionAdapter } from '@/lib/services/PositionAdapter';

// GET: Obtener posiciones sin mapear
export async function GET(request: NextRequest) {
  try {
    // Agrupar por position donde standardJobLevel es null
    const unmapped = await prisma.participant.groupBy({
      by: ['position', 'campaignId'],
      where: {
        position: { not: null },
        standardJobLevel: null
      },
      _count: { id: true }
    });
    
    // Enriquecer con datos de empresa
    const enriched = await Promise.all(
      unmapped.map(async (item) => {
        const campaign = await prisma.campaign.findUnique({
          where: { id: item.campaignId },
          include: { account: true }
        });
        
        const suggestedLevel = PositionAdapter.getJobLevel(item.position!);
        
        return {
          position: item.position,
          participantCount: item._count.id,
          accountId: campaign?.accountId,
          companyName: campaign?.account?.companyName || 'N/A',
          suggestedLevel
        };
      })
    );
    
    // Consolidar por position + account
    const consolidated = enriched.reduce((acc, item) => {
      const key = `${item.accountId}-${item.position}`;
      if (!acc[key]) {
        acc[key] = item;
      } else {
        acc[key].participantCount += item.participantCount;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json({
      success: true,
      data: Object.values(consolidated)
    });
    
  } catch (error) {
    console.error('[JobMappingReview] Error:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

// POST: Asignar nivel manualmente
export async function POST(request: NextRequest) {
  try {
    const { position, accountId, standardJobLevel, correctedBy } = await request.json();
    
    // 1. Guardar en histórico (feedback loop)
    await PositionAdapter.saveToHistory(
      accountId,
      position,
      standardJobLevel,
      correctedBy || 'admin@focalizahr.com'
    );
    
    // 2. Actualizar todos los participants con ese cargo
    const updated = await prisma.participant.updateMany({
      where: {
        position: { equals: position, mode: 'insensitive' },
        campaign: { accountId }
      },
      data: {
        standardJobLevel,
        jobMappingMethod: 'manual',
        jobMappingConfidence: 1.0,
        jobMappedAt: new Date()
      }
    });
    
    // 3. Audit log
    await prisma.auditLog.create({
      data: {
        accountId,
        action: 'job_level_manual_assignment',
        entityType: 'participant',
        newValues: {
          position,
          standardJobLevel,
          participantsUpdated: updated.count
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      updated: updated.count,
      message: `✅ ${updated.count} participantes actualizados`
    });
    
  } catch (error) {
    console.error('[JobMappingReview] Error:', error);
    return NextResponse.json({ error: 'Error updating' }, { status: 500 });
  }
}
```

---

## 9. SCRIPTS DE MIGRACIÓN

### 9.1 Script Principal

```typescript
// scripts/migrate-job-levels.ts

import { prisma } from '../src/lib/prisma';
import { PositionAdapter } from '../src/lib/services/PositionAdapter';

async function migrateJobLevels() {
  console.log('🔄 Iniciando migración de niveles de cargo...\n');
  
  // 1. Obtener todos los participants con position pero sin standardJobLevel
  const participants = await prisma.participant.findMany({
    where: {
      position: { not: null },
      standardJobLevel: null
    },
    select: {
      id: true,
      position: true,
      campaign: {
        select: { accountId: true }
      }
    }
  });
  
  console.log(`📊 ${participants.length} participantes a migrar\n`);
  
  let mapped = 0;
  let unmapped = 0;
  const unmappedPositions: string[] = [];
  
  // 2. Procesar en batches de 100
  const batchSize = 100;
  for (let i = 0; i < participants.length; i += batchSize) {
    const batch = participants.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (p) => {
      const mapping = await PositionAdapter.mapPosition(
        p.position!,
        p.campaign.accountId
      );
      
      if (mapping.standardJobLevel) {
        await prisma.participant.update({
          where: { id: p.id },
          data: {
            standardJobLevel: mapping.standardJobLevel,
            jobMappingMethod: mapping.mappingMethod,
            jobMappingConfidence: mapping.mappingConfidence,
            jobMappedAt: new Date()
          }
        });
        mapped++;
      } else {
        unmapped++;
        if (!unmappedPositions.includes(p.position!)) {
          unmappedPositions.push(p.position!);
        }
      }
    }));
    
    console.log(`   Procesados: ${Math.min(i + batchSize, participants.length)}/${participants.length}`);
  }
  
  // 3. Reporte final
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📈 RESUMEN DE MIGRACIÓN:');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Mapeados exitosamente: ${mapped}`);
  console.log(`⚠️ Sin mapear: ${unmapped}`);
  console.log(`📊 Tasa de éxito: ${((mapped / participants.length) * 100).toFixed(1)}%`);
  
  if (unmappedPositions.length > 0) {
    console.log('\n⚠️ CARGOS SIN MAPEAR (requieren revisión manual):');
    unmappedPositions.slice(0, 20).forEach(pos => {
      console.log(`   • "${pos}"`);
    });
    if (unmappedPositions.length > 20) {
      console.log(`   ... y ${unmappedPositions.length - 20} más`);
    }
  }
  
  console.log('\n✅ Migración completada');
}

migrateJobLevels()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 9.2 Ejecución

```bash
# Ejecutar migración
npx tsx scripts/migrate-job-levels.ts

# Output esperado:
# 🔄 Iniciando migración de niveles de cargo...
# 
# 📊 2,450 participantes a migrar
# 
#    Procesados: 100/2450
#    Procesados: 200/2450
#    ...
# 
# ═══════════════════════════════════════════════════
# 📈 RESUMEN DE MIGRACIÓN:
# ═══════════════════════════════════════════════════
# ✅ Mapeados exitosamente: 2,156
# ⚠️ Sin mapear: 294
# 📊 Tasa de éxito: 88.0%
# 
# ⚠️ CARGOS SIN MAPEAR (requieren revisión manual):
#    • "Encargado Bodega Central Zona Sur"
#    • "Profesional Grado 8"
#    • "Operador Máquina CNC Turno B"
#    ... y 47 más
# 
# ✅ Migración completada
```

---

## 10. PLAN DE EJECUCIÓN POR DÍAS

### DÍA 1: Preparación Schema y Motor Base

```yaml
TAREAS:
  1. Actualizar prisma/schema.prisma:
     - Agregar campo standardJobLevel a Participant
     - Agregar campos metadata (method, confidence, mappedAt)
     - Crear modelo JobMappingHistory
     
  2. Crear migración:
     - npx prisma migrate dev --name add_job_level_fields
     
  3. Crear PositionAdapter.ts base:
     - Estructura de clase
     - Sistema de aliases (7 niveles)
     - Método getJobLevel() básico
     
  4. Testing unitario:
     - Probar 20+ cargos conocidos
     - Verificar scoring funciona

ENTREGABLE:
  ✅ Schema migrado
  ✅ Motor básico funcionando
  ✅ Tests pasando
```

### DÍA 2: Integración con Carga de Participantes

```yaml
TAREAS:
  1. Modificar API carga participantes:
     - Importar PositionAdapter
     - Llamar mapPosition() para cada row
     - Incluir campos nuevos en createMany
     
  2. Actualizar response:
     - Agregar jobMappingQuality stats
     - Listar unmappedPositions
     
  3. Actualizar frontend upload:
     - Mostrar reporte de calidad
     - Link a job-mapping-review

ENTREGABLE:
  ✅ Nueva carga mapea automáticamente
  ✅ Reporte visible en UI
```

### DÍA 3: UI Job Mapping Review

```yaml
TAREAS:
  1. Crear página /dashboard/admin/job-mapping-review:
     - Tabla de cargos sin mapear
     - Selector de niveles
     - Contador de afectados
     
  2. Crear API /api/admin/job-mapping-review:
     - GET: Listar unmapped agrupados
     - POST: Asignar nivel + guardar histórico
     
  3. Integrar feedback loop:
     - Guardar en JobMappingHistory
     - Priorizar histórico en mapeos futuros

ENTREGABLE:
  ✅ UI de revisión funcional
  ✅ Feedback loop implementado
```

### DÍA 4: Migración de Datos Existentes

```yaml
TAREAS:
  1. Crear script migrate-job-levels.ts
  
  2. Ejecutar en desarrollo:
     - Verificar tasa de éxito
     - Identificar cargos problemáticos
     
  3. Ampliar aliases si necesario:
     - Agregar términos faltantes
     - Re-ejecutar migración
     
  4. Documentar cargos que requieren revisión manual

ENTREGABLE:
  ✅ 85%+ de cargos mapeados
  ✅ Lista de pendientes para revisión
```

### DÍA 5: Testing E2E y Documentación

```yaml
TAREAS:
  1. Testing end-to-end:
     - Flujo completo carga → mapeo → revisión
     - Verificar analytics por nivel
     
  2. Documentación:
     - Actualizar docs técnicos
     - Agregar a Índice Inteligente
     
  3. Preparar para producción:
     - Script de migración prod
     - Checklist de deployment

ENTREGABLE:
  ✅ Sistema completo probado
  ✅ Documentación actualizada
  ✅ Listo para deploy
```

---

## 📋 CHECKLIST DE VALIDACIÓN FINAL

### Pre-Producción

- [ ] Schema Prisma migrado y sincronizado
- [ ] PositionAdapter.ts creado con 350+ aliases
- [ ] API de carga actualizada con mapeo automático
- [ ] UI Job Mapping Review funcional
- [ ] Script de migración probado en staging
- [ ] Tests unitarios pasando
- [ ] Tests E2E pasando

### Post-Despliegue

- [ ] Ejecutar migración en producción
- [ ] Verificar tasa de mapeo > 85%
- [ ] Revisar cargos en Job Mapping Review
- [ ] Monitorear performance 24h
- [ ] Documentar casos edge encontrados
- [ ] Entrenar equipo Concierge en UI

---

## 🔗 REFERENCIAS

| Documento | Ubicación |
|-----------|-----------|
| DepartmentAdapter actual | `src/lib/services/DepartmentAdapter.ts` |
| Schema Prisma | `prisma/schema.prisma` |
| API Carga Participantes | `src/app/api/campaigns/[id]/participants/route.ts` |
| Mapping Review Departments | `src/app/dashboard/admin/mapping-review/page.tsx` |
| Documento Maestro Departments | `/mnt/project/📘 DOCUMENTO MAESTRO: Flujo Completo de Estructura y Mapeo de Departamentos - FocalizaHR.md` |

---

## 11. CLASIFICACIÓN PERFORMANCE TRACK 🔄 SIMPLIFICADO v1.2

### 11.1 Contexto de Negocio

```yaml
PROBLEMA:
  El módulo de Evaluación de Desempeño requiere que NO todos 
  respondan las mismas preguntas. Necesitamos segregar audiencias.

SOLUCIÓN SIMPLIFICADA (v1.2):
  performanceTrack se DERIVA de standardJobLevel (ya calculado)
  
  position → PositionAdapter → standardJobLevel → mapToTrack() → performanceTrack
```

### 11.2 Los 3 Tracks de Audiencia

```yaml
TRACK 1 - COLABORADOR:
  Encuesta: Solo Competencias Core
  Población: ~70-80% de la empresa

TRACK 2 - MANAGER:
  Encuesta: Core + Liderazgo
  Población: ~15-25% de la empresa

TRACK 3 - EJECUTIVO:
  Encuesta: Core + Liderazgo + Estrategia
  Población: ~3-5% de la empresa
```

### 11.3 Mapeo standardJobLevel → performanceTrack

```typescript
// src/lib/services/PositionAdapter.ts (AGREGAR MÉTODO)

export type PerformanceTrack = 'COLABORADOR' | 'MANAGER' | 'EJECUTIVO';

/**
 * Deriva el performanceTrack desde el standardJobLevel ya calculado
 * FLUJO: position → getJobLevel() → standardJobLevel → mapToTrack() → performanceTrack
 */
static mapToTrack(standardJobLevel: string | null): PerformanceTrack {
  if (!standardJobLevel) return 'COLABORADOR';
  
  const trackMapping: Record<string, PerformanceTrack> = {
    // EJECUTIVO: Alta dirección
    'ceo':                    'EJECUTIVO',
    'gerente_director':       'EJECUTIVO',
    
    // MANAGER: Mandos medios con equipo
    'subgerente_subdirector': 'MANAGER',
    'jefe':                   'MANAGER',
    'supervisor_coordinador': 'MANAGER',
    
    // COLABORADOR: Contribuidores individuales
    'profesional_analista':   'COLABORADOR',
    'asistente_otros':        'COLABORADOR',
    'operativo_auxiliar':     'COLABORADOR',
  };
  
  return trackMapping[standardJobLevel] || 'COLABORADOR';
}

/**
 * Método combinado: calcula ambas clasificaciones de una vez
 */
static classifyPosition(position: string): {
  standardJobLevel: string | null;
  acotadoGroup: string | null;
  performanceTrack: PerformanceTrack;
} {
  const standardJobLevel = this.getJobLevel(position);
  const acotadoGroup = this.getAcotadoLevel(standardJobLevel);
  const performanceTrack = this.mapToTrack(standardJobLevel);
  
  return { standardJobLevel, acotadoGroup, performanceTrack };
}
```

### 11.4 Tabla de Mapeo Completa

| standardJobLevel (7) | acotadoGroup (4) | performanceTrack (3) |
|---------------------|------------------|---------------------|
| `ceo` | `alta_gerencia` | `EJECUTIVO` |
| `gerente_director` | `alta_gerencia` | `EJECUTIVO` |
| `subgerente_subdirector` | `alta_gerencia` | `MANAGER` |
| `jefe` | `mandos_medios` | `MANAGER` |
| `supervisor_coordinador` | `mandos_medios` | `MANAGER` |
| `profesional_analista` | `profesionales` | `COLABORADOR` |
| `asistente_otros` | `base_operativa` | `COLABORADOR` |
| `operativo_auxiliar` | `base_operativa` | `COLABORADOR` |

### 11.5 Validación Estructural (Anomalías) - COMPLEMENTARIO

Aunque el track se deriva del nivel, **opcionalmente** validamos contra estructura real:

```typescript
// src/lib/services/PerformanceTrackValidator.ts

export interface TrackAnomaly {
  employeeId: string;
  fullName: string;
  position: string;
  standardJobLevel: string;
  derivedTrack: PerformanceTrack;
  issue: string;
  suggestion: string;
  severity: 'WARNING' | 'CRITICAL';
}

export class PerformanceTrackValidator {
  
  /**
   * Valida coherencia entre track derivado y estructura real
   * Se ejecuta POST-clasificación para detectar inconsistencias
   */
  static async validateTrack(
    employeeId: string,
    derivedTrack: PerformanceTrack,
    accountId: string
  ): Promise<TrackAnomaly | null> {
    
    // Contar reportes directos
    const directReportsCount = await prisma.employee.count({
      where: { accountId, managerId: employeeId }
    });
    
    // ⚠️ REGLA A: Track MANAGER/EJECUTIVO sin reportes
    if ((derivedTrack === 'MANAGER' || derivedTrack === 'EJECUTIVO') 
        && directReportsCount === 0) {
      return {
        // ... datos del empleado
        issue: `Track ${derivedTrack} pero sin reportes directos`,
        suggestion: 'Verificar si es cargo sin equipo (PM, Account Manager)',
        severity: derivedTrack === 'EJECUTIVO' ? 'CRITICAL' : 'WARNING'
      };
    }
    
    // ⚠️ REGLA B: Track COLABORADOR con reportes
    if (derivedTrack === 'COLABORADOR' && directReportsCount > 0) {
      return {
        // ... datos del empleado
        issue: `Track COLABORADOR pero tiene ${directReportsCount} reportes`,
        suggestion: 'Considerar cambiar a MANAGER',
        severity: 'WARNING'
      };
    }
    
    return null; // Sin anomalías
  }
}
```

### 11.6 Flujo Simplificado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CLASIFICACIÓN v1.2                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT                                                                  │
│    position: "Jefe de Ventas"                                          │
│                                                                         │
│  PASO 1: PositionAdapter.getJobLevel()                                 │
│    → standardJobLevel: "jefe"                                          │
│                                                                         │
│  PASO 2: PositionAdapter.getAcotadoLevel()                             │
│    → acotadoGroup: "mandos_medios"                                     │
│                                                                         │
│  PASO 3: PositionAdapter.mapToTrack()                                  │
│    → performanceTrack: "MANAGER"                                       │
│                                                                         │
│  PASO 4 (OPCIONAL): PerformanceTrackValidator.validateTrack()          │
│    → Verificar contra estructura real (directReports)                  │
│    → Si inconsistencia → Generar anomalía para revisión                │
│                                                                         │
│  OUTPUT                                                                 │
│    Employee/Participant con los 3 campos poblados                      │
│    + Lista de anomalías para UI de revisión                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. INTEGRACIÓN EMPLOYEE MASTER 🆕 v1.2

### 12.1 Contexto: Arquitectura Existente

```yaml
YA EXISTE:
  ✅ Tabla Employee = Nómina viva (master permanente)
  ✅ Tabla EmployeeHistory = Auditoría granular por campo
  ✅ Employee.managerId = Self-reference para jerarquía
  ✅ Employee.directReports[] = Relación inversa
  
  ⚠️ Employee.seniorityLevel = Campo LEGACY (no tocar)
  ⚠️ Employee.managerLevel = Campo LEGACY (no tocar)

RELACIÓN:
  Employee (master) → genera → Participant (snapshot por estudio)
```

### 12.2 Campos a Agregar

#### En Employee (Tabla Master):

```prisma
model Employee {
  // ... campos existentes (NO TOCAR seniorityLevel, managerLevel) ...
  
  // 🆕 CLASIFICACIÓN CARGO (calculado por PositionAdapter)
  standardJobLevel    String?   @map("standard_job_level")
  acotadoGroup        String?   @map("acotado_group")
  jobLevelMappedAt    DateTime? @map("job_level_mapped_at")
  jobLevelMethod      String?   @map("job_level_method")  // "auto" | "manual"
  
  // 🆕 CLASIFICACIÓN DESEMPEÑO (derivado de standardJobLevel)
  performanceTrack    String?   @map("performance_track")  // COLABORADOR|MANAGER|EJECUTIVO
  trackMappedAt       DateTime? @map("track_mapped_at")
  trackHasAnomaly     Boolean   @default(false) @map("track_has_anomaly")
}
```

#### En Participant (Snapshot):

```prisma
model Participant {
  // ... campos existentes ...
  
  // 🆕 FK A EMPLOYEE (opcional, solo si viene de Employee)
  employeeId          String?   @map("employee_id")
  employee            Employee? @relation(fields: [employeeId], references: [id])
  
  // 🆕 SNAPSHOT DE CLASIFICACIÓN (copiado de Employee O calculado en CSV)
  standardJobLevel    String?   @map("standard_job_level")
  acotadoGroup        String?   @map("acotado_group")
  
  // ❌ performanceTrack NO VA AQUÍ (solo relevante en Employee para Desempeño)
  
  @@index([employeeId])
}
```

#### En EmployeeHistory (Auditoría):

```prisma
enum EmployeeChangeType {
  // EXISTENTES (no tocar):
  HIRE
  TERMINATE
  REHIRE
  TRANSFER
  PROMOTION
  MANAGER_CHANGE
  DEPARTMENT_CHANGE
  STATUS_CHANGE
  DATA_UPDATE
  
  // 🆕 AGREGAR:
  JOB_LEVEL_CLASSIFICATION    // Cuando cambia standardJobLevel
  TRACK_CLASSIFICATION        // Cuando cambia performanceTrack
}
```

### 12.3 Flujo Híbrido: Dos Caminos Coexisten

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO HÍBRIDO v1.2                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ══════════════════════════════════════════════════════════════════    │
│  FLUJO 1: DESEMPEÑO (Employee → Participant)                           │
│  ══════════════════════════════════════════════════════════════════    │
│                                                                         │
│  CSV/API                                                               │
│    ↓                                                                   │
│  EmployeeSyncService.sync()                                            │
│    ↓                                                                   │
│  PositionAdapter.classifyPosition(employee.position)                   │
│    ↓                                                                   │
│  Employee {                                                            │
│    standardJobLevel: "jefe"                                            │
│    acotadoGroup: "mandos_medios"                                       │
│    performanceTrack: "MANAGER"    ← Solo aquí                          │
│  }                                                                      │
│    ↓                                                                   │
│  generateEvaluations() / generateParticipants()                        │
│    ↓                                                                   │
│  Participant {                                                         │
│    employeeId: "emp_123"          ← FK poblado                         │
│    standardJobLevel: "jefe"       ← Snapshot copiado                   │
│    acotadoGroup: "mandos_medios"  ← Snapshot copiado                   │
│  }                                                                      │
│                                                                         │
│  ══════════════════════════════════════════════════════════════════    │
│  FLUJO 2: OTROS PRODUCTOS (CSV → Participant directo)                  │
│  ══════════════════════════════════════════════════════════════════    │
│                                                                         │
│  CSV Upload (Pulso, Clima, Onboarding, etc.)                           │
│    ↓                                                                   │
│  ParticipantUploadService.process()                                    │
│    ↓                                                                   │
│  PositionAdapter.classifyPosition(row.position)                        │
│    ↓                                                                   │
│  Participant {                                                         │
│    employeeId: null               ← Sin FK (carga directa)             │
│    standardJobLevel: "jefe"       ← Calculado en el momento            │
│    acotadoGroup: "mandos_medios"  ← Calculado en el momento            │
│  }                                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.4 Integración con EmployeeSyncService

```typescript
// src/lib/services/EmployeeSyncService.ts

import { PositionAdapter } from './PositionAdapter';
import { PerformanceTrackValidator, TrackAnomaly } from './PerformanceTrackValidator';

export interface SyncResult {
  stats: {
    created: number;
    updated: number;
    total: number;
  };
  classification: {
    mapped: number;
    unmapped: number;
    byLevel: Record<string, number>;
    byTrack: Record<string, number>;
  };
  anomalies: TrackAnomaly[];
}

export class EmployeeSyncService {
  
  static async syncEmployees(
    accountId: string,
    employees: EmployeeInput[]
  ): Promise<SyncResult> {
    
    const stats = { created: 0, updated: 0, total: employees.length };
    const classification = { 
      mapped: 0, 
      unmapped: 0, 
      byLevel: {} as Record<string, number>,
      byTrack: {} as Record<string, number>
    };
    const anomalies: TrackAnomaly[] = [];
    
    for (const emp of employees) {
      // 1. Clasificar posición
      const { standardJobLevel, acotadoGroup, performanceTrack } = 
        PositionAdapter.classifyPosition(emp.position || '');
      
      // 2. Crear/actualizar Employee
      const savedEmployee = await prisma.employee.upsert({
        where: { 
          accountId_nationalId: { accountId, nationalId: emp.nationalId } 
        },
        create: {
          accountId,
          nationalId: emp.nationalId,
          fullName: emp.fullName,
          position: emp.position,
          managerId: emp.managerId,
          // ... otros campos ...
          
          // Clasificación
          standardJobLevel,
          acotadoGroup,
          performanceTrack,
          jobLevelMappedAt: new Date(),
          jobLevelMethod: 'auto',
          trackMappedAt: new Date(),
        },
        update: {
          fullName: emp.fullName,
          position: emp.position,
          managerId: emp.managerId,
          // ... otros campos ...
          
          // Re-clasificar si position cambió
          standardJobLevel,
          acotadoGroup,
          performanceTrack,
          jobLevelMappedAt: new Date(),
        }
      });
      
      // 3. Registrar en historial si es cambio
      if (savedEmployee.standardJobLevel !== standardJobLevel) {
        await prisma.employeeHistory.create({
          data: {
            employeeId: savedEmployee.id,
            changeType: 'JOB_LEVEL_CLASSIFICATION',
            fieldName: 'standardJobLevel',
            oldValue: savedEmployee.standardJobLevel,
            newValue: standardJobLevel,
          }
        });
      }
      
      // 4. Contadores
      if (standardJobLevel) {
        classification.mapped++;
        classification.byLevel[standardJobLevel] = 
          (classification.byLevel[standardJobLevel] || 0) + 1;
        classification.byTrack[performanceTrack] = 
          (classification.byTrack[performanceTrack] || 0) + 1;
      } else {
        classification.unmapped++;
      }
      
      // 5. Validar anomalías (opcional, después del sync completo)
      const anomaly = await PerformanceTrackValidator.validateTrack(
        savedEmployee.id,
        performanceTrack,
        accountId
      );
      if (anomaly) {
        anomalies.push({
          ...anomaly,
          employeeId: savedEmployee.id,
          fullName: emp.fullName,
          position: emp.position || '',
          standardJobLevel: standardJobLevel || '',
          derivedTrack: performanceTrack,
        });
      }
      
      stats.created++; // o updated según caso
    }
    
    return { stats, classification, anomalies };
  }
}
```

### 12.5 UI Track Review (Anomalías)

```typescript
// src/app/dashboard/performance/track-review/page.tsx

// La UI muestra anomalías detectadas por PerformanceTrackValidator:
// - MANAGER/EJECUTIVO sin reportes directos
// - COLABORADOR con reportes directos
// 
// El admin puede:
// 1. Confirmar el track derivado (ignorar anomalía)
// 2. Cambiar manualmente el track → EmployeeHistory con TRACK_CLASSIFICATION
```

### 12.6 Migración Prisma

```bash
# 1. Agregar campos a Employee
npx prisma migrate dev --name add_job_classification_to_employee

# 2. Agregar campos a Participant
npx prisma migrate dev --name add_job_classification_to_participant

# 3. Agregar changeTypes a enum
npx prisma migrate dev --name add_classification_change_types
```

---

## 📋 PLAN DE EJECUCIÓN ACTUALIZADO (v1.2)

### Días 1-5: PositionAdapter Base (sin cambios)

```yaml
DÍA 1: Schema + Motor Base
DÍA 2: Integración Carga Participantes (CSV directo)
DÍA 3: UI Job Mapping Review
DÍA 4: Migración Datos Existentes
DÍA 5: Testing E2E
```

### Días 6-7: Performance Track + Employee Integration 🆕

```yaml
DÍA 6: Clasificación + Employee

  TAREAS:
    1. Agregar método mapToTrack() a PositionAdapter
    2. Agregar método classifyPosition() combinado
    3. Schema Employee: campos nuevos + migración
    4. Schema Participant: employeeId + campos snapshot
    5. Enum EmployeeChangeType: 2 nuevos valores
    6. Crear PerformanceTrackValidator.ts (opcional)
    
  ENTREGABLE:
    ✅ Employee con clasificación completa
    ✅ Participant con snapshot

DÍA 7: Integración EmployeeSyncService + UI

  TAREAS:
    1. Modificar EmployeeSyncService para clasificar
    2. Retornar SyncResult con anomalías
    3. Crear UI Track Review para anomalías
    4. Testing E2E flujo completo
    
  ENTREGABLE:
    ✅ Sync clasifica automáticamente
    ✅ UI muestra anomalías
    ✅ Flujo híbrido funcional
```

---

## 📋 CHECKLIST v1.2

### Pre-Producción

- [ ] PositionAdapter.ts con getJobLevel() + getAcotadoLevel() + mapToTrack()
- [ ] Schema Employee con 7 campos nuevos
- [ ] Schema Participant con employeeId + 2 campos snapshot
- [ ] Enum EmployeeChangeType con 2 valores nuevos
- [ ] EmployeeSyncService integrado con clasificación
- [ ] ParticipantUploadService integrado (flujo CSV)
- [ ] PerformanceTrackValidator.ts (opcional)
- [ ] UI Job Mapping Review
- [ ] UI Track Review (anomalías)
- [ ] Migraciones Prisma ejecutadas
- [ ] Tests unitarios + E2E

### Post-Despliegue

- [ ] Migrar employees existentes
- [ ] Verificar tasa mapeo > 85%
- [ ] Revisar anomalías en Track Review
- [ ] Documentar casos edge

---

## 🔮 ROADMAP FUTURO (v2.x)

```yaml
POSIBLE EVOLUCIÓN:
  - Tablas Config para aliases (JobLevelConfig, etc.)
  - UI Admin para gestionar configuración
  - Override de aliases por empresa (multi-tenant)
  - ML para mejorar mapeo automático
  - Migración de otros productos a Employee → Participant
```

---

**Fin del documento**

*Generado para FocalizaHR Enterprise - Sistema de Inteligencia Organizacional*
