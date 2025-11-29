'use client'

import { ReactNode } from 'react'
import { PublicNavbar } from './PublicNavbar'
import Link from 'next/link'
import { Linkedin, Twitter, Mail } from 'lucide-react'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950"></div>
      </div>

      {/* Navbar */}
      <PublicNavbar />

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <img 
                  src="/images/focalizahr-logo_palabra.svg" 
                  alt="FocalizaHR" 
                  className="h-8"
                />
              </Link>
              <p className="text-sm text-slate-400 mb-4 max-w-md">
                Transformamos la gestión de talento con inteligencia predictiva. De autopsias organizacionales a vital signs en tiempo real.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://linkedin.com/company/focalizahr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com/focalizahr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="mailto:contacto@focalizahr.com"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Plataforma
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/products"
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Productos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/platform"
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Torre de Control
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Recursos
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Documentación</span>
                  <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                    Próximamente
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">API Reference</span>
                  <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                    Próximamente
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Blog</span>
                  <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                    Próximamente
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} FocalizaHR. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                Términos
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}