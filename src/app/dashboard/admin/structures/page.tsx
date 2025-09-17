// src/app/dashboard/admin/structures/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Settings 
} from 'lucide-react';

interface StructureOverview {
  id: string;
  companyName: string;
  gerenciasCount: number;
  departmentsCount: number;
  orphanDepartmentsCount: number;
  structureComplete: boolean;
}

export default function StructuresOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<StructureOverview[]>([]);
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    completedStructures: 0,
    pendingStructures: 0,
    totalOrphans: 0
  });

  useEffect(() => {
    fetchStructuresOverview();
  }, []);

  const fetchStructuresOverview = async () => {
    try {
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch('/api/admin/structures/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStructures(result.data.structures);
        setMetrics(result.data.metrics);
      }
    } catch (error) {
      console.error('Error loading structures:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Torre de Control - Estructuras
        </h1>
        <p className="text-gray-400 mt-2">
          Supervisión del estado de configuración organizacional de todos los clientes
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="metric-card border-slate-700/50 bg-slate-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Empresas</p>
                <p className="text-2xl font-bold text-white">{metrics.totalAccounts}</p>
              </div>
              <Building2 className="h-8 w-8 text-cyan-400/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-slate-700/50 bg-slate-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completas</p>
                <p className="text-2xl font-bold text-green-400">{metrics.completedStructures}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-slate-700/50 bg-slate-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-amber-400">{metrics.pendingStructures}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-400/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-slate-700/50 bg-slate-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sin Asignar</p>
                <p className="text-2xl font-bold text-yellow-400">{metrics.totalOrphans}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de empresas */}
      <Card className="professional-card border-slate-700/50 bg-slate-800/50 backdrop-blur">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50">
                <TableHead className="text-gray-400">Empresa</TableHead>
                <TableHead className="text-gray-400 text-center">Gerencias</TableHead>
                <TableHead className="text-gray-400 text-center">Departamentos</TableHead>
                <TableHead className="text-gray-400 text-center">Sin Asignar</TableHead>
                <TableHead className="text-gray-400 text-center">Estado</TableHead>
                <TableHead className="text-gray-400 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((structure) => (
                <TableRow key={structure.id} className="border-slate-700/30 hover:bg-slate-800/30">
                  <TableCell className="font-medium text-white">
                    {structure.companyName}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-gray-300">{structure.gerenciasCount}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-gray-300">{structure.departmentsCount}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {structure.orphanDepartmentsCount > 0 ? (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {structure.orphanDepartmentsCount}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        0
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {structure.structureComplete ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Completa
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/accounts/${structure.id}/structure`)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Gestionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}