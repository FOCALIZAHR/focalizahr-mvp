// /app/dashboard/admin/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/useSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  
  if (!isAdminRoute) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        {children}
      </main>
    </div>
  );
}