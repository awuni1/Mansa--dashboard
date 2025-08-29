'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

export default function WhatsAppManagerPage() {
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-center">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>WhatsApp Manager Disabled</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center">
            WhatsApp management functionality has been temporarily disabled. 
            Please contact the administrator for more information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}