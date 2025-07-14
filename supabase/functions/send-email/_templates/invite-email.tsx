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

interface InviteEmailProps {
  email: string
  inviteLink: string
  expiresAt: string
  invitedBy?: string
}

export const InviteEmail = ({
  email,
  inviteLink,
  expiresAt,
  invitedBy = 'Sales Whisperer Team'
}: InviteEmailProps) => {
  const expiryDate = new Date(expiresAt)
  
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join Sales Whisperer</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Sales Whisperer</Heading>
            <Text style={tagline}>AI-Powered Sales Coaching Platform</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>You're Invited!</Heading>
            
            <Text style={text}>
              Hi there,
            </Text>
            
            <Text style={text}>
              You've been invited by <strong>{invitedBy}</strong> to join Sales Whisperer, 
              the AI-powered platform that transforms your sales conversations into actionable insights.
            </Text>

            <Section style={features}>
              <Text style={featuresTitle}>What you'll get access to:</Text>
              <Text style={feature}>🎯 AI-powered conversation analysis using Challenger Sales methodology</Text>
              <Text style={feature}>📈 Personalized coaching recommendations</Text>
              <Text style={feature}>📧 Smart email follow-up suggestions</Text>
              <Text style={feature}>📊 Deal heat scoring and pipeline insights</Text>
            </Section>

            <Section style={ctaSection}>
              <Button pX={32} pY={16} style={button} href={inviteLink}>
                Accept Invitation & Get Started
              </Button>
            </Section>

            <Section style={linkSection}>
              <Text style={linkText}>
                Or copy and paste this link into your browser:
              </Text>
              <Text style={linkUrl}>{inviteLink}</Text>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                <strong>Important:</strong> This invitation expires on{' '}
                <strong>{expiryDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</strong> at{' '}
                <strong>{expiryDate.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</strong>.
              </Text>
              
              <Text style={helpText}>
                Need help? Reply to this email or contact our support team.
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

export default InviteEmail

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
  marginBottom: '40px',
  padding: '32px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
}

const h1 = {
  color: '#1e293b',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
}

const tagline = {
  color: '#64748b',
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

const h2 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px 0',
  lineHeight: '1.3',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const features = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const featuresTitle = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
}

const feature = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const button = {
  backgroundColor: '#3b82f6',
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

const linkSection = {
  margin: '32px 0',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const linkText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 8px 0',
}

const linkUrl = {
  color: '#3b82f6',
  fontSize: '14px',
  fontFamily: 'monospace',
  wordBreak: 'break-all' as const,
  margin: '0',
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

const helpText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
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