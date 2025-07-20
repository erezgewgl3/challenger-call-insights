import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Check, Mail, UserPlus } from 'lucide-react';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { ExistingUserWarningDialog } from './ExistingUserWarningDialog';
import { generateSecureInviteLink, logSecurityEvent } from '@/utils/domainUtils';

const createInviteSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  expiresInDays: z.number().min(1).max(30),
  sendEmail: z.boolean()
});

type CreateInviteForm = z.infer<typeof createInviteSchema>;

interface ExistingUserData {
  type: 'user' | 'invite';
  email: string;
  userStatus?: string;
  inviteStatus?: string;
}

export function CreateInviteForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [existingUserData, setExistingUserData] = useState<ExistingUserData | null>(null);
  const [pendingFormData, setPendingFormData] = useState<CreateInviteForm | null>(null);

  const form = useForm<CreateInviteForm>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      email: '',
      expiresInDays: 7,
      sendEmail: true
    }
  });

  // Check for existing users/invites
  const checkExistingMutation = useMutation({
    mutationFn: async (email: string) => {
      // Check for existing user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, status')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return {
          type: 'user' as const,
          email,
          userStatus: existingUser.status
        };
      }

      // Check for pending invites
      const { data: pendingInvite } = await supabase
        .from('invites')
        .select('id, expires_at')
        .eq('email', email)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (pendingInvite) {
        return {
          type: 'invite' as const,
          email,
          inviteStatus: 'pending'
        };
      }

      return null;
    }
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: CreateInviteForm) => {
      // Delete any existing pending invites for this email
      await supabase
        .from('invites')
        .delete()
        .eq('email', data.email)
        .is('used_at', null);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

      // Generate secure token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      
      // Generate the invite link
      const inviteLink = generateSecureInviteLink(token);

      // Create invite
      const { data: invite, error } = await supabase
        .from('invites')
        .insert({
          email: data.email,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id,
          email_sent: false
        })
        .select()
        .single();

      if (error) throw error;

      // Send email if requested
      if (data.sendEmail) {
        try {
          // Log security event for monitoring
          logSecurityEvent('invite_link_generated', {
            email: data.email,
            domain: inviteLink.split('/register')[0],
            expiresAt: expiresAt.toISOString()
          });
          
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              type: 'invite',
              to: data.email,
              data: {
                email: data.email,
                inviteLink,
                expiresAt: expiresAt.toISOString(),
                invitedBy: user?.email || 'Sales Whisperer Team'
              }
            }
          });

          if (emailError) {
            console.error('Email send error:', emailError);
            // Update invite with error
            await supabase
              .from('invites')
              .update({ 
                email_error: emailError.message || 'Failed to send email'
              })
              .eq('id', invite.id);
          } else {
            // Update invite as email sent
            await supabase
              .from('invites')
              .update({ 
                email_sent: true,
                email_sent_at: new Date().toISOString()
              })
              .eq('id', invite.id);
          }
        } catch (emailError: any) {
          console.error('Email send error:', emailError);
          // Update invite with error
          await supabase
            .from('invites')
            .update({ 
              email_error: emailError.message || 'Failed to send email'
            })
            .eq('id', invite.id);
        }
      }

      return { invite, token };
    },
    onSuccess: ({ invite, token }) => {
      // Use secure domain utility for generated link display
      const inviteLink = generateSecureInviteLink(token);
      
      setGeneratedLink(inviteLink);
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      
      toast({
        title: "Invitation Created",
        description: `Successfully created invitation for ${invite.email}`,
      });

      form.reset();
    },
    onError: (error) => {
      logSecurityEvent('invite_creation_failed', {
        error: error.message,
        email: form.getValues('email')
      });
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission with checking
  const onSubmit = async (data: CreateInviteForm) => {
    // First check for existing users/invites
    try {
      const existingData = await checkExistingMutation.mutateAsync(data.email);
      
      if (existingData) {
        // Show warning dialog
        setExistingUserData(existingData);
        setPendingFormData(data);
        setShowWarningDialog(true);
      } else {
        // No conflicts, proceed directly
        createInviteMutation.mutate(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check existing users. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle continuing after warning
  const handleContinueAfterWarning = () => {
    if (pendingFormData) {
      createInviteMutation.mutate(pendingFormData);
      setShowWarningDialog(false);
      setExistingUserData(null);
      setPendingFormData(null);
    }
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowWarningDialog(false);
      setExistingUserData(null);
      setPendingFormData(null);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopySuccess(true);
      
      logSecurityEvent('invite_link_copied', {
        domain: generatedLink.split('/register')[0]
      });
      
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create New Invitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires In</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send Email Invitation</FormLabel>
                    <FormDescription>
                      Automatically send the invitation link via email
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={createInviteMutation.isPending}
            >
              {createInviteMutation.isPending ? (
                'Creating Invitation...'
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Create Invitation
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Generated Link Section */}
        {generatedLink && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Invitation Created!</span>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invitation Link:</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Warning Dialog */}
        <ExistingUserWarningDialog
          open={showWarningDialog}
          onOpenChange={handleDialogClose}
          existingData={existingUserData}
          onContinue={handleContinueAfterWarning}
        />
      </CardContent>
    </Card>
  );
}
