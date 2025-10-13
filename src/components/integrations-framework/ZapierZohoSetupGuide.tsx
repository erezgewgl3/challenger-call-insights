import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import { Document, Paragraph, Packer, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { toast } from '@/hooks/use-toast';

export const ZapierZohoSetupGuide: React.FC = () => {
  const generateDocument = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: "Sales Whisperer - Zapier & Zoho CRM Integration Guide",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            
            new Paragraph({
              text: "Two-Way Integration Setup Instructions",
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 }
            }),

            // Introduction
            new Paragraph({
              text: "Introduction",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
              text: "This guide will walk you through setting up a two-way integration between Sales Whisperer and Zoho CRM using Zapier. This integration allows:",
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              text: "• Automatic transcript ingestion from Zoho CRM to Sales Whisperer",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• AI analysis results pushed back to Zoho CRM deals",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Real-time synchronization of deal stages and notes",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Automated workflow triggers based on conversation insights",
              spacing: { after: 400 },
              bullet: { level: 0 }
            }),

            // Prerequisites
            new Paragraph({
              text: "Prerequisites",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
              text: "Before you begin, ensure you have:",
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              text: "✓ An active Sales Whisperer account with admin access",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "✓ A Zoho CRM account with API access enabled",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "✓ A Zapier account (Pro plan recommended for multi-step Zaps)",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "✓ Admin permissions in both Sales Whisperer and Zoho CRM",
              spacing: { after: 400 },
              bullet: { level: 0 }
            }),

            // Part 1: Zoho to Sales Whisperer
            new Paragraph({
              text: "Part 1: Zoho CRM → Sales Whisperer (Transcript Ingestion)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
              text: "This Zap automatically sends new transcripts from Zoho CRM to Sales Whisperer for AI analysis.",
              spacing: { after: 300 }
            }),

            // Step 1
            new Paragraph({
              text: "Step 1: Create a New Zap in Zapier",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "1. Log into your Zapier account at zapier.com",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Click 'Create Zap' button in the top navigation",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Give your Zap a descriptive name: 'Zoho CRM to Sales Whisperer - Transcript Sync'",
              spacing: { after: 300 }
            }),

            // Step 2
            new Paragraph({
              text: "Step 2: Set Up Zoho CRM Trigger",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "1. In the Trigger section, search for and select 'Zoho CRM'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Choose trigger event: 'New Module Entry' or 'Updated Module Entry'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Connect your Zoho CRM account:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "   • Click 'Sign in to Zoho CRM'",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Authorize Zapier to access your Zoho CRM",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Grant all requested permissions",
              spacing: { after: 200 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "4. Configure the trigger:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "   • Module: Select 'Deals' or your custom module for call recordings",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Trigger Field: Select the field that contains transcript files or URLs",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "5. Test the trigger to ensure data is pulling correctly",
              spacing: { after: 300 }
            }),

            // Step 3
            new Paragraph({
              text: "Step 3: Add Sales Whisperer Webhook Action",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "1. Click the '+' button to add an Action step",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Search for and select 'Webhooks by Zapier'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Choose action event: 'POST'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "4. Configure the webhook:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "   • URL: https://jtunkyfoadoowpymibjr.supabase.co/functions/v1/external-transcript-ingest",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Payload Type: JSON",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Method: POST",
              spacing: { after: 200 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "5. Add the following JSON payload (map Zoho CRM fields):",
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              text: '{',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '  "external_source": "zoho_crm",',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '  "zoho_deal_id": {{Deal ID from Zoho}},',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '  "transcript_content": {{Transcript Text or File URL}},',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '  "meeting_date": {{Call Date}},',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '  "participants": {{Contact Names}},',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '  "deal_context": {{Deal Stage and Notes}}',
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: '}',
              spacing: { after: 300 }
            }),
            
            new Paragraph({
              text: "6. Test the action to verify the webhook is working",
              spacing: { after: 300 }
            }),

            // Step 4
            new Paragraph({
              text: "Step 4: Add Filter (Optional but Recommended)",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "Add a filter to only process deals with transcripts:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "1. Click '+' and add a 'Filter' step",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Set condition: 'Transcript Field' → 'Is not empty'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. This prevents empty webhook calls and saves task usage",
              spacing: { after: 400 }
            }),

            // Part 2: Sales Whisperer to Zoho
            new Paragraph({
              text: "Part 2: Sales Whisperer → Zoho CRM (Analysis Results)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              pageBreakBefore: true
            }),
            
            new Paragraph({
              text: "This Zap pushes AI analysis results back to Zoho CRM deals.",
              spacing: { after: 300 }
            }),

            // Step 5
            new Paragraph({
              text: "Step 5: Create Second Zap (Reverse Direction)",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "1. Create a new Zap: 'Sales Whisperer to Zoho CRM - Analysis Push'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Set up trigger: 'Webhooks by Zapier'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Choose trigger event: 'Catch Hook'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "4. Copy the webhook URL provided by Zapier",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "5. Go to Sales Whisperer Admin Dashboard → Integrations → Zapier",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "6. Paste the webhook URL in the 'Zoho CRM Webhook' field",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "7. Return to Zapier and test the trigger (Sales Whisperer will send sample data)",
              spacing: { after: 300 }
            }),

            // Step 6
            new Paragraph({
              text: "Step 6: Parse Analysis Results",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "Add a 'Formatter' step to extract key fields:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "1. Click '+' and add 'Formatter by Zapier'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Transform type: 'Text' or 'Utilities'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Extract the following from the webhook payload:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "   • Heat Level (HIGH/MEDIUM/LOW)",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Challenger Scores (Teaching, Tailoring, Control)",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • AI Recommendations",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Next Steps",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Zoho Deal ID (to match back to the deal)",
              spacing: { after: 300 },
              indent: { left: 720 }
            }),

            // Step 7
            new Paragraph({
              text: "Step 7: Update Zoho CRM Deal",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 200 }
            }),
            
            new Paragraph({
              text: "1. Add action: 'Zoho CRM'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Choose action event: 'Update Module Entry'",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Select your Zoho CRM account",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "4. Configure the update:",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "   • Module: Deals",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Record ID: {{Zoho Deal ID from webhook}}",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "   • Fields to update:",
              spacing: { after: 100 },
              indent: { left: 720 }
            }),
            
            new Paragraph({
              text: "     - Heat Level → Custom field 'Deal Heat'",
              spacing: { after: 100 },
              indent: { left: 1440 }
            }),
            
            new Paragraph({
              text: "     - Teaching Score → Custom field 'Teaching_Score'",
              spacing: { after: 100 },
              indent: { left: 1440 }
            }),
            
            new Paragraph({
              text: "     - Tailoring Score → Custom field 'Tailoring_Score'",
              spacing: { after: 100 },
              indent: { left: 1440 }
            }),
            
            new Paragraph({
              text: "     - Control Score → Custom field 'Control_Score'",
              spacing: { after: 100 },
              indent: { left: 1440 }
            }),
            
            new Paragraph({
              text: "     - AI Notes → Append to Description field",
              spacing: { after: 300 },
              indent: { left: 1440 }
            }),
            
            new Paragraph({
              text: "5. Test the action to verify the update works",
              spacing: { after: 400 }
            }),

            // Troubleshooting
            new Paragraph({
              text: "Troubleshooting Common Issues",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              pageBreakBefore: true
            }),
            
            new Paragraph({
              text: "Issue: Zap is not triggering",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            }),
            
            new Paragraph({
              text: "• Verify Zoho CRM trigger field has data",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Check that the Zap is turned ON",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Review Zapier task history for error messages",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Ensure filter conditions are not too restrictive",
              spacing: { after: 300 },
              bullet: { level: 0 }
            }),

            new Paragraph({
              text: "Issue: Webhook returns 401 Unauthorized",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            }),
            
            new Paragraph({
              text: "• Verify the webhook URL is correct",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Check that Sales Whisperer API is accessible",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Confirm your Sales Whisperer account is active",
              spacing: { after: 300 },
              bullet: { level: 0 }
            }),

            new Paragraph({
              text: "Issue: Data not updating in Zoho CRM",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            }),
            
            new Paragraph({
              text: "• Verify custom fields exist in Zoho CRM",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Check field names match exactly (case-sensitive)",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Ensure Zapier has write permissions for those fields",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Review Zoho CRM API logs for errors",
              spacing: { after: 400 },
              bullet: { level: 0 }
            }),

            // Best Practices
            new Paragraph({
              text: "Best Practices & Recommendations",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
              text: "1. Set up error notifications in Zapier to alert you of failures",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "2. Use Zapier's built-in retry logic for transient failures",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "3. Create custom fields in Zoho CRM before setting up the integration",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "4. Test with sample data before enabling on all deals",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "5. Monitor task usage in Zapier to optimize for your plan",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "6. Document any custom field mappings for future reference",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "7. Schedule regular checks to ensure the integration is working smoothly",
              spacing: { after: 400 }
            }),

            // Support
            new Paragraph({
              text: "Additional Support",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
              text: "If you need help with this integration:",
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              text: "• Sales Whisperer Support: support@saleswhisperer.com",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Zapier Help Center: help.zapier.com",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Zoho CRM Support: help.zoho.com/portal/en/community/crm",
              spacing: { after: 100 },
              bullet: { level: 0 }
            }),
            
            new Paragraph({
              text: "• Check the Sales Whisperer knowledge base for video tutorials",
              spacing: { after: 400 },
              bullet: { level: 0 }
            }),

            // Footer
            new Paragraph({
              text: "---",
              spacing: { before: 600, after: 200 }
            }),
            
            new Paragraph({
              text: "Document Version: 1.0",
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "Last Updated: " + new Date().toLocaleDateString(),
              spacing: { after: 100 }
            }),
            
            new Paragraph({
              text: "© 2025 Sales Whisperer. All rights reserved.",
              spacing: { after: 100 }
            })
          ]
        }]
      });

      // Convert to blob and download
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Sales_Whisperer_Zapier_Zoho_Setup_Guide.docx");
      
      toast({
        title: "Success!",
        description: "Setup guide downloaded successfully"
      });
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Error",
        description: "Failed to generate document",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Zapier-Zoho Integration Setup Guide
        </CardTitle>
        <CardDescription>
          Download a comprehensive Word document with step-by-step instructions for setting up the two-way Zapier integration with Zoho CRM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={generateDocument} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Setup Guide (.docx)
        </Button>
      </CardContent>
    </Card>
  );
};
