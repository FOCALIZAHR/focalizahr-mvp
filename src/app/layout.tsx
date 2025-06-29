import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner';
import { ToastProvider } from '@/components/ui/toast-system';
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FocalizaHR MVP - Pulso de Bienestar',
  description: 'Plataforma de medición de clima laboral para PyMEs chilenas. Transforma los datos de tu equipo en decisiones estratégicas.',
  keywords: 'clima laboral, recursos humanos, PyMEs, Chile, bienestar laboral, encuestas',
  authors: [{ name: 'FocalizaHR' }],
  creator: 'FocalizaHR',
  publisher: 'FocalizaHR',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'FocalizaHR MVP - Pulso de Bienestar',
    description: 'Mide y mejora el clima laboral de tu empresa con análisis basados en IA',
    siteName: 'FocalizaHR',
    locale: 'es_CL'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FocalizaHR MVP - Pulso de Bienestar',
    description: 'Plataforma de clima laboral para PyMEs chilenas'
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#22D3EE'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <ToastProvider>
          <div className="main-layout">
            {children}
          </div>
        </ToastProvider>
        <Toaster />
      </body>
    </html>
  )
}