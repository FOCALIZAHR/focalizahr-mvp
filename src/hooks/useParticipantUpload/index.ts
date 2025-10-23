// src/hooks/useParticipantUpload/index.ts
'use client';

import { useReducer, useCallback, useRef } from 'react';
import { 
  ParticipantUploadState, 
  ParticipantUploadAction,
  ParticipantData,
  Department,
  UploadResult,
  DemographicsStats
} from './types';

// Estado inicial
const initialState: ParticipantUploadState = {
  uploadFile: null,
  uploading: false,
  processing: false,
  uploadResult: null,
  previewData: [],
  uploadError: null,
  uploadProgress: 0,
  departments: [],
  selectedDepartmentId: '',
  loadingDepartments: false,
  demographicsStats: null,
  currentStep: 'idle'
};

// Reducer para manejo de estado
function participantUploadReducer(
  state: ParticipantUploadState,
  action: ParticipantUploadAction
): ParticipantUploadState {
  switch (action.type) {
    case 'SET_FILE':
      return {
        ...state,
        uploadFile: action.payload,
        uploadError: null,
        uploadResult: null,
        previewData: [],
        uploadProgress: 0,
        demographicsStats: null,
        currentStep: 'idle'
      };
      
    case 'SET_UPLOADING':
      return { 
        ...state, 
        uploading: action.payload,
        currentStep: action.payload ? 'uploading' : state.currentStep
      };
      
    case 'SET_PROCESSING':
      return { 
        ...state, 
        processing: action.payload,
        currentStep: action.payload ? 'confirming' : state.currentStep
      };
      
    case 'SET_PROGRESS':
      return { ...state, uploadProgress: action.payload };
      
    case 'SET_ERROR':
      return { 
        ...state, 
        uploadError: action.payload,
        uploading: false,
        processing: false,
        currentStep: action.payload ? 'error' : state.currentStep
      };
      
    case 'SET_RESULT':
      return {
        ...state,
        uploadResult: action.payload.result,
        previewData: action.payload.participants,
        demographicsStats: action.payload.demographics,
        currentStep: 'preview',
        uploading: false
      };
      
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
      
    case 'SET_SELECTED_DEPARTMENT':
      return { ...state, selectedDepartmentId: action.payload };
      
    case 'SET_LOADING_DEPARTMENTS':
      return { ...state, loadingDepartments: action.payload };
      
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
      
    case 'RESET':
      return { ...initialState, departments: state.departments };
      
    default:
      return state;
  }
}

// Hook principal
export function useParticipantUpload(
  campaignId: string,
  campaignName: string,
  onUploadComplete?: (result: { totalLoaded: number; participants: ParticipantData[] }) => void,
  onError?: (error: string) => void,
  maxParticipants: number = 500,
  allowedFormats: string[] = ['.csv', '.xlsx', '.xls']
) {
  const [state, dispatch] = useReducer(participantUploadReducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validar archivo
  const validateFile = useCallback((file: File): string | null => {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!allowedFormats.includes(fileExtension)) {
      return `Formato no permitido. Formatos permitidos: ${allowedFormats.join(', ')}`;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return 'Archivo muy grande. Máximo 10MB permitido';
    }
    
    if (file.name.length > 100) {
      return 'Nombre de archivo muy largo';
    }
    
    return null;
  }, [allowedFormats]);
  
  // Seleccionar archivo
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validationError = validateFile(file);
    if (validationError) {
      dispatch({ type: 'SET_ERROR', payload: validationError });
      return;
    }
    
    dispatch({ type: 'SET_FILE', payload: file });
  }, [validateFile]);
  
  // Generar template CSV con nuevos campos incluyendo FechaIngreso
  const handleDownloadTemplate = useCallback(() => {
    const csvContent = [
      'RUT,Email,Celular,Nombre,Departamento,Cargo,Ubicacion,FechaNacimiento,Genero,FechaIngreso',
      '12345678-9,juan.perez@empresa.com,+56912345678,Juan Pérez,Ventas,Ejecutivo Comercial,Santiago,15/03/1985,M,01/06/2015',
      '16608325-7,maria.gonzalez@empresa.com,912345679,María González,RRHH,Analista,Valparaíso,22/08/1990,F,15/03/2018',
      '11843233-9,carlos.lopez@empresa.com,56923456789,Carlos López,TI,Desarrollador,Santiago,10/12/1988,M,01/06/2005',
      '14111997-4,ana.silva@empresa.com,,Ana Silva,Marketing,Coordinadora,Concepción,05/07/1992,F,20/01/2020'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_participantes_${campaignName.replace(/\s+/g, '_')}.csv`;
    link.click();
  }, [campaignName]);
  
  // Calcular estadísticas demográficas incluyendo antigüedad
  const calculateDemographics = useCallback((participants: ParticipantData[]): DemographicsStats => {
    const totalWithGender = participants.filter(p => p.gender).length;
    const totalWithAge = participants.filter(p => p.dateOfBirth).length;
    const totalWithSeniority = participants.filter(p => p.hireDate).length;
    
    const genderDistribution = {
      male: participants.filter(p => 
        p.gender === 'MALE' || p.gender === 'M' || p.gender === 'Masculino'
      ).length,
      female: participants.filter(p => 
        p.gender === 'FEMALE' || p.gender === 'F' || p.gender === 'Femenino'
      ).length,
      nonBinary: participants.filter(p => 
        p.gender === 'NON_BINARY' || p.gender === 'No binario'
      ).length,
      notSpecified: participants.filter(p => 
        !p.gender || p.gender === 'PREFER_NOT_TO_SAY' || p.gender === 'Prefiere no decir'
      ).length
    };
    
    // Calcular distribución por edad
    const today = new Date();
    const ages = participants
      .filter(p => p.dateOfBirth)
      .map(p => {
        let birthDate: Date;
        const dateStr = p.dateOfBirth!;
        
        // Manejar diferentes formatos de fecha
        if (dateStr.includes('/')) {
          // Formato DD/MM/YYYY
          const parts = dateStr.split('/');
          birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          // Formato ISO
          birthDate = new Date(dateStr);
        }
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      })
      .filter(age => age > 0 && age < 120); // Filtrar edades válidas
    
    const ageDistribution = {
      '18-25': ages.filter(age => age >= 18 && age <= 25).length,
      '26-35': ages.filter(age => age >= 26 && age <= 35).length,
      '36-45': ages.filter(age => age >= 36 && age <= 45).length,
      '46-55': ages.filter(age => age >= 46 && age <= 55).length,
      '56+': ages.filter(age => age >= 56).length
    };
    
    // Calcular antigüedad promedio
    const seniorityYears = participants
      .filter(p => p.hireDate)
      .map(p => {
        let hireDate: Date;
        const dateStr = p.hireDate!;
        
        // Manejar diferentes formatos de fecha
        if (dateStr.includes('/')) {
          // Formato DD/MM/YYYY
          const parts = dateStr.split('/');
          hireDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          // Formato ISO
          hireDate = new Date(dateStr);
        }
        
        const yearsDiff = (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return Math.floor(yearsDiff);
      })
      .filter(years => years >= 0 && years < 50); // Filtrar valores válidos
    
    const averageSeniority = seniorityYears.length > 0 
      ? Math.round(seniorityYears.reduce((a, b) => a + b, 0) / seniorityYears.length * 10) / 10
      : undefined;
    
    // ✅ CALCULAR ESTADÍSTICAS DE CONTACTO
    const contactChannels = {
      withEmail: participants.filter(p => p.email).length,
      withPhone: participants.filter(p => p.phoneNumber).length,
      withBoth: participants.filter(p => p.email && p.phoneNumber).length,
      emailOnly: participants.filter(p => p.email && !p.phoneNumber).length,
      phoneOnly: participants.filter(p => !p.email && p.phoneNumber).length,
    };

    return {
      totalParticipants: participants.length,
      withDemographics: Math.max(totalWithGender, totalWithAge, totalWithSeniority),
      genderDistribution,
      ageDistribution,
      averageAge: ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0,
      averageSeniority,
      contactChannels  // ✅ AGREGAR ESTA LÍNEA
    };
  }, []);
  
  // Procesar archivo para preview
  const handleFilePreview = useCallback(async () => {
    if (!state.uploadFile || !campaignId) {
      dispatch({ type: 'SET_ERROR', payload: 'Faltan datos requeridos para el preview' });
      return;
    }
    
    try {
      dispatch({ type: 'SET_UPLOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_PROGRESS', payload: 0 });
      
      // Simular progreso con incrementos fijos
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 10, 90);
        dispatch({ type: 'SET_PROGRESS', payload: currentProgress });
      }, 200);
      
      const formData = new FormData();
      formData.append('file', state.uploadFile);
      formData.append('campaignId', campaignId);
      formData.append('action', 'preview');
      
      if (state.selectedDepartmentId && state.selectedDepartmentId !== 'none') {
        formData.append('defaultDepartmentId', state.selectedDepartmentId);
      }
      
      const token = localStorage.getItem('focalizahr_token');
      
      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      clearInterval(progressInterval);
      dispatch({ type: 'SET_PROGRESS', payload: 100 });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error procesando archivo');
      }
      
      // Calcular estadísticas demográficas
      const demographics = calculateDemographics(result.participants || []);
      
      dispatch({
        type: 'SET_RESULT',
        payload: {
          result,
          participants: result.participants || [],
          demographics
        }
      });
      
    } catch (error) {
      console.error('Error previewing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error procesando archivo';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(errorMessage);
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false });
    }
  }, [state.uploadFile, state.selectedDepartmentId, campaignId, calculateDemographics, onError]);
  
  // Confirmar carga
  const handleConfirmUpload = useCallback(async () => {
    if (!state.uploadFile || !state.uploadResult || !campaignId) {
      dispatch({ type: 'SET_ERROR', payload: 'Faltan datos para confirmar la carga' });
      return;
    }
    
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const formData = new FormData();
      formData.append('file', state.uploadFile);
      formData.append('campaignId', campaignId);
      formData.append('action', 'confirm');
      
      if (state.selectedDepartmentId && state.selectedDepartmentId !== 'none') {
        formData.append('defaultDepartmentId', state.selectedDepartmentId);
      }
      
      const token = localStorage.getItem('focalizahr_token');
      
      const response = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error confirmando carga');
      }
      
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'complete' });
      
      // Callback de éxito
      onUploadComplete?.({
        totalLoaded: result.totalLoaded,
        participants: state.previewData
      });
      
    } catch (error) {
      console.error('Error confirming upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error confirmando carga';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(errorMessage);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, [state.uploadFile, state.uploadResult, state.selectedDepartmentId, state.previewData, campaignId, onUploadComplete, onError]);
  
  // Limpiar formulario
  const handleClearForm = useCallback(() => {
    dispatch({ type: 'RESET' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // Retornar todo lo necesario
  return {
    // Estado
    ...state,
    fileInputRef,
    
    // Acciones
    handleFileSelect,
    handleDownloadTemplate,
    handleFilePreview,
    handleConfirmUpload,
    handleClearForm,
    setSelectedDepartment: (id: string) => dispatch({ type: 'SET_SELECTED_DEPARTMENT', payload: id }),
    setDepartments: (departments: Department[]) => dispatch({ type: 'SET_DEPARTMENTS', payload: departments })
  };
}