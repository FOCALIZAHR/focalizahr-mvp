// /app/dashboard/admin/accounts/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AccountsTable from '@/components/admin/AccountsTable';
import AccountsMetrics from '@/components/admin/AccountsMetrics';
import '@/styles/structure-wizard-premium.css'
import { cookies } from 'next/headers';

// Función para obtener el token de las cookies
async function getAuthToken() {
  const cookieStore = cookies();
  const token = cookieStore.get('focalizahr_token');
  return token?.value;
}

// Server Component - Fetching data desde la API real
async function getAccounts(searchParams?: {
  page?: string;
  search?: string;
  plan?: string;
  limit?: string;
}) {
  try {
    // Construir query params
    const params = new URLSearchParams();
    if (searchParams?.search) params.append('search', searchParams.search);
    if (searchParams?.plan) params.append('plan', searchParams.plan);
    if (searchParams?.page) params.append('page', searchParams.page || '1');
    params.append('limit', searchParams?.limit || '10');

    // Obtener el token de autenticación
    const token = await getAuthToken();
    
    if (!token) {
      console.error('No auth token found');
      throw new Error('No autorizado');
    }

    // URL de la API - ajusta según tu configuración
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${apiUrl}/api/admin/accounts?${params.toString()}`;
    
    console.log('Fetching accounts from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Siempre obtener datos frescos
    });

    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      
      // Si es 401 o 403, problema de autorización
      if (response.status === 401 || response.status === 403) {
        throw new Error('No autorizado - Requiere rol de administrador');
      }
      
      throw new Error(`Error fetching accounts: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Validar que tenemos la estructura esperada
    if (!result.success || !result.data) {
      console.error('Invalid API response structure:', result);
      throw new Error('Respuesta de API inválida');
    }

    return {
      accounts: result.data.accounts || [],
      totalAccounts: result.data.pagination?.totalAccounts || 0,
      totalPages: result.data.pagination?.totalPages || 1,
      currentPage: result.data.pagination?.currentPage || 1,
      metrics: result.data.metrics || {
        total: 0,
        growthPercentage: 0,
        activeAccounts: 0,
        trialAccounts: 0,
        suspendedAccounts: 0,
      },
    };
  } catch (error) {
    console.error('Error in getAccounts:', error);
    
    // En desarrollo, mostrar el error; en producción, datos vacíos
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
    
    // Retornar estructura vacía pero válida
    return {
      accounts: [],
      totalAccounts: 0,
      totalPages: 0,
      currentPage: 1,
      metrics: {
        total: 0,
        growthPercentage: 0,
        activeAccounts: 0,
        trialAccounts: 0,
        suspendedAccounts: 0,
      },
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export default async function AccountsPage({
  searchParams
}: {
  searchParams?: { 
    page?: string; 
    search?: string; 
    plan?: string;
    limit?: string;
  };
}) {
  // Obtener datos reales desde la API
  const data = await getAccounts(searchParams);

  // Si hay error, mostrarlo (solo en desarrollo)
  if ('error' in data && data.error) {
    return (
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cuentas de Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las empresas registradas en FocalizaHR
            </p>
          </div>
        </div>
        
        {/* Mensaje de error */}
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {data.error === 'No autorizado - Requiere rol de administrador' 
              ? 'No tienes permisos para ver esta página. Contacta al administrador.'
              : `Error al cargar las cuentas: ${data.error}`}
          </p>
        </div>
      </div>
    );
  }

  // Desestructurar los datos correctamente
  const { accounts, totalAccounts, totalPages, currentPage, metrics } = data;

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las empresas registradas en FocalizaHR
          </p>
        </div>
        <Link href="/dashboard/admin/accounts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Nueva Cuenta
          </Button>
        </Link>
      </div>

      {/* Métricas - pasando tanto totalAccounts como metrics */}
      <AccountsMetrics 
        totalAccounts={totalAccounts}
        metrics={metrics}
      />

      {/* Tabla Principal - con todos los props necesarios */}
      <Suspense fallback={<TableSkeleton />}>
        <AccountsTable 
          accounts={accounts}
          totalPages={totalPages}
          currentPage={currentPage}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

// Loading skeleton para la tabla
function TableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-[250px] bg-muted animate-pulse rounded" />
                <div className="h-3 w-[200px] bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-[100px] bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}