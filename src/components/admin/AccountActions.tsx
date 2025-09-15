// /components/admin/AccountActions.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit2, Building2 } from 'lucide-react';

interface AccountActionsProps {
  accountId: string;
}

export default function AccountActions({ accountId }: AccountActionsProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/dashboard/admin/accounts/${accountId}`);
  };

  const handleEdit = () => {
    router.push(`/dashboard/admin/accounts/${accountId}/edit`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Acciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalle
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit2 className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>

        {/* Futuras acciones - comentadas para Fase 2 */}
        {/* 
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-yellow-600">
          <Pause className="mr-2 h-4 w-4" />
          Suspender
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
        */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}