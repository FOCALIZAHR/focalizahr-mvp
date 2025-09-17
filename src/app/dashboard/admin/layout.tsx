// src/app/dashboard/admin/layout.tsx
'use client';

import AdminNavigation from '@/components/admin/AdminNavigation';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminNavigation />
      
      {/* Main Content - IMPORTANTE: margin-left dinámico */}
      <main className={cn(
        "transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-72",
        "min-h-screen"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}