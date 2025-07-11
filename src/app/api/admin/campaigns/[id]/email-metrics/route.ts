import { emailAutomationService } from '@/lib/services/email-automation';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const metrics = await emailAutomationService.getEmailMetrics(campaignId);

    return Response.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Error fetching email metrics:', error);
    return Response.json(
      { error: 'Failed to fetch email metrics' },
      { status: 500 }
    );
  }
}