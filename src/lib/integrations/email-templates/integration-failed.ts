export interface IntegrationFailedData {
  integration_name: string
  integration_icon?: string
  user_email: string
  error_message: string
  support_url?: string
  retry_url?: string
  failed_at: string
}

export const integrationFailedTemplate = (data: IntegrationFailedData) => ({
  subject: `❌ ${data.integration_name} Integration Connection Failed`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px; border: 2px solid #f87171;">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <h1 style="color: #dc2626; font-size: 28px; margin: 0 0 8px 0;">Connection Failed</h1>
        <p style="color: #991b1b; font-size: 16px; margin: 0;">We couldn't connect your ${data.integration_name} integration</p>
      </div>
      
      <div style="background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background: #fef2f2; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px; border: 1px solid #fecaca;">
          <div style="font-size: 32px; margin-bottom: 8px;">${data.integration_icon || '⚠️'}</div>
          <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">${data.integration_name}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 6px 0;"><strong>Failed:</strong> ${new Date(data.failed_at).toLocaleString()}</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;"><strong>Account:</strong> ${data.user_email}</p>
          <p style="color: #dc2626; font-size: 16px; font-weight: 500; margin: 0;">Connection attempt failed</p>
        </div>
        
        <div style="background: #fef2f2; padding: 24px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <h3 style="color: #dc2626; font-size: 16px; margin: 0 0 16px 0;">❌ Error Details:</h3>
          <p style="color: #374151; font-size: 14px; margin: 0; background: #ffffff; padding: 12px; border-radius: 4px; font-family: monospace;">${data.error_message}</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 24px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 32px;">
          <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 16px 0;">🔧 Quick Fixes:</h3>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• Check your ${data.integration_name} account credentials</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• Verify API permissions and access tokens</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• Ensure your ${data.integration_name} plan supports integrations</p>
          <p style="color: #374151; font-size: 14px; margin: 0;">• Try disconnecting and reconnecting the integration</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          ${data.retry_url ? `<a href="${data.retry_url}" style="background: #3b82f6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-right: 16px;">🔄 Try Again</a>` : ''}
          <a href="${data.support_url || 'https://app.saleswhisperer.net/support'}" style="background: #64748b; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">💬 Get Help</a>
        </div>
        
        <div style="background: #fffbeb; padding: 24px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; font-size: 16px; margin: 0 0 16px 0;">💡 Troubleshooting Tips:</h3>
          <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Most connection issues are due to expired tokens or changed passwords</p>
          <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Check if ${data.integration_name} is experiencing service disruptions</p>
          <p style="color: #92400e; font-size: 14px; margin: 0;">• Contact our support team if the issue persists</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Having trouble? Our support team is here to help. Reply to this email for assistance.</p>
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          <a href="https://saleswhisperer.net" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Sales Whisperer</a><br>
          Elevate your sales performance with AI
        </p>
      </div>
    </div>
  `,
  text: `Connection Failed

We couldn't connect your ${data.integration_name} integration

Failed: ${new Date(data.failed_at).toLocaleString()}
Account: ${data.user_email}

Error Details:
${data.error_message}

Quick Fixes:
• Check your ${data.integration_name} account credentials
• Verify API permissions and access tokens
• Ensure your ${data.integration_name} plan supports integrations
• Try disconnecting and reconnecting the integration

Troubleshooting Tips:
• Most connection issues are due to expired tokens or changed passwords
• Check if ${data.integration_name} is experiencing service disruptions
• Contact our support team if the issue persists

${data.retry_url ? `Try Again: ${data.retry_url}` : ''}
Get Help: ${data.support_url || 'https://app.saleswhisperer.net/support'}

Having trouble? Our support team is here to help.

Sales Whisperer - Elevate your sales performance with AI
https://saleswhisperer.net`
})