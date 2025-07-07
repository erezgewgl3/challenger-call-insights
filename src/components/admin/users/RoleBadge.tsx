
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';

interface RoleBadgeProps {
  role: 'admin' | 'sales_user';
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (role === 'admin') {
    return (
      <Badge variant="default" className={`flex items-center gap-1 ${className}`}>
        <Shield className="w-3 h-3" />
        Admin
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
      <User className="w-3 h-3" />
      Sales User
    </Badge>
  );
}
