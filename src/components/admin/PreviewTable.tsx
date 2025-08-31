// src/components/admin/ParticipantUploader/PreviewTable.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Calendar, User, MapPin, Briefcase, Building2 } from 'lucide-react';
import { ParticipantData, Gender } from '@/hooks/useParticipantUpload/types';

interface PreviewTableProps {
  participants: ParticipantData[];
  maxParticipants: number;
  showDemographics?: boolean;
}

export default function PreviewTable({ 
  participants, 
  maxParticipants,
  showDemographics = true 
}: PreviewTableProps) {
  
  // Función para formatear fecha de nacimiento
  const formatDate = (date: string | undefined): string => {
    if (!date) return '-';
    
    // Si viene en formato ISO
    if (date.includes('-')) {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    
    // Si ya está en formato DD/MM/YYYY
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
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span className="text-cyan-400">Vista Previa de Participantes</span>
          </div>
          <Badge variant={participants.length > maxParticipants ? 'destructive' : 'secondary'}>
            {participants.length} / {maxParticipants}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Departamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    <Briefcase className="h-4 w-4 inline mr-1" />
                    Cargo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Ubicación
                  </th>
                  {showDemographics && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        F. Nacimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        Edad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        <User className="h-4 w-4 inline mr-1" />
                        Género
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        <Briefcase className="h-4 w-4 inline mr-1" />
                        F. Ingreso
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        Antigüedad
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-white/5">
                {participants.map((participant, index) => {
                  const age = calculateAge(participant.dateOfBirth);
                  const seniority = calculateSeniority(participant.hireDate);
                  
                  return (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white/60">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {participant.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {participant.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {participant.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {participant.position || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {participant.location || '-'}
                      </td>
                      {showDemographics && (
                        <>
                          <td className="px-4 py-3 text-sm text-white/80">
                            {formatDate(participant.dateOfBirth)}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/80">
                            {age !== null ? `${age} años` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/80">
                            <Badge variant="outline" className="text-xs">
                              {formatGender(participant.gender)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/80">
                            {formatDate(participant.hireDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/80">
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
        </ScrollArea>
        
        {/* Resumen de datos */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-xs text-cyan-400 mb-1">Total</p>
              <p className="text-lg font-bold text-white">{participants.length}</p>
            </div>
            
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              <p className="text-xs text-cyan-400 mb-1">Con Info Completa</p>
              <p className="text-lg font-bold text-white">
                {participants.filter(p => p.name && p.department && p.position).length}
              </p>
            </div>
            
            {showDemographics && (
              <>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                  <p className="text-xs text-cyan-400 mb-1">Con Demografía</p>
                  <p className="text-lg font-bold text-white">
                    {participants.filter(p => p.dateOfBirth || p.gender || p.hireDate).length}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                  <p className="text-xs text-cyan-400 mb-1">Solo Email</p>
                  <p className="text-lg font-bold text-white">
                    {participants.filter(p => !p.name && !p.department && !p.position).length}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {showDemographics && participants.some(p => p.dateOfBirth || p.gender || p.hireDate) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Datos demográficos detectados. Esto permitirá análisis más detallados de diversidad e inclusión.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}