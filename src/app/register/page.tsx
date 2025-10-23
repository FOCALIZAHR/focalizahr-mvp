
import React, { Suspense } from 'react'
import AuthForm from '@/components/forms/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registro - FocalizaHR',
  description: 'Registra tu empresa y comienza a medir el clima laboral con FocalizaHR'
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthForm mode="register" />
    </Suspense>
  )
}