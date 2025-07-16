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

interface IntegrationTipsEmailProps {
  userEmail: string
  integrationName?: string
  integrationIcon?: string
  tips: Array<{
    title: string
    description: string
    action?: string
    actionUrl?: string
  }>
  dashboardUrl?: string
  helpUrl?: string
}

export const IntegrationTipsEmail = ({
  userEmail,
  integrationName = 'your integrations',
  integrationIcon = '🔗',
  tips,
  dashboardUrl = 'https://app.saleswhisperer.net/dashboard',
  helpUrl = 'https://saleswhisperer.net/help'
}: IntegrationTipsEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>💡 Tips to maximize your {integrationName} integration</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={tipsIcon}>💡</Text>
            <Heading style={h1}>Integration Pro Tips</Heading>
            <Text style={tagline}>Get the most out of {integrationName}</Text>
          </Section>

          <Section style={content}>
            <Section style={introBox}>
              <Text style={integrationIcon}>{integrationIcon}</Text>
              <Text style={greeting}>Hi there!</Text>
              <Text style={introText}>
                We noticed you're using {integrationName} with Sales Whisperer. 
                Here are some expert tips to help you maximize your results and streamline your sales process.
              </Text>
            </Section>

            {tips.map((tip, index) => (
              <Section key={index} style={tipBox}>
                <Text style={tipNumber}>#{index + 1}</Text>
                <Heading style={tipTitle}>{tip.title}</Heading>
                <Text style={tipDescription}>{tip.description}</Text>
                {tip.action && tip.actionUrl && (
                  <Section style={tipActionSection}>
                    <Link href={tip.actionUrl} style={tipActionLink}>
                      {tip.action} →
                    </Link>
                  </Section>
                )}
              </Section>
            ))}

            <Section style={bonusBox}>
              <Heading style={bonusTitle}>🎯 Bonus Tips:</Heading>
              <Text style={bonusItem}>• Set up email notifications for sync status updates</Text>
              <Text style={bonusItem}>• Review integration logs weekly to catch issues early</Text>
              <Text style={bonusItem}>• Use tags and folders to organize your synced data</Text>
              <Text style={bonusItem}>• Enable automatic transcript analysis for better insights</Text>
            </Section>

            <Section style={ctaSection}>
              <Button pX={32} pY={16} style={dashboardButton} href={dashboardUrl}>
                📊 Go to Dashboard
              </Button>
              <Button pX={32} pY={16} style={helpButton} href={helpUrl}>
                📖 View Help Center
              </Button>
            </Section>

            <Section style={statsBox}>
              <Heading style={statsTitle}>📈 Did You Know?</Heading>
              <Text style={statItem}>Users with active integrations see 40% more actionable insights</Text>
              <Text style={statItem}>Automated sync saves 2+ hours per week on average</Text>
              <Text style={statItem}>Integration users close 25% more deals per quarter</Text>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                Have questions about your integrations? We're here to help! 
                Reply to this email or check out our help center.
              </Text>
              
              <Text style={unsubscribeText}>
                You're receiving this because you have active integrations. 
                <Link href="#" style={unsubscribeLink}>Update email preferences</Link>
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

export default IntegrationTipsEmail

const main = {
  backgroundColor: '#f8fafc',
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
  backgroundColor: '#fff7ed',
  borderRadius: '12px',
  border: '2px solid #f97316',
}

const tipsIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
}

const h1 = {
  color: '#ea580c',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
}

const tagline = {
  color: '#9a3412',
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

const introBox = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const integrationIcon = {
  fontSize: '32px',
  margin: '0 0 16px 0',
}

const greeting = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
}

const introText = {
  color: '#64748b',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const tipBox = {
  backgroundColor: '#f0f9ff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
  borderLeft: '4px solid #3b82f6',
}

const tipNumber = {
  color: '#1e40af',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
}

const tipTitle = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  lineHeight: '1.3',
}

const tipDescription = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const tipActionSection = {
  textAlign: 'right' as const,
}

const tipActionLink = {
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
}

const bonusBox = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '32px',
  borderLeft: '4px solid #16a34a',
}

const bonusTitle = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const bonusItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap' as const,
  justifyContent: 'center',
}

const dashboardButton = {
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

const helpButton = {
  backgroundColor: '#64748b',
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

const statsBox = {
  backgroundColor: '#fefce8',
  padding: '24px',
  borderRadius: '8px',
  borderLeft: '4px solid #eab308',
  margin: '32px 0',
}

const statsTitle = {
  color: '#a16207',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const statItem = {
  color: '#713f12',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
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
}

const unsubscribeText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '0 0 24px 0',
}

const unsubscribeLink = {
  color: '#64748b',
  textDecoration: 'underline',
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