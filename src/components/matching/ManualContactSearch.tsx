import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, User, Building, Mail, Phone, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  title?: string;
  source: 'crm' | 'zapier';
  crm_type?: string;
}

interface ManualContactSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantData: any;
  onContactSelected: (contactId: string) => void;
}

export const ManualContactSearch: React.FC<ManualContactSearchProps> = ({
  open,
  onOpenChange,
  participantData,
  onContactSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  // Initialize search with participant data
  useEffect(() => {
    if (open && participantData) {
      const initialSearch = participantData.email || participantData.name || '';
      setSearchTerm(initialSearch);
    }
  }, [open, participantData]);

  // Search contacts from CRM integrations
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['contact-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      // This would typically call your CRM integration endpoints
      // For now, we'll simulate the search
      const mockResults: Contact[] = [
        {
          id: 'contact_1',
          name: 'John Smith',
          email: 'john.smith@acme.com',
          company: 'Acme Corporation',
          phone: '+1 (555) 123-4567',
          title: 'VP of Sales',
          source: 'crm',
          crm_type: 'salesforce'
        },
        {
          id: 'contact_2',
          name: 'Jane Doe',
          email: 'jane.doe@techcorp.com',
          company: 'TechCorp',
          phone: '+1 (555) 987-6543',
          title: 'Director of Marketing',
          source: 'crm',
          crm_type: 'hubspot'
        }
      ];

      // Filter based on search term
      return mockResults.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    enabled: open && searchTerm.length >= 2
  });

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleConfirmSelection = () => {
    if (selectedContact) {
      onContactSelected(selectedContact.id);
      onOpenChange(false);
      setSelectedContact(null);
      setSearchTerm('');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedContact(null);
    setSearchTerm('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCRMBadgeColor = (crmType?: string) => {
    switch (crmType) {
      case 'salesforce': return 'bg-blue-100 text-blue-800';
      case 'hubspot': return 'bg-orange-100 text-orange-800';
      case 'pipedrive': return 'bg-green-100 text-green-800';
      case 'zoho': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search for Contact Manually</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Participant Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Looking for match for:</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(participantData?.name || 'UN')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{participantData?.name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">
                  {participantData?.email || participantData?.company || 'No additional info'}
                </div>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Searching contacts...</span>
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Enter at least 2 characters to search</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No contacts found matching "{searchTerm}"</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedContact?.id === contact.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.name}</span>
                          {contact.crm_type && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getCRMBadgeColor(contact.crm_type)}`}
                            >
                              {contact.crm_type.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        
                        {contact.title && (
                          <div className="text-sm text-muted-foreground">
                            {contact.title}
                          </div>
                        )}
                        
                        {contact.company && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building className="h-3 w-3" />
                            {contact.company}
                          </div>
                        )}
                        
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                      
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedContact ? `Selected: ${selectedContact.name}` : 'Select a contact to continue'}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={!selectedContact}
              >
                Confirm Match
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};