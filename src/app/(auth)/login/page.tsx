import React from 'react'
import AuthForm from '@/components/forms/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión - FocalizaHR MVP',
  description: 'Accede a tu cuenta de FocalizaHR y gestiona tus campañas de clima laboral'
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}