// ====================================================================
// VERTICAL TABS NAV - COMPONENTE REUTILIZABLE
// src/components/ui/VerticalTabsNav.tsx
// ✅ Mobile-first: Base mobile, escala hacia desktop
// ✅ Reutilizable: Tabs como props, genérico
// ✅ Elegante: Línea Tesla, slider animado
// ====================================================================

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';

// ====================================================================
// TYPES - GENÉRICOS PARA REUTILIZACIÓN
// ====================================================================

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  icon: LucideIcon;
  description?: string;
  color?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'red';
  badge?: number | string;
}

export interface VerticalTabsNavProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  isTransitioning?: boolean;
  className?: string;
}

// ====================================================================
// HELPERS
// ====================================================================

const COLOR_CONFIG = {
  cyan: {
    gradient: 'linear-gradient(135deg, #22D3EE, #0891B2)',
    shadow: '0 4px 20px rgba(34, 211, 238, 0.3)',
    text: '#22D3EE',
    line: '#22D3EE',
    badgeBg: 'rgba(34, 211, 238, 0.15)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
    shadow: '0 4px 20px rgba(167, 139, 250, 0.3)',
    text: '#A78BFA',
    line: '#A78BFA',
    badgeBg: 'rgba(167, 139, 250, 0.15)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    shadow: '0 4px 20px rgba(251, 191, 36, 0.3)',
    text: '#FBBF24',
    line: '#FBBF24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
  },
  emerald: {
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    shadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    text: '#10B981',
    line: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  red: {
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    shadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
    text: '#EF4444',
    line: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
} as const;

// ====================================================================
// MOBILE: DROPDOWN SELECTOR (BASE - MOBILE FIRST)
// ====================================================================

function MobileDropdown<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  isTransitioning,
}: VerticalTabsNavProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const activeConfig = tabs.find((t) => t.value === activeTab);
  
  if (!activeConfig) return null;
  
  const ActiveIcon = activeConfig.icon;
  const color = COLOR_CONFIG[activeConfig.color || 'cyan'];

  return (
    <div className="relative w-full">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTransitioning}
        className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(51, 65, 85, 0.4)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: color.gradient }}
          >
            <ActiveIcon className="h-4 w-4 text-slate-900" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{activeConfig.label}</p>
            {activeConfig.description && (
              <p className="text-xs text-slate-400">{activeConfig.description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                const tabColor = COLOR_CONFIG[tab.color || 'cyan'];

                return (
                  <button
                    key={tab.value}
                    onClick={() => {
                      onTabChange(tab.value);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 transition-colors hover:bg-slate-800/50"
                    style={{
                      borderLeft: isActive
                        ? `3px solid ${tabColor.line}`
                        : '3px solid transparent',
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: isActive ? tabColor.text : '#94A3B8' }}
                    />
                    <span
                      className={`text-sm flex-1 text-left ${
                        isActive ? 'text-white font-medium' : 'text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </span>
                    {tab.badge !== undefined && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: tabColor.badgeBg,
                          color: tabColor.text,
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ====================================================================
// DESKTOP: VERTICAL TABS CON SLIDER
// ====================================================================

const TAB_HEIGHT = 64;
const TAB_GAP = 4;

function DesktopVertical<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  isTransitioning,
}: VerticalTabsNavProps<T>) {
  const activeIndex = tabs.findIndex((t) => t.value === activeTab);
  const activeConfig = tabs[activeIndex];
  const color = COLOR_CONFIG[activeConfig?.color || 'cyan'];

  return (
    <div className="relative w-52 flex-shrink-0">
      {/* Container */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(51, 65, 85, 0.4)',
        }}
      >
        {/* Línea Tesla */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color.line}, transparent)`,
          }}
        />

        {/* Slider animado */}
        <motion.div
          className="absolute left-1 right-1 rounded-xl pointer-events-none"
          style={{
            height: TAB_HEIGHT,
            background: color.gradient,
            boxShadow: color.shadow,
          }}
          animate={{
            y: activeIndex * (TAB_HEIGHT + TAB_GAP) + 4,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />

        {/* Tabs */}
        <div className="relative p-1 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const tabColor = COLOR_CONFIG[tab.color || 'cyan'];

            return (
              <button
                key={tab.value}
                onClick={() => !isTransitioning && onTabChange(tab.value)}
                disabled={isTransitioning}
                className="relative z-10 flex items-center gap-3 px-3 rounded-xl transition-colors text-left"
                style={{
                  height: TAB_HEIGHT,
                  cursor: isTransitioning ? 'not-allowed' : 'pointer',
                }}
              >
                <Icon
                  className="h-4 w-4 flex-shrink-0"
                  style={{
                    color: isActive ? '#0F172A' : tabColor.text,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: isActive ? '#0F172A' : '#E2E8F0',
                    }}
                  >
                    {tab.label}
                  </p>
                  {tab.description && (
                    <p
                      className="text-xs truncate"
                      style={{
                        color: isActive
                          ? 'rgba(15, 23, 42, 0.6)'
                          : 'rgba(148, 163, 184, 0.7)',
                      }}
                    >
                      {tab.description}
                    </p>
                  )}
                </div>
                {tab.badge !== undefined && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: isActive
                        ? 'rgba(15, 23, 42, 0.2)'
                        : tabColor.badgeBg,
                      color: isActive ? '#0F172A' : tabColor.text,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// EXPORT: RESPONSIVE (MOBILE-FIRST)
// ====================================================================

export default function VerticalTabsNav<T extends string>(
  props: VerticalTabsNavProps<T>
) {
  return (
    <>
      {/* Mobile/Tablet: Dropdown (base) */}
      <div className="lg:hidden">
        <MobileDropdown {...props} />
      </div>

      {/* Desktop: Vertical tabs */}
      <div className="hidden lg:block">
        <DesktopVertical {...props} />
      </div>
    </>
  );
}

// Named exports para flexibilidad
export { MobileDropdown, DesktopVertical };