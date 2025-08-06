// ARCHIVO: /src/components/monitor/ActionButtons.tsx

import { Button } from '@/components/ui/button';
import { 
  Send, 
  AlertTriangle, 
  Calendar, 
  Eye
} from 'lucide-react';

interface ActionButtonsProps {
  handleSendReminder: () => void;
  handleSendDepartmentReminder: (department: string) => void;
  handleExtendCampaign: () => void;
}

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('focalizahr_token') || '';
  }
  return '';
};

export function ActionButtons({
  handleSendReminder,
  handleSendDepartmentReminder,
  handleExtendCampaign
}: ActionButtonsProps) {

  // ✅ ACCIONES REALES - NO MÁS ALERTS
  const handleSendReminderReal = async () => {
    try {
      console.log('📧 Enviando recordatorio general...');
      await handleSendReminder();
    } catch (error) {
      console.error('❌ Error enviando recordatorio:', error);
    }
  };

  const handleExtendCampaignReal = async () => {
    try {
      console.log('📅 Extendiendo campaña...');
      await handleExtendCampaign();
    } catch (error) {
      console.error('❌ Error extendiendo campaña:', error);
    }
  };

  const handleDepartmentReminderReal = async (department: string) => {
    try {
      console.log(`📧 Enviando recordatorio a ${department}...`);
      await handleSendDepartmentReminder(department);
    } catch (error) {
      console.error(`❌ Error enviando recordatorio a ${department}:`, error);
    }
  };

  const handleAnalyticsByDepartment = () => {
    // Esta funcionalidad se implementará en próxima fase
    console.log('📊 Analytics por departamento (próxima implementación)');
  };

  return (
    <div data-component="ActionButtons" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Button 
        onClick={handleSendReminderReal}
        className="btn-gradient"
      >
        <Send className="h-4 w-4 mr-2" />
        Recordatorio General
      </Button>
      
      <Button 
        onClick={() => handleDepartmentReminderReal('Ventas')}
        variant="outline"
        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Urgente: Ventas
      </Button>
      
      <Button 
        onClick={handleExtendCampaignReal}
        variant="outline"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Extender Campaña
      </Button>
      
      <Button 
        onClick={handleAnalyticsByDepartment}
        variant="outline"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Eye className="h-4 w-4 mr-2" />
        Análisis por Depto
      </Button>
    </div>
  );
}