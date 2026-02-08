// ════════════════════════════════════════════════════════════════════════════
// NEW CALIBRATION PAGE
// src/app/dashboard/performance/calibration/new/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import CalibrationWizard from '@/components/calibration/CalibrationWizard'

export const metadata = {
  title: 'Nueva Calibración | FocalizaHR'
}

export default function NewCalibrationPage() {
  return <CalibrationWizard />
}
