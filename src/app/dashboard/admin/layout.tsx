// /app/dashboard/admin/layout.tsx
'use client';

import AdminNavigation from '@/components/admin/AdminNavigation';
import '@/styles/sidebar-premium.css';
import '@/styles/focalizahr-design-system.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Fixed width */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="fixed inset-y-0 left-0 w-72">
          <AdminNavigation />
        </div>
      </div>
      
      {/* Main Content - Takes remaining space */}
      <main className="flex-1 min-h-screen">
        {children}
      </main>
      
      {/* Mobile */}
      <div className="lg:hidden">
        <AdminNavigation />
      </div>
    </div>
  );
}