import React from 'react';
import { Badge } from '../ui/Badge';

const roleVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple'> = {
  Admin: 'danger', Management: 'purple', Doctor: 'info', Nurse: 'success',
  Receptionist: 'warning', Pharmacist: 'info', Biller: 'warning', Patient: 'default',
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <Badge variant={roleVariantMap[role] || 'default'}>{role}</Badge>
);
