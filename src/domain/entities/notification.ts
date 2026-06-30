export interface NotificationEntity {
  id: string;
  title: string;
  body: string;
  type: 'status_update' | 'reward_earned' | 'duplicate_fused' | 'dispatch' | 'sla_breach' | 'system_alert' | 'escalation';
  isRead: boolean;
  relatedComplaintId?: string | null;
  createdAt: string; // ISO format string
  recipientRole: 'citizen' | 'authority';
  department?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'critical' | null;
}
