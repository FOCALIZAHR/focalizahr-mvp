import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ciclo de Talento · FocalizaHR',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

export default function CicloTalentoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
