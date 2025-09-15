// /components/admin/AccountsTable.tsx
'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Building2, RefreshCw } from 'lucide-react';
import AccountActions from './AccountActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Account {
  id: string;
  companyName: string;
  logoUrl: string | null;
  adminName: string;
  adminEmail: string;
  subscriptionTier: string;
  status: string;
  createdAt: string;
  industry?: string;
  companySize?: string;
}

interface AccountsTableProps {
  accounts: Account[];
  totalPages: number;
  currentPage: number;
  searchParams?: {
    search?: string;
    plan?: string;
    page?: string;
  };
}

export default function AccountsTable({ 
  accounts, 
  totalPages, 
  currentPage,
  searchParams: initialSearchParams
}: AccountsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Estados locales para los inputs (para UX inmediata)
  const [searchInput, setSearchInput] = useState(initialSearchParams?.search || '');
  const [planFilter, setPlanFilter] = useState(initialSearchParams?.plan || 'all');

  // Función para actualizar URL con nuevos parámetros
  const updateSearchParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Siempre resetear a página 1 cuando se cambian filtros
    if ('search' in updates || 'plan' in updates) {
      params.delete('page');
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    startTransition(() => {
      router.push(url);
    });
  }, [pathname, router, searchParams]);

  // Manejar búsqueda con debounce
  const handleSearch = useCallback(() => {
    updateSearchParams({ search: searchInput });
  }, [searchInput, updateSearchParams]);

  // Manejar enter en búsqueda
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Manejar cambio de filtro de plan
  const handlePlanFilterChange = (value: string) => {
    setPlanFilter(value);
    updateSearchParams({ plan: value });
  };

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  };

  // Refrescar datos
  const handleRefresh = () => {
    router.refresh();
  };

  // Helpers para badges
  const getPlanBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'default';
      case 'pro':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'destructive';
      case 'inactive':
        return 'warning';
      case 'trial':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'suspended':
        return 'Suspendido';
      case 'inactive':
        return 'Inactivo';
      case 'trial':
        return 'Prueba';
      default:
        return status;
    }
  };

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, nombre o email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-20"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              disabled={isPending}
            >
              Buscar
            </Button>
          </div>

          {/* Filtro por Plan */}
          <Select 
            value={planFilter} 
            onValueChange={handlePlanFilterChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los planes</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>

          {/* Botón Refrescar */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refrescar datos"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Indicador de carga */}
        {isPending && (
          <div className="mt-2">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Actualizando...
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <TableRow key={account.id} className={isPending ? 'opacity-50' : ''}>
                    {/* Empresa */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {account.logoUrl ? (
                            <AvatarImage src={account.logoUrl} alt={account.companyName} />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{account.companyName}</div>
                          {account.industry && (
                            <div className="text-xs text-muted-foreground">{account.industry}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Administrador */}
                    <TableCell>
                      <div>
                        <div className="font-medium">{account.adminName}</div>
                        <div className="text-sm text-muted-foreground">{account.adminEmail}</div>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(account.subscriptionTier)}>
                        {account.subscriptionTier.toUpperCase()}
                      </Badge>
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(account.status)}
                        className={
                          account.status === 'active' 
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : account.status === 'suspended'
                            ? 'bg-red-500/10 text-red-600 border-red-500/20'
                            : account.status === 'inactive'
                            ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                            : ''
                        }
                      >
                        {getStatusLabel(account.status)}
                      </Badge>
                    </TableCell>

                    {/* Fecha de Creación */}
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(account.createdAt), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(account.createdAt), 'HH:mm')}
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <AccountActions accountId={account.id} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="text-muted-foreground">
                      {initialSearchParams?.search || initialSearchParams?.plan !== 'all' 
                        ? 'No se encontraron cuentas con los filtros aplicados'
                        : 'No hay cuentas registradas'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              {/* Mostrar máximo 5 páginas */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isPending}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}