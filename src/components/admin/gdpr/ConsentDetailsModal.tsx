
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save } from 'lucide-react';

interface ConsentDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface ConsentData {
  granular_consents: {
    transcriptProcessing: boolean;
    dataAnalytics: boolean;
    emailCommunications: boolean;
    marketingCommunications: boolean;
    thirdPartySharing: boolean;
  };
  legal_basis: string;
  renewal_required: boolean;
}

export function ConsentDetailsModal({ userId, isOpen, onClose, onUpdate }: ConsentDetailsModalProps) {
  const { toast } = useToast();
  const [consentData, setConsentData] = useState<ConsentData>({
    granular_consents: {
      transcriptProcessing: true,
      dataAnalytics: true,
      emailCommunications: false,
      marketingCommunications: false,
      thirdPartySharing: false
    },
    legal_basis: 'Article 6(1)(b) - Contract performance',
    renewal_required: false
  });

  // Fetch user and consent data
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['user-consent-details', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          consent:user_consent(
            granular_consents,
            legal_basis,
            renewal_required,
            consent_version,
            consent_date,
            last_updated
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      // Update local state with existing consent if available
      if (data.consent?.[0]) {
        setConsentData({
          granular_consents: data.consent[0].granular_consents,
          legal_basis: data.consent[0].legal_basis,
          renewal_required: data.consent[0].renewal_required
        });
      }
      
      return data;
    },
    enabled: isOpen
  });

  const updateConsentMutation = useMutation({
    mutationFn: async (data: ConsentData) => {
      const { error } = await supabase
        .from('user_consent')
        .upsert({
          user_id: userId,
          granular_consents: data.granular_consents,
          legal_basis: data.legal_basis,
          renewal_required: data.renewal_required,
          consent_version: '1.1',
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Consent Updated",
        description: "User consent preferences have been saved successfully.",
      });
      onUpdate();
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update consent preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleConsentChange = (key: keyof ConsentData['granular_consents'], value: boolean) => {
    setConsentData(prev => ({
      ...prev,
      granular_consents: {
        ...prev.granular_consents,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    updateConsentMutation.mutate(consentData);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Consent - {userInfo?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Consent Status */}
          {userInfo?.consent?.[0] && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Consent Information</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Version: {userInfo.consent[0].consent_version}</p>
                <p>Given: {new Date(userInfo.consent[0].consent_date).toLocaleDateString()}</p>
                <p>Last Updated: {new Date(userInfo.consent[0].last_updated).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Granular Consent Options */}
          <div>
            <Label className="text-base font-medium">Data Processing Permissions</Label>
            <div className="mt-3 space-y-4">
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="transcriptProcessing"
                  checked={consentData.granular_consents.transcriptProcessing}
                  onCheckedChange={(checked) =>
                    handleConsentChange('transcriptProcessing', !!checked)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="transcriptProcessing" className="font-medium">
                    Transcript Processing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow processing of uploaded transcripts for AI analysis and coaching insights.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="dataAnalytics"
                  checked={consentData.granular_consents.dataAnalytics}
                  onCheckedChange={(checked) =>
                    handleConsentChange('dataAnalytics', !!checked)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="dataAnalytics" className="font-medium">
                    Data Analytics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use anonymized data for system analytics and performance improvements.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="emailCommunications"
                  checked={consentData.granular_consents.emailCommunications}
                  onCheckedChange={(checked) =>
                    handleConsentChange('emailCommunications', !!checked)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="emailCommunications" className="font-medium">
                    Service Communications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important service updates and account notifications via email.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="marketingCommunications"
                  checked={consentData.granular_consents.marketingCommunications}
                  onCheckedChange={(checked) =>
                    handleConsentChange('marketingCommunications', !!checked)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="marketingCommunications" className="font-medium">
                    Marketing Communications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive product updates, tips, and promotional content via email.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="thirdPartySharing"
                  checked={consentData.granular_consents.thirdPartySharing}
                  onCheckedChange={(checked) =>
                    handleConsentChange('thirdPartySharing', !!checked)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="thirdPartySharing" className="font-medium">
                    Third-Party Data Sharing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sharing anonymized data with trusted partners for research purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Basis */}
          <div>
            <Label>Legal Basis for Processing</Label>
            <Select 
              value={consentData.legal_basis} 
              onValueChange={(value) => setConsentData(prev => ({ ...prev, legal_basis: value }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Article 6(1)(a) - Consent">
                  Article 6(1)(a) - Consent
                </SelectItem>
                <SelectItem value="Article 6(1)(b) - Contract performance">
                  Article 6(1)(b) - Contract performance
                </SelectItem>
                <SelectItem value="Article 6(1)(f) - Legitimate interests">
                  Article 6(1)(f) - Legitimate interests
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Renewal Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="renewalRequired"
              checked={consentData.renewal_required}
              onCheckedChange={(checked) =>
                setConsentData(prev => ({ ...prev, renewal_required: !!checked }))
              }
            />
            <Label htmlFor="renewalRequired">
              Flag for consent renewal
            </Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateConsentMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateConsentMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
