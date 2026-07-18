import React from 'react';
import { Badge } from '../ui/Badge';

const statusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  Scheduled: 'info', CheckedIn: 'warning', InConsultation: 'purple' as any, Completed: 'success', Cancelled: 'danger',
  Unpaid: 'danger', PartiallyPaid: 'warning', Paid: 'success', WrittenOff: 'default',
  Pending: 'warning', Dispensed: 'success', Active: 'info',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <Badge variant={statusVariantMap[status] || 'default'}>{status}</Badge>
);
