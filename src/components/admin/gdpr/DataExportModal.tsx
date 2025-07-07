
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: () => void;
}

interface ExportOptions {
  includeTranscripts: boolean;
  includeAnalytics: boolean;
  includeActivityLogs: boolean;
  includeAccountData: boolean;
}

export function DataExportModal({ isOpen, onClose, userId, onSuccess }: DataExportModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [format, setFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [options, setOptions] = useState<ExportOptions>({
    includeTranscripts: true,
    includeAnalytics: true,
    includeActivityLogs: true,
    includeAccountData: true
  });

  const exportMutation = useMutation({
    mutationFn: async (exportRequest: {
      userId: string;
      format: 'json' | 'csv' | 'xml';
      options: ExportOptions;
    }) => {
      // Create export request in database
      const { data, error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: exportRequest.userId,
          requested_by: currentUser?.id,
          format: exportRequest.format,
          status: 'pending',
          options: exportRequest.options,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Export Requested",
        description: "Data export has been queued for processing. You'll be notified when it's ready for download.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Failed to request data export. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleExport = () => {
    if (!selectedUserId) {
      toast({
        title: "User Required",
        description: "Please select a user for data export.",
        variant: "destructive",
      });
      return;
    }

    exportMutation.mutate({
      userId: selectedUserId,
      format,
      options
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export User Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!userId && (
            <div>
              <Label>Select User</Label>
              <div className="mt-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    User selection will be implemented with user search
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: 'json' | 'csv' | 'xml') => setFormat(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON (Machine Readable)</SelectItem>
                <SelectItem value="csv">CSV (Spreadsheet Compatible)</SelectItem>
                <SelectItem value="xml">XML (Structured Data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data Types to Include</Label>
            <div className="mt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transcripts"
                  checked={options.includeTranscripts}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, includeTranscripts: !!checked }))
                  }
                />
                <Label htmlFor="transcripts" className="text-sm">
                  Transcripts and Content
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analytics"
                  checked={options.includeAnalytics}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, includeAnalytics: !!checked }))
                  }
                />
                <Label htmlFor="analytics" className="text-sm">
                  AI Analysis Results and Metrics
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity"
                  checked={options.includeActivityLogs}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, includeActivityLogs: !!checked }))
                  }
                />
                <Label htmlFor="activity" className="text-sm">
                  Activity Logs and Usage History
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accounts"
                  checked={options.includeAccountData}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, includeAccountData: !!checked }))
                  }
                />
                <Label htmlFor="accounts" className="text-sm">
                  Account Information and Deal Data
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">GDPR Compliance Note</h4>
            <p className="text-sm text-blue-800">
              This export will include all personal data associated with the user account. 
              The exported file will be available for download for 7 days and then automatically deleted.
              All export activities are logged for compliance audit purposes.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={exportMutation.isPending || (!userId && !selectedUserId)}
            >
              {exportMutation.isPending ? 'Processing...' : 'Request Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
