import React from 'react'
import AuthForm from '@/components/forms/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registro - FocalizaHR MVP',
  description: 'Registra tu empresa y comienza a medir el clima laboral con FocalizaHR'
}

export default function RegisterPage() {
  return <AuthForm mode="register" />
}