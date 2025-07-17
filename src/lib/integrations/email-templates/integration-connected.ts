export interface IntegrationConnectedData {
  integration_name: string
  integration_icon?: string
  user_email: string
  features: string[]
  dashboard_url?: string
  connected_at: string
}

export const integrationConnectedTemplate = (data: IntegrationConnectedData) => ({
  subject: `✅ ${data.integration_name} Integration Connected`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dcfce7, #f0fdf4); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h1 style="color: #15803d; font-size: 28px; margin: 0 0 8px 0;">Integration Connected!</h1>
        <p style="color: #166534; font-size: 16px; margin: 0;">${data.integration_name} is now syncing with Sales Whisperer</p>
      </div>
      
      <div style="background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 32px; margin-bottom: 8px;">${data.integration_icon || '🔗'}</div>
          <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">${data.integration_name}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 6px 0;"><strong>Connected:</strong> ${new Date(data.connected_at).toLocaleString()}</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;"><strong>Account:</strong> ${data.user_email}</p>
          <p style="color: #16a34a; font-size: 16px; font-weight: 500; margin: 0;">Your ${data.integration_name} integration is active and ready to use!</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 24px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 32px;">
          <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 16px 0;">🚀 What's Now Available:</h3>
          ${data.features.map(feature => `<p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• ${feature}</p>`).join('')}
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.dashboard_url || 'https://app.saleswhisperer.net/dashboard'}" style="background: #16a34a; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">📊 Go to Dashboard</a>
        </div>
        
        <div style="background: #fffbeb; padding: 24px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; font-size: 16px; margin: 0 0 16px 0;">💡 Pro Tips:</h3>
          <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Upload your first transcript to see AI-powered insights</p>
          <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Check integration status in your dashboard settings</p>
          <p style="color: #92400e; font-size: 14px; margin: 0;">• Enable email notifications for sync updates</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Need help with your ${data.integration_name} integration? Reply to this email or contact our support team.</p>
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          <a href="https://saleswhisperer.net" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Sales Whisperer</a><br>
          Elevate your sales performance with AI
        </p>
      </div>
    </div>
  `,
  text: `Integration Connected!

${data.integration_name} is now syncing with Sales Whisperer

Connected: ${new Date(data.connected_at).toLocaleString()}
Account: ${data.user_email}

What's Now Available:
${data.features.map(feature => `• ${feature}`).join('\n')}

Go to Dashboard: ${data.dashboard_url || 'https://app.saleswhisperer.net/dashboard'}

Pro Tips:
• Upload your first transcript to see AI-powered insights
• Check integration status in your dashboard settings
• Enable email notifications for sync updates

Need help? Reply to this email or contact our support team.

Sales Whisperer - Elevate your sales performance with AI
https://saleswhisperer.net`
})