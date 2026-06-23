// ════════════════════════════════════════════════════════════════════════════
// src/lib/services/EscalationConfigService.ts
// GATE D v3.0 - Offset de la escalación WhatsApp (cascada de 3 niveles)
// ════════════════════════════════════════════════════════════════════════════
// Replica EXACTA del patrón de SalaryConfigService.getSalaryForAccount:
//   - Cascada de `if` con `return` temprano (NO operador `??`).
//   - Tres orígenes + default, reportados en `source`.
//   - OMITE `confidence` (no aplica a un offset de cadencia).
//
// Jerarquía: Campaign (override) -> Account (política) -> CampaignType (default
// producto) -> default del sistema (2 días). El offset cuenta DÍAS DESPUÉS del
// último reminder enviado (cadencia relativa hacia adelante), NO desde el cierre.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

export interface EscalationDelayResult {
  days: number;
  source: 'campaign_override' | 'account_policy' | 'producttype_default' | 'system_default';
}

// Default del sistema cuando ningún nivel define el offset (decisión 3 sellada).
export const DEFAULT_ESCALATION_DELAY_DAYS = 2;

export class EscalationConfigService {
  /**
   * Resuelve el offset de escalación WhatsApp para una campaña, en cascada.
   *
   * @param campaignId - campaña sobre la que cuelga la escalación
   * @returns { days, source } - días de offset y de qué nivel salió
   */
  static async getEscalationDelayForCampaign(campaignId: string): Promise<EscalationDelayResult> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        whatsappEscalationDelayDays: true,
        account: { select: { whatsappEscalationDelayDays: true } },
        campaignType: { select: { whatsappEscalationDelayDays: true } }
      }
    });

    if (!campaign) {
      return { days: DEFAULT_ESCALATION_DELAY_DAYS, source: 'system_default' };
    }

    // NIVEL 1: override puntual de la campaña
    if (campaign.whatsappEscalationDelayDays != null) {
      return { days: campaign.whatsappEscalationDelayDays, source: 'campaign_override' };
    }

    // NIVEL 2: política de la cuenta
    if (campaign.account?.whatsappEscalationDelayDays != null) {
      return { days: campaign.account.whatsappEscalationDelayDays, source: 'account_policy' };
    }

    // NIVEL 3: default del producto (CampaignType)
    if (campaign.campaignType?.whatsappEscalationDelayDays != null) {
      return { days: campaign.campaignType.whatsappEscalationDelayDays, source: 'producttype_default' };
    }

    // NIVEL 4: default del sistema
    return { days: DEFAULT_ESCALATION_DELAY_DAYS, source: 'system_default' };
  }
}
