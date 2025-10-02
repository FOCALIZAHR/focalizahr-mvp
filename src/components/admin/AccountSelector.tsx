// ============================================
// COMPONENTE: AccountSelector
// Selector de empresa cliente (Solo Admin)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Search, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';

interface Account {
  id: string;
  companyName: string;
  adminEmail: string;
  status: string;
  subscriptionTier: string;
}

interface AccountSelectorProps {
  value: string;
  onChange: (accountId: string, accountName: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AccountSelector({
  value,
  onChange,
  placeholder = 'Buscar empresa por nombre o email...',
  className = ''
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  
  const { error } = useToast();

  // ============================================
  // FETCH ACCOUNTS
  // ============================================

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/accounts?limit=100', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar empresas');
      }

      const data = await response.json();
      
      // Verificar que data.data sea un array
      if (data.success && Array.isArray(data.data)) {
        setAccounts(data.data);
        setFilteredAccounts(data.data);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Formato de respuesta inválido');
      }

    } catch (err) {
      console.error('Accounts fetch error:', err);
      error('Error al cargar lista de empresas', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ============================================
  // FILTRAR ACCOUNTS
  // ============================================

  useEffect(() => {
    if (!searchTerm) {
      setFilteredAccounts(accounts);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = accounts.filter(acc => 
      acc.companyName.toLowerCase().includes(term) ||
      acc.adminEmail.toLowerCase().includes(term)
    );
    setFilteredAccounts(filtered);
  }, [searchTerm, accounts]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelect = (account: Account) => {
    onChange(account.id, account.companyName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedAccount = accounts.find(acc => acc.id === value);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`relative ${className}`}>
      {/* Selected Display o Search Input */}
      {!isOpen && selectedAccount ? (
        <div 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{selectedAccount.companyName}</p>
            <p className="text-sm text-slate-400">{selectedAccount.adminEmail}</p>
          </div>
          <Check className="w-5 h-5 text-green-400" />
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Dropdown List */}
      {isOpen && (
        <>
          {/* Backdrop para cerrar */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Lista de accounts */}
          <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-slate-400 text-sm mt-2">Cargando empresas...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">
                  {searchTerm ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filteredAccounts.map((account) => {
                  const isSelected = account.id === value;
                  const statusColors = {
                    ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
                    TRIAL: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                    SUSPENDED: 'bg-red-500/20 text-red-300 border-red-500/30',
                    INACTIVE: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  };

                  return (
                    <div
                      key={account.id}
                      onClick={() => handleSelect(account)}
                      className={`
                        px-4 py-3 cursor-pointer transition-colors
                        hover:bg-slate-800/50
                        ${isSelected ? 'bg-cyan-500/10' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold">
                              {account.companyName}
                            </p>
                            <span className={`
                              inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border
                              ${statusColors[account.status as keyof typeof statusColors] || statusColors.INACTIVE}
                            `}>
                              {account.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {account.adminEmail}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 ml-3" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}