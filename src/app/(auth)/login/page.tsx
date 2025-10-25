import React, { Suspense } from 'react'
import AuthForm from '@/components/forms/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión - FocalizaHR',
  description: 'Accede a tu cuenta de FocalizaHR y gestiona tus campañas de clima laboral'
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#22D3EE'
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthForm mode="login" />
    </Suspense>
  )
}