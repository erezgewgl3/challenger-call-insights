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

interface IntegrationErrorEmailProps {
  integrationName: string
  integrationIcon?: string
  userEmail: string
  errorType: 'sync' | 'webhook' | 'auth' | 'processing'
  errorMessage: string
  errorDetails?: string
  dashboardUrl?: string
  occurredAt: string
}

export const IntegrationErrorEmail = ({
  integrationName,
  integrationIcon = '⚠️',
  userEmail,
  errorType,
  errorMessage,
  errorDetails,
  dashboardUrl = 'https://app.saleswhisperer.net/dashboard',
  occurredAt
}: IntegrationErrorEmailProps) => {
  const errorDate = new Date(occurredAt)
  
  const getErrorTypeInfo = (type: string) => {
    switch (type) {
      case 'sync':
        return { icon: '🔄', title: 'Sync Error', severity: 'warning' }
      case 'webhook':
        return { icon: '📡', title: 'Webhook Error', severity: 'error' }
      case 'auth':
        return { icon: '🔐', title: 'Authentication Error', severity: 'critical' }
      case 'processing':
        return { icon: '⚙️', title: 'Processing Error', severity: 'warning' }
      default:
        return { icon: '⚠️', title: 'Integration Error', severity: 'warning' }
    }
  }
  
  const errorInfo = getErrorTypeInfo(errorType)
  
  return (
    <Html>
      <Head />
      <Preview>⚠️ {integrationName} integration error - {errorInfo.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={warningIcon}>⚠️</Text>
            <Heading style={h1}>Integration Error Detected</Heading>
            <Text style={tagline}>{integrationName} - {errorInfo.title}</Text>
          </Section>

          <Section style={content}>
            <Section style={errorBox}>
              <Text style={typeIcon}>{errorInfo.icon}</Text>
              <Heading style={errorTitle}>{errorInfo.title}</Heading>
              <Text style={integrationName}>{integrationName}</Text>
              <Text style={summaryItem}><strong>Error Time:</strong> {errorDate.toLocaleString()}</Text>
              <Text style={summaryItem}><strong>Account:</strong> {userEmail}</Text>
              <Text style={summaryItem}><strong>Severity:</strong> <span style={getSeverityStyle(errorInfo.severity)}>{errorInfo.severity.toUpperCase()}</span></Text>
            </Section>

            <Section style={messageBox}>
              <Heading style={messageTitle}>Error Details:</Heading>
              <Text style={errorMessage}>{errorMessage}</Text>
              {errorDetails && (
                <Section style={detailsBox}>
                  <Text style={detailsTitle}>Technical Details:</Text>
                  <Text style={technicalDetails}>{errorDetails}</Text>
                </Section>
              )}
            </Section>

            <Section style={impactBox}>
              <Heading style={impactTitle}>📊 Potential Impact:</Heading>
              {errorType === 'sync' && (
                <>
                  <Text style={impactItem}>• Data synchronization may be delayed</Text>
                  <Text style={impactItem}>• Some recent changes might not be reflected</Text>
                  <Text style={impactItem}>• Automatic syncing has been paused</Text>
                </>
              )}
              {errorType === 'webhook' && (
                <>
                  <Text style={impactItem}>• Real-time updates may be interrupted</Text>
                  <Text style={impactItem}>• Event notifications could be delayed</Text>
                  <Text style={impactItem}>• Webhook processing has been affected</Text>
                </>
              )}
              {errorType === 'auth' && (
                <>
                  <Text style={impactItem}>• Integration access has been revoked</Text>
                  <Text style={impactItem}>• All sync operations have stopped</Text>
                  <Text style={impactItem}>• Re-authentication is required</Text>
                </>
              )}
              {errorType === 'processing' && (
                <>
                  <Text style={impactItem}>• Data processing may be incomplete</Text>
                  <Text style={impactItem}>• Some operations might need to be retried</Text>
                  <Text style={impactItem}>• Processing queue may be backed up</Text>
                </>
              )}
            </Section>

            <Section style={actionsBox}>
              <Heading style={actionsTitle}>🔧 Recommended Actions:</Heading>
              {errorType === 'auth' ? (
                <>
                  <Text style={actionItem}>1. Go to your dashboard and reconnect {integrationName}</Text>
                  <Text style={actionItem}>2. Verify your account permissions</Text>
                  <Text style={actionItem}>3. Check if your credentials have changed</Text>
                </>
              ) : (
                <>
                  <Text style={actionItem}>1. Check the integration status in your dashboard</Text>
                  <Text style={actionItem}>2. Review recent activity logs</Text>
                  <Text style={actionItem}>3. Try manually triggering a sync if available</Text>
                  <Text style={actionItem}>4. Contact support if the issue persists</Text>
                </>
              )}
            </Section>

            <Section style={ctaSection}>
              <Button pX={32} pY={16} style={button} href={dashboardUrl}>
                🔍 Check Integration Status
              </Button>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                Our system will automatically attempt to resolve temporary issues. 
                If this error persists, please contact our support team.
              </Text>
              
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

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'critical':
      return { color: '#dc2626', fontWeight: '700' }
    case 'error':
      return { color: '#ea580c', fontWeight: '600' }
    case 'warning':
      return { color: '#d97706', fontWeight: '500' }
    default:
      return { color: '#64748b', fontWeight: '400' }
  }
}

export default IntegrationErrorEmail

const main = {
  backgroundColor: '#fffbeb',
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
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  border: '2px solid #f59e0b',
}

const warningIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
}

const h1 = {
  color: '#92400e',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
}

const tagline = {
  color: '#78350f',
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
  backgroundColor: '#fef3c7',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #f59e0b',
  textAlign: 'center' as const,
}

const typeIcon = {
  fontSize: '32px',
  margin: '0 0 8px 0',
}

const errorTitle = {
  color: '#92400e',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const integrationName = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px 0',
}

const summaryItem = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 6px 0',
  wordWrap: 'break-word' as const,
}

const messageBox = {
  backgroundColor: '#fff5f5',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #ef4444',
}

const messageTitle = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const errorMessage = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
  wordWrap: 'break-word' as const,
}

const detailsBox = {
  backgroundColor: '#fef2f2',
  padding: '16px',
  borderRadius: '4px',
  border: '1px solid #fecaca',
}

const detailsTitle = {
  color: '#991b1b',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
}

const technicalDetails = {
  color: '#7f1d1d',
  fontSize: '12px',
  fontFamily: 'monospace',
  lineHeight: '1.4',
  margin: '0',
  wordBreak: 'break-word' as const,
}

const impactBox = {
  backgroundColor: '#f0f9ff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #3b82f6',
}

const impactTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const impactItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  wordWrap: 'break-word' as const,
}

const actionsBox = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #16a34a',
}

const actionsTitle = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const actionItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  wordWrap: 'break-word' as const,
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  border: 'none',
  cursor: 'pointer',
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
  margin: '0 0 24px 0',
  wordWrap: 'break-word' as const,
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