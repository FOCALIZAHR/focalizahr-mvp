// src/components/admin/PreviewTable.tsx
// VERSIÓN FINAL - Con scrollbars visibles y fuente optimizada
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, User, MapPin, Briefcase, Building2, Phone, FileText } from 'lucide-react';
import { ParticipantData, Gender, DemographicsStats } from '@/hooks/useParticipantUpload/types';

interface PreviewTableProps {
  participants: ParticipantData[];
  maxParticipants: number;
  showDemographics?: boolean;
  demographicsStats?: DemographicsStats | null;
}

export default function PreviewTable({ 
  participants, 
  maxParticipants,
  showDemographics = true,
  demographicsStats = null
}: PreviewTableProps) {
  
  // Función para formatear fecha de nacimiento
  const formatDate = (date: string | undefined): string => {
    if (!date) return '-';
    
    if (date.includes('-')) {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    
    return date;
  };
  
  // Función para formatear género
  const formatGender = (gender: Gender | string | undefined): string => {
    if (!gender) return '-';
    
    const genderMap: Record<string, string> = {
      'MALE': 'Masculino',
      'M': 'Masculino',
      'FEMALE': 'Femenino',
      'F': 'Femenino',
      'NON_BINARY': 'No binario',
      'PREFER_NOT_TO_SAY': 'Prefiere no decir'
    };
    
    return genderMap[gender.toUpperCase()] || gender;
  };
  
  // Calcular edad
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = dateOfBirth.includes('-') 
      ? new Date(dateOfBirth)
      : new Date(dateOfBirth.split('/').reverse().join('-'));
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Calcular antigüedad
  const calculateSeniority = (hireDate: string | undefined): string => {
    if (!hireDate) return '-';
    
    const today = new Date();
    const hire = hireDate.includes('-') 
      ? new Date(hireDate)
      : new Date(hireDate.split('/').reverse().join('-'));
    
    const years = Math.floor((today.getTime() - hire.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (years < 1) return '< 1 año';
    if (years === 1) return '1 año';
    return `${years} años`;
  };
  
  return (
    <div className="bg-white/5 border border-gray-800 rounded-lg p-6 space-y-6">
      
      {/* Header limpio */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-light text-white">Vista Previa de Participantes</h2>
        </div>
        <Badge className={participants.length > maxParticipants ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}>
          {participants.length} / {maxParticipants}
        </Badge>
      </div>
      
      {/* Tabla con scroll VISIBLE */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div 
          className="h-[450px] w-full overflow-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#334155 #1e293b'
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 12px;
              height: 12px;
            }
            div::-webkit-scrollbar-track {
              background: #1e293b;
              border-radius: 6px;
            }
            div::-webkit-scrollbar-thumb {
              background: #334155;
              border-radius: 6px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #475569;
            }
          `}</style>
          
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr className="border-b border-gray-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-cyan-400 uppercase">
                  <FileText className="h-3 w-3 inline mr-1" />
                  RUT *
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                  <Phone className="h-3 w-3 inline mr-1" />
                  Celular
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  Departamento
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Cargo</th>
                {showDemographics && (
                  <>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Edad</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Género</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Antigüedad</th>
                  </>
                )}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-800/50 bg-slate-900/30">
              {participants.map((participant, index) => {
                const age = calculateAge(participant.dateOfBirth);
                const seniority = calculateSeniority(participant.hireDate);
                
                return (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 text-xs text-gray-500">{index + 1}</td>
                    
                    {/* RUT */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-cyan-400 font-medium">
                        {participant.nationalId || '-'}
                      </span>
                    </td>
                    
                    {/* Email */}
                    <td className="px-3 py-2">
                      {participant.email ? (
                        <span className="text-gray-300 text-xs">
                          {participant.email}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">sin email</span>
                      )}
                    </td>
                    
                    {/* Celular */}
                    <td className="px-3 py-2">
                      {participant.phoneNumber ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-green-400">
                            {participant.phoneNumber}
                          </span>
                          <span className="text-xs">📱</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs italic">sin celular</span>
                      )}
                    </td>
                    
                    <td className="px-3 py-2 text-xs text-white font-medium">
                      {participant.name || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-white">
                      {participant.department || <span className="text-gray-600 italic">sin departamento</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-300">
                      {participant.position || '-'}
                    </td>
                    
                    {showDemographics && (
                      <>
                        <td className="px-3 py-2 text-xs text-gray-300">
                          {age !== null ? `${age} años` : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {formatGender(participant.gender)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-xs">
                            {seniority}
                          </Badge>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Métricas pequeñas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-cyan-400 mb-1">Total</p>
          <p className="text-2xl font-light text-white">{participants.length}</p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-cyan-400 mb-1">Con Info Completa</p>
          <p className="text-2xl font-light text-white">
            {participants.filter(p => p.name && p.department && p.position).length}
          </p>
        </div>
        
        {showDemographics && (
          <>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-cyan-400 mb-1">Con Demografía</p>
              <p className="text-2xl font-light text-white">
                {participants.filter(p => p.dateOfBirth || p.gender || p.hireDate).length}
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-cyan-400 mb-1">Con Email</p>
              <p className="text-2xl font-light text-white">
                {participants.filter(p => p.email).length}
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Info canales - Más sutil */}
      {demographicsStats?.contactChannels && (
        <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">ℹ️</span>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-cyan-400 font-medium mb-1.5">Campos requeridos:</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• <span className="text-cyan-400">RUT</span> obligatorio para todos</p>
                  <p>• <span className="text-white">Email O Celular</span> al menos uno requerido</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-cyan-400/10">
                <p className="text-xs text-cyan-400 font-medium mb-2">Canales detectados:</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>Email: <span className="text-white">{demographicsStats.contactChannels.withEmail}</span></div>
                  <div>Celular: <span className="text-green-400">{demographicsStats.contactChannels.withPhone}</span></div>
                  <div>Ambos: <span className="text-cyan-400">{demographicsStats.contactChannels.withBoth}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}