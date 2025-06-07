import React from 'react'
import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirigir al login como comportamiento por defecto
  redirect('/login')
}