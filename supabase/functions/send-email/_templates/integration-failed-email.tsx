import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface IntegrationFailedEmailProps {
  integrationName: string
  integrationIcon?: string
  userEmail: string
  errorMessage: string
  troubleshootingUrl?: string
  supportUrl?: string
  attemptedAt: string
}

export const IntegrationFailedEmail = ({
  integrationName,
  integrationIcon = '⚠️',
  userEmail,
  errorMessage,
  troubleshootingUrl = 'https://saleswhisperer.net/help/integrations',
  supportUrl = 'mailto:support@saleswhisperer.net',
  attemptedAt
}: IntegrationFailedEmailProps) => {
  const failureDate = new Date(attemptedAt)
  
  return (
    <Html>
      <Head />
      <Preview>❌ {integrationName} integration connection failed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={errorIcon}>❌</Text>
            <Heading style={h1}>Integration Connection Failed</Heading>
            <Text style={tagline}>{integrationName} could not be connected</Text>
          </Section>

          <Section style={content}>
            <Section style={errorBox}>
              <Text style={integrationIcon}>{integrationIcon}</Text>
              <Heading style={integrationTitle}>{integrationName}</Heading>
              <Text style={summaryItem}><strong>Attempt Time:</strong> {failureDate.toLocaleString()}</Text>
              <Text style={summaryItem}><strong>Account:</strong> {userEmail}</Text>
              <Text style={errorText}>Connection failed with the following error:</Text>
              <Text style={errorMessage}>{errorMessage}</Text>
            </Section>

            <Section style={solutionsBox}>
              <Heading style={solutionsTitle}>🔧 Common Solutions:</Heading>
              <Text style={solutionItem}>• Check your {integrationName} account permissions</Text>
              <Text style={solutionItem}>• Verify your account credentials are correct</Text>
              <Text style={solutionItem}>• Ensure {integrationName} service is accessible</Text>
              <Text style={solutionItem}>• Try the connection process again</Text>
            </Section>

            <Section style={actionsSection}>
              <Button pX={24} pY={12} style={tryAgainButton} href="https://app.saleswhisperer.net/dashboard">
                🔄 Try Again
              </Button>
              <Button pX={24} pY={12} style={helpButton} href={troubleshootingUrl}>
                📖 Troubleshooting Guide
              </Button>
            </Section>

            <Section style={nextStepsBox}>
              <Heading style={nextStepsTitle}>📋 Next Steps:</Heading>
              <Text style={nextStepItem}>1. Review the error message above</Text>
              <Text style={nextStepItem}>2. Check our troubleshooting guide for specific solutions</Text>
              <Text style={nextStepItem}>3. Verify your {integrationName} account access</Text>
              <Text style={nextStepItem}>4. Retry the connection from your dashboard</Text>
              <Text style={nextStepItem}>5. Contact support if the issue persists</Text>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                Still having trouble? We're here to help!
              </Text>
              
              <Section style={supportSection}>
                <Link href={supportUrl} style={supportLink}>
                  📧 Contact Support
                </Link>
              </Section>
              
              <Text style={brandText}>
                <Link href="https://saleswhisperer.net" style={brandLink}>
                  Sales Whisperer
                </Link>
                <br />
                Elevate your sales performance with AI
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default IntegrationFailedEmail

const main = {
  backgroundColor: '#fef2f2',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  padding: '32px',
  backgroundColor: '#fee2e2',
  borderRadius: '12px',
  border: '2px solid #ef4444',
}

const errorIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
}

const h1 = {
  color: '#dc2626',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
}

const tagline = {
  color: '#7f1d1d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '1.4',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '40px 32px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
}

const errorBox = {
  backgroundColor: '#fff5f5',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #ef4444',
  textAlign: 'center' as const,
}

const integrationIcon = {
  fontSize: '32px',
  margin: '0 0 8px 0',
}

const integrationTitle = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const summaryItem = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 6px 0',
  wordWrap: 'break-word' as const,
}

const errorText = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '500',
  margin: '16px 0 8px 0',
}

const errorMessage = {
  color: '#7f1d1d',
  fontSize: '14px',
  fontFamily: 'monospace',
  backgroundColor: '#fef2f2',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #fecaca',
  margin: '8px 0 0 0',
  wordBreak: 'break-word' as const,
}

const solutionsBox = {
  backgroundColor: '#f0f9ff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #3b82f6',
}

const solutionsTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const solutionItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  wordWrap: 'break-word' as const,
}

const actionsSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap' as const,
  justifyContent: 'center',
}

const tryAgainButton = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  border: 'none',
  cursor: 'pointer',
  margin: '0 8px 8px 0',
}

const helpButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  border: 'none',
  cursor: 'pointer',
  margin: '0 8px 8px 0',
}

const nextStepsBox = {
  backgroundColor: '#fffbeb',
  padding: '24px',
  borderRadius: '8px',
  borderLeft: '4px solid #f59e0b',
  margin: '32px 0',
}

const nextStepsTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const nextStepItem = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  wordWrap: 'break-word' as const,
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
  wordWrap: 'break-word' as const,
}

const supportSection = {
  margin: '16px 0 24px 0',
}

const supportLink = {
  color: '#3b82f6',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
}

const brandText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '0',
}

const brandLink = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: '600',
}