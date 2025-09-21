import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onAccept: (reason?: string) => void;
  onReject: (reason?: string) => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

export function BulkActions({
  selectedCount,
  onAccept,
  onReject,
  onClearSelection,
  isLoading
}: BulkActionsProps) {
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [acceptReason, setAcceptReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = () => {
    onAccept(acceptReason || undefined);
    setAcceptReason('');
    setAcceptDialogOpen(false);
  };

  const handleReject = () => {
    onReject(rejectReason || undefined);
    setRejectReason('');
    setRejectDialogOpen(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedCount} transcript{selectedCount > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center gap-2">
          <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Accept All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Accept {selectedCount} Transcript{selectedCount > 1 ? 's' : ''}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accept-reason">Reason (Optional)</Label>
                  <Textarea
                    id="accept-reason"
                    placeholder="Why are you accepting these transcripts?"
                    value={acceptReason}
                    onChange={(e) => setAcceptReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAccept} disabled={isLoading}>
                    Accept All
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Decline All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Decline {selectedCount} Transcript{selectedCount > 1 ? 's' : ''}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Reason (Optional)</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Why are you declining these transcripts?"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
                    Decline All
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4" />
        Clear Selection
      </Button>
    </div>
  );
}