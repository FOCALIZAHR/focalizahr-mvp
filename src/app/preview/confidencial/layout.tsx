import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FocalizaHR — Vista privada',
  description: 'Vista confidencial de uso exclusivo.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function ConfidencialPreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
