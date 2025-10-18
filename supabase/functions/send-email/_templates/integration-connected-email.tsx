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

interface IntegrationConnectedEmailProps {
  integrationName: string
  integrationIcon?: string
  userEmail: string
  features: string[]
  dashboardUrl?: string
  connectedAt: string
}

export const IntegrationConnectedEmail = ({
  integrationName,
  integrationIcon = '🔗',
  userEmail,
  features,
  dashboardUrl = 'https://app.saleswhisperer.net/dashboard',
  connectedAt
}: IntegrationConnectedEmailProps) => {
  const connectionDate = new Date(connectedAt)
  
  return (
    <Html>
      <Head />
      <Preview>✅ {integrationName} integration successfully connected</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={successIcon}>✅</Text>
            <Heading style={h1}>Integration Connected!</Heading>
            <Text style={tagline}>{integrationName} is now syncing with Sales Whisperer</Text>
          </Section>

          <Section style={content}>
            <Section style={summaryBox}>
              <Text style={integrationIcon}>{integrationIcon}</Text>
              <Heading style={integrationTitle}>{integrationName}</Heading>
              <Text style={summaryItem}><strong>Connected:</strong> {connectionDate.toLocaleString()}</Text>
              <Text style={summaryItem}><strong>Account:</strong> {userEmail}</Text>
              <Text style={successText}>Your {integrationName} integration is active and ready to use!</Text>
            </Section>

            <Section style={featuresBox}>
              <Heading style={featuresTitle}>🚀 What's Now Available:</Heading>
              {features.map((feature, index) => (
                <Text key={index} style={featureItem}>• {feature}</Text>
              ))}
            </Section>

            <Section style={ctaSection}>
              <Button pX={32} pY={16} style={button} href={dashboardUrl}>
                📊 Go to Dashboard
              </Button>
            </Section>

            <Section style={tipsBox}>
              <Heading style={tipsTitle}>💡 Pro Tips:</Heading>
              <Text style={tipItem}>• Upload your first transcript to see AI-powered insights</Text>
              <Text style={tipItem}>• Check integration status in your dashboard settings</Text>
              <Text style={tipItem}>• Enable email notifications for sync updates</Text>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                Need help with your {integrationName} integration? Reply to this email or contact our support team.
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

export default IntegrationConnectedEmail

const main = {
  backgroundColor: '#f0fdf4',
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
  backgroundColor: '#dcfce7',
  borderRadius: '12px',
  border: '2px solid #16a34a',
}

const successIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
}

const h1 = {
  color: '#15803d',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
}

const tagline = {
  color: '#166534',
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

const summaryBox = {
  backgroundColor: '#f8fafc',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  border: '1px solid #e2e8f0',
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

const successText = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: '500',
  margin: '16px 0 0 0',
  wordWrap: 'break-word' as const,
}

const featuresBox = {
  backgroundColor: '#f0f9ff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #3b82f6',
}

const featuresTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const featureItem = {
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
  backgroundColor: '#16a34a',
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

const tipsBox = {
  backgroundColor: '#fffbeb',
  padding: '24px',
  borderRadius: '8px',
  borderLeft: '4px solid #f59e0b',
  margin: '32px 0',
}

const tipsTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const tipItem = {
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