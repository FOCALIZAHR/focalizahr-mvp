// ====================================================================
// FOCALIZAHR PARTICIPANTUPLOADER v2.0 - HOOK CEREBRO
// src/hooks/useParticipantUploader.ts
// FASE 2.2: State Management + Business Logic + DepartmentAdapter Integration
// ====================================================================

import { useReducer, useCallback, useEffect, useState } from 'react';
import { parseParticipantsFile, ParticipantData, ParsingResult } from '@/lib/utils/participant-parser';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// ✅ TIPOS PARA ESTADO UNIFICADO REDUCER
export type UploaderState = 
  | { status: 'idle' }
  | { status: 'uploading'; progress: number; file: File }
  | { status: 'processing'; file: File; data: ParsingResult }
  | { status: 'conflicts'; file: File; data: ParsingResult; conflicts: DepartmentConflict[] }
  | { status: 'ready'; file: File; data: ParsingResult; enrichedParticipants: EnrichedParticipant[] }
  | { status: 'confirming'; file: File; data: ParsingResult; progress: number }
  | { status: 'complete'; result: UploadResult }
  | { status: 'error'; error: string };

// ✅ TIPOS AUXILIARES PARA CONFLICTS Y ENRICHMENT
export interface DepartmentConflict {
  participantEmail: string;
  originalDepartment: string;
  suggestedDepartments: string[];
  confidence: 'high' | 'medium' | 'low';
  requiresUserInput: boolean;
}

export interface EnrichedParticipant extends ParticipantData {
  id: string; // temp ID para UI
  departmentSuggestion?: string;
  departmentConfidence?: 'high' | 'medium' | 'low';
  conflictResolved: boolean;
  validationStatus: 'valid' | 'warning' | 'error';
  validationMessages: string[];
}

export interface UploadResult {
  success: boolean;
  totalLoaded: number;
  duplicatesInDB: number;
  demographicsStats: {
    withDateOfBirth: number;
    withGender: number;
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
  };
  message: string;
}

// ✅ ACTIONS PARA REDUCER
type UploaderAction = 
  | { type: 'START_UPLOAD'; file: File }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PARSING_COMPLETE'; data: ParsingResult }
  | { type: 'CONFLICTS_DETECTED'; conflicts: DepartmentConflict[] }
  | { type: 'CONFLICTS_RESOLVED'; enrichedParticipants: EnrichedParticipant[] }
  | { type: 'START_CONFIRMATION' }
  | { type: 'UPLOAD_COMPLETE'; result: UploadResult }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

// ✅ REDUCER FUNCTION - ESTADO MANAGEMENT PREDICIBLE
function uploaderReducer(state: UploaderState, action: UploaderAction): UploaderState {
  switch (action.type) {
    case 'START_UPLOAD':
      return { status: 'uploading', progress: 0, file: action.file };
      
    case 'UPDATE_PROGRESS':
      return state.status === 'uploading' || state.status === 'confirming'
        ? { ...state, progress: action.progress }
        : state;
        
    case 'PARSING_COMPLETE':
      return state.status === 'uploading' 
        ? { status: 'processing', file: state.file, data: action.data }
        : state;
        
    case 'CONFLICTS_DETECTED':
      return state.status === 'processing'
        ? { status: 'conflicts', file: state.file, data: state.data, conflicts: action.conflicts }
        : state;
        
    case 'CONFLICTS_RESOLVED':
      return state.status === 'conflicts' || state.status === 'processing'
        ? { 
            status: 'ready', 
            file: state.file, 
            data: state.data, 
            enrichedParticipants: action.enrichedParticipants 
          }
        : state;
        
    case 'START_CONFIRMATION':
      return state.status === 'ready'
        ? { status: 'confirming', file: state.file, data: state.data, progress: 0 }
        : state;
        
    case 'UPLOAD_COMPLETE':
      return { status: 'complete', result: action.result };
      
    case 'ERROR':
      return { status: 'error', error: action.error };
      
    case 'RESET':
      return { status: 'idle' };
      
    default:
      return state;
  }
}

// ✅ HOOK PROPS INTERFACE
export interface UseParticipantUploaderProps {
  campaignId: string;
  campaignName: string;
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  maxParticipants?: number;
  autoResolveConflicts?: boolean;
}

// ✅ HOOK PRINCIPAL - USEPARTICIPANTUPLOADER
export function useParticipantUploader({
  campaignId,
  campaignName,
  onUploadComplete,
  onError,
  maxParticipants = 500,
  autoResolveConflicts = true
}: UseParticipantUploaderProps) {
  
  // ✅ STATE MANAGEMENT CON USEREDUCER
  const [state, dispatch] = useReducer(uploaderReducer, { status: 'idle' });
  
  // ✅ INTEGRACIÓN DEPARTMENTADAPTER
  const [departments, setDepartments] = useState<any[]>([]);
  const [smartMatcher, setSmartMatcher] = useState<any>(null);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // ✅ FETCH DEPARTMENTS ON MOUNT
  useEffect(() => {
    async function loadDepartments() {
      try {
        setLoadingDepartments(true);
        const token = localStorage.getItem('focalizahr_token');
        if (!token) return;
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        const accountId = payload.accountId || payload.account?.id;
        
        if (accountId) {
          const response = await fetch('/api/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setDepartments(data.departments || []);
            
            // ✅ CREAR SMART MATCHER PARA SUGERENCIAS
            const matcher = createSmartMatcher(data.departments || []);
            setSmartMatcher(matcher);
          }
        }
      } catch (error) {
        console.error('Error loading departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    }
    
    loadDepartments();
  }, []);

  // ✅ FUNCIÓN 1: UPLOAD FILE Y PARSEO INICIAL
  const uploadFile = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'START_UPLOAD', file });
      
      // Simular progreso de upload
      const progressInterval = setInterval(() => {
        dispatch({ type: 'UPDATE_PROGRESS', progress: Math.min(Math.random() * 30 + 10, 90) });
      }, 200);
      
      // ✅ USAR MOTOR DE PARSEO
      const parsingResult = await parseParticipantsFile(file);
      
      clearInterval(progressInterval);
      dispatch({ type: 'UPDATE_PROGRESS', progress: 100 });
      dispatch({ type: 'PARSING_COMPLETE', data: parsingResult });
      
      if (!parsingResult.success) {
        throw new Error(parsingResult.errors.join(', '));
      }
      
      // ✅ VERIFICAR LÍMITES
      if (parsingResult.participants.length > maxParticipants) {
        throw new Error(`Máximo ${maxParticipants} participantes permitidos. Archivo contiene ${parsingResult.participants.length}.`);
      }
      
      // ✅ ANÁLISIS DE CONFLICTOS DEPARTAMENTOS
      if (smartMatcher && parsingResult.participants.some(p => p.department)) {
        await analyzeAndResolveConflicts(parsingResult);
      } else {
        // Sin conflictos, proceder directamente
        const enrichedParticipants = parsingResult.participants.map((p, index) => ({
          ...p,
          id: `temp-${index}`,
          conflictResolved: true,
          validationStatus: 'valid' as const,
          validationMessages: []
        }));
        dispatch({ type: 'CONFLICTS_RESOLVED', enrichedParticipants });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando archivo';
      dispatch({ type: 'ERROR', error: errorMessage });
      onError?.(errorMessage);
    }
  }, [smartMatcher, maxParticipants, onError]);

  // ✅ FUNCIÓN 2: ANÁLISIS Y RESOLUCIÓN CONFLICTOS DEPARTAMENTOS
  const analyzeAndResolveConflicts = useCallback(async (parsingResult: ParsingResult) => {
    try {
      const conflicts: DepartmentConflict[] = [];
      const enrichedParticipants: EnrichedParticipant[] = [];
      
      for (let i = 0; i < parsingResult.participants.length; i++) {
        const participant = parsingResult.participants[i];
        let suggestion: string | undefined;
        let confidence: 'high' | 'medium' | 'low' = 'low';
        let requiresUserInput = false;
        
        // ✅ SMART MATCHING SI HAY DEPARTMENT
        if (participant.department && smartMatcher) {
          const matchResult = smartMatcher.findMatch(participant.department);
          if (matchResult) {
            suggestion = matchResult.displayName;
            confidence = matchResult.confidence || 'high';
          } else {
            // Departamento no reconocido - crear conflicto
            requiresUserInput = true;
            conflicts.push({
              participantEmail: participant.email,
              originalDepartment: participant.department,
              suggestedDepartments: departments.map(d => d.displayName).slice(0, 3),
              confidence: 'low',
              requiresUserInput: true
            });
          }
        }
        
        enrichedParticipants.push({
          ...participant,
          id: `temp-${i}`,
          departmentSuggestion: suggestion,
          departmentConfidence: confidence,
          conflictResolved: !requiresUserInput,
          validationStatus: requiresUserInput ? 'warning' : 'valid',
          validationMessages: requiresUserInput ? [`Departamento "${participant.department}" no reconocido`] : []
        });
      }
      
      if (conflicts.length > 0 && !autoResolveConflicts) {
        dispatch({ type: 'CONFLICTS_DETECTED', conflicts });
      } else {
        // Auto-resolver conflictos o no hay conflictos
        dispatch({ type: 'CONFLICTS_RESOLVED', enrichedParticipants });
      }
      
    } catch (error) {
      dispatch({ type: 'ERROR', error: 'Error analizando departamentos' });
    }
  }, [smartMatcher, departments, autoResolveConflicts]);

  // ✅ FUNCIÓN 3: RESOLVER CONFLICTO MANUAL
  const resolveConflict = useCallback((participantEmail: string, selectedDepartment: string) => {
    if (state.status !== 'conflicts') return;
    
    // Actualizar participante con decisión usuario
    const updatedParticipants = state.data.participants.map(p => {
      if (p.email === participantEmail) {
        return { ...p, department: selectedDepartment };
      }
      return p;
    });
    
    // Re-enriquecer con nueva información
    const enrichedParticipants = updatedParticipants.map((p, index) => ({
      ...p,
      id: `temp-${index}`,
      departmentSuggestion: selectedDepartment,
      departmentConfidence: 'high' as const,
      conflictResolved: true,
      validationStatus: 'valid' as const,
      validationMessages: []
    }));
    
    dispatch({ type: 'CONFLICTS_RESOLVED', enrichedParticipants });
  }, [state]);

  // ✅ FUNCIÓN 4: CONFIRMACIÓN FINAL Y UPLOAD A BD
  const confirmUpload = useCallback(async () => {
    if (state.status !== 'ready') return;
    
    try {
      dispatch({ type: 'START_CONFIRMATION' });
      
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('campaignId', campaignId);
      formData.append('action', 'confirm');
      
      // ✅ AGREGAR DATOS ENRIQUECIDOS
      const enrichedData = {
        participants: state.enrichedParticipants.map(p => ({
          email: p.email,
          name: p.name,
          department: p.departmentSuggestion || p.department,
          position: p.position,
          location: p.location,
          dateOfBirth: p.dateOfBirth?.toISOString(),
          gender: p.gender
        })),
        demographicsDetected: state.data.demographicsDetected
      };
      formData.append('enrichedData', JSON.stringify(enrichedData));
      
      const token = localStorage.getItem('focalizahr_token');
      
      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando participantes');
      }
      
      // ✅ CALCULAR STATS DEMOGRAFICOS
      const demographicsStats = {
        withDateOfBirth: state.enrichedParticipants.filter(p => p.dateOfBirth).length,
        withGender: state.enrichedParticipants.filter(p => p.gender).length,
        ageDistribution: state.data.demographicsDetected.ageRanges || {},
        genderDistribution: state.data.demographicsDetected.genderDistribution || {},
      };
      
      const uploadResult: UploadResult = {
        success: true,
        totalLoaded: result.totalLoaded,
        duplicatesInDB: result.duplicatesInDB,
        demographicsStats,
        message: `✅ ${result.totalLoaded} participantes cargados exitosamente${demographicsStats.withDateOfBirth > 0 ? ` (${demographicsStats.withDateOfBirth} con datos demográficos)` : ''}`
      };
      
      dispatch({ type: 'UPLOAD_COMPLETE', result: uploadResult });
      onUploadComplete?.(uploadResult);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error confirmando upload';
      dispatch({ type: 'ERROR', error: errorMessage });
      onError?.(errorMessage);
    }
  }, [state, campaignId, onUploadComplete, onError]);

  // ✅ FUNCIÓN 5: RESET STATE
  const resetUploader = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ✅ FUNCIÓN AUXILIAR: CREAR SMART MATCHER
  function createSmartMatcher(departments: any[]) {
    return {
      findMatch: (departmentName: string) => {
        if (!departmentName) return null;
        
        // Buscar match exacto
        const exactMatch = departments.find(d => 
          d.displayName.toLowerCase() === departmentName.toLowerCase()
        );
        if (exactMatch) {
          return { displayName: exactMatch.displayName, confidence: 'high' };
        }
        
        // Buscar match por standardCategory si existe
        const categoryMatch = departments.find(d => 
          d.standardCategory && d.standardCategory.toLowerCase() === departmentName.toLowerCase()
        );
        if (categoryMatch) {
          return { displayName: categoryMatch.displayName, confidence: 'medium' };
        }
        
        return null;
      }
    };
  }

  // ✅ RETURN INTERFACE DEL HOOK
  return {
    // Estado actual
    state,
    
    // Funciones principales
    uploadFile,
    resolveConflict,
    confirmUpload,
    resetUploader,
    
    // Estados derivados para UI
    isLoading: state.status === 'uploading' || state.status === 'processing' || state.status === 'confirming',
    hasConflicts: state.status === 'conflicts',
    isReady: state.status === 'ready',
    isComplete: state.status === 'complete',
    hasError: state.status === 'error',
    
    // Datos para UI
    progress: state.status === 'uploading' || state.status === 'confirming' ? state.progress : 0,
    conflicts: state.status === 'conflicts' ? state.conflicts : [],
    participants: state.status === 'ready' ? state.enrichedParticipants : 
                  state.status === 'processing' || state.status === 'conflicts' ? state.data.participants : [],
    result: state.status === 'complete' ? state.result : null,
    error: state.status === 'error' ? state.error : null,
    
    // Metadata
    departments,
    loadingDepartments,
    demographicsDetected: state.status === 'processing' || state.status === 'conflicts' || state.status === 'ready' 
      ? state.data.demographicsDetected : null
  };
}