import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Settings, Shield, Zap, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MatchRule {
  id: string;
  user_id: string;
  rule_type: 'always_match' | 'never_match' | 'confidence_threshold' | 'domain_whitelist' | 'domain_blacklist';
  rule_data: any;
  is_active: boolean;
  created_at: string;
  description?: string;
}

interface MatchRulesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MatchRulesManager: React.FC<MatchRulesManagerProps> = ({
  open,
  onOpenChange
}) => {
  const [newRule, setNewRule] = useState({
    type: 'always_match',
    email: '',
    domain: '',
    threshold: 75,
    description: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's matching rules (using existing table for now)
  const { data: matchRules = [], isLoading } = useQuery({
    queryKey: ['match-rules'],
    queryFn: async () => {
      // For now, return empty array since user_matching_rules table doesn't exist
      // This would be implemented when the table is created
      return [] as MatchRule[];
    },
    enabled: open
  });

  // Create new rule mutation (placeholder)
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      // Placeholder - would insert into user_matching_rules table when it exists
      console.log('Would create rule:', ruleData);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-rules'] });
      setNewRule({
        type: 'always_match',
        email: '',
        domain: '',
        threshold: 75,
        description: ''
      });
      toast({
        title: "Rule created",
        description: "New matching rule has been added"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create matching rule",
        variant: "destructive"
      });
    }
  });

  // Toggle rule active state (placeholder)
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Placeholder - would update user_matching_rules table when it exists
      console.log('Would toggle rule:', id, isActive);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-rules'] });
    }
  });

  // Delete rule mutation (placeholder)
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      // Placeholder - would delete from user_matching_rules table when it exists
      console.log('Would delete rule:', id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-rules'] });
      toast({
        title: "Rule deleted",
        description: "Matching rule has been removed"
      });
    }
  });

  const handleCreateRule = () => {
    let ruleData: any = {};

    switch (newRule.type) {
      case 'always_match':
      case 'never_match':
        if (!newRule.email) {
          toast({
            title: "Email required",
            description: "Please enter an email address",
            variant: "destructive"
          });
          return;
        }
        ruleData = { email: newRule.email };
        break;
      
      case 'domain_whitelist':
      case 'domain_blacklist':
        if (!newRule.domain) {
          toast({
            title: "Domain required",
            description: "Please enter a domain",
            variant: "destructive"
          });
          return;
        }
        ruleData = { domain: newRule.domain };
        break;
      
      case 'confidence_threshold':
        ruleData = { threshold: newRule.threshold };
        break;
    }

    createRuleMutation.mutate({
      rule_type: newRule.type,
      rule_data: ruleData,
      description: newRule.description,
      is_active: true
    });
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'always_match': return 'Always Match';
      case 'never_match': return 'Never Match';
      case 'confidence_threshold': return 'Confidence Threshold';
      case 'domain_whitelist': return 'Domain Whitelist';
      case 'domain_blacklist': return 'Domain Blacklist';
      default: return type;
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'always_match': return 'bg-green-100 text-green-800';
      case 'never_match': return 'bg-red-100 text-red-800';
      case 'confidence_threshold': return 'bg-blue-100 text-blue-800';
      case 'domain_whitelist': return 'bg-emerald-100 text-emerald-800';
      case 'domain_blacklist': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRuleData = (rule: MatchRule) => {
    switch (rule.rule_type) {
      case 'always_match':
      case 'never_match':
        return rule.rule_data.email;
      case 'domain_whitelist':
      case 'domain_blacklist':
        return rule.rule_data.domain;
      case 'confidence_threshold':
        return `${rule.rule_data.threshold}%`;
      default:
        return JSON.stringify(rule.rule_data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contact Matching Rules
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rules" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rules">Active Rules</TabsTrigger>
            <TabsTrigger value="create">Create New Rule</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="flex-1 overflow-auto space-y-4 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : matchRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No matching rules configured</p>
                <p className="text-sm">Create your first rule to customize contact matching</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={getRuleTypeColor(rule.rule_type)}
                          >
                            {getRuleTypeLabel(rule.rule_type)}
                          </Badge>
                          <div>
                            <div className="font-medium">{formatRuleData(rule)}</div>
                            {rule.description && (
                              <div className="text-sm text-muted-foreground">
                                {rule.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) => 
                              toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-auto space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-type">Rule Type</Label>
                <Select value={newRule.type} onValueChange={(value) => setNewRule(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always_match">Always Match - Auto-confirm specific contacts</SelectItem>
                    <SelectItem value="never_match">Never Match - Always reject specific contacts</SelectItem>
                    <SelectItem value="confidence_threshold">Confidence Threshold - Set minimum confidence level</SelectItem>
                    <SelectItem value="domain_whitelist">Domain Whitelist - Only match these domains</SelectItem>
                    <SelectItem value="domain_blacklist">Domain Blacklist - Never match these domains</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newRule.type === 'always_match' || newRule.type === 'never_match') && (
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={newRule.email}
                    onChange={(e) => setNewRule(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              )}

              {(newRule.type === 'domain_whitelist' || newRule.type === 'domain_blacklist') && (
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="company.com"
                    value={newRule.domain}
                    onChange={(e) => setNewRule(prev => ({ ...prev, domain: e.target.value }))}
                  />
                </div>
              )}

              {newRule.type === 'confidence_threshold' && (
                <div>
                  <Label htmlFor="threshold">Minimum Confidence Threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this rule..."
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRule}
                  disabled={createRuleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Rule
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};