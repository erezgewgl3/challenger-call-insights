export interface IntegrationErrorData {
  integration_name: string
  integration_icon?: string
  user_email: string
  error_type: string
  error_message: string
  sync_id?: string
  dashboard_url?: string
  occurred_at: string
}

export const integrationErrorTemplate = (data: IntegrationErrorData) => ({
  subject: `⚠️ ${data.integration_name} Integration Error - ${data.error_type}`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #fefce8, #fef3c7); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px; border: 2px solid #f59e0b;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h1 style="color: #d97706; font-size: 28px; margin: 0 0 8px 0;">Integration Error</h1>
        <p style="color: #92400e; font-size: 16px; margin: 0;">Your ${data.integration_name} integration encountered an error</p>
      </div>
      
      <div style="background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background: #fefce8; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px; border: 1px solid #fde047;">
          <div style="font-size: 32px; margin-bottom: 8px;">${data.integration_icon || '⚠️'}</div>
          <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">${data.integration_name}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 6px 0;"><strong>Error Type:</strong> ${data.error_type}</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 6px 0;"><strong>Occurred:</strong> ${new Date(data.occurred_at).toLocaleString()}</p>
          ${data.sync_id ? `<p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;"><strong>Sync ID:</strong> ${data.sync_id}</p>` : ''}
          <p style="color: #d97706; font-size: 16px; font-weight: 500; margin: 0;">Processing error detected</p>
        </div>
        
        <div style="background: #fefce8; padding: 24px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <h3 style="color: #d97706; font-size: 16px; margin: 0 0 16px 0;">⚠️ Error Details:</h3>
          <p style="color: #374151; font-size: 14px; margin: 0; background: #ffffff; padding: 12px; border-radius: 4px; font-family: monospace;">${data.error_message}</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 24px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 32px;">
          <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 16px 0;">🔧 What We're Doing:</h3>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• Our system automatically retries failed operations</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• We're monitoring your integration health continuously</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• If needed, we'll notify you of any required actions</p>
          <p style="color: #374151; font-size: 14px; margin: 0;">• You can check real-time status in your dashboard</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.dashboard_url || 'https://app.saleswhisperer.net/dashboard'}" style="background: #3b82f6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">📊 Check Status</a>
        </div>
        
        <div style="background: #ecfdf5; padding: 24px; border-radius: 8px; border-left: 4px solid #10b981;">
          <h3 style="color: #047857; font-size: 16px; margin: 0 0 16px 0;">✅ Next Steps:</h3>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• Most errors resolve automatically within a few minutes</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• If the error persists, try reconnecting your integration</p>
          <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">• Check ${data.integration_name} service status if issues continue</p>
          <p style="color: #374151; font-size: 14px; margin: 0;">• Contact support if you need immediate assistance</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">This is an automated notification. Most errors resolve automatically, but we wanted to keep you informed.</p>
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          <a href="https://saleswhisperer.net" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Sales Whisperer</a><br>
          Elevate your sales performance with AI
        </p>
      </div>
    </div>
  `,
  text: `Integration Error

Your ${data.integration_name} integration encountered an error

Error Type: ${data.error_type}
Occurred: ${new Date(data.occurred_at).toLocaleString()}
${data.sync_id ? `Sync ID: ${data.sync_id}` : ''}

Error Details:
${data.error_message}

What We're Doing:
• Our system automatically retries failed operations
• We're monitoring your integration health continuously
• If needed, we'll notify you of any required actions
• You can check real-time status in your dashboard

Next Steps:
• Most errors resolve automatically within a few minutes
• If the error persists, try reconnecting your integration
• Check ${data.integration_name} service status if issues continue
• Contact support if you need immediate assistance

Check Status: ${data.dashboard_url || 'https://app.saleswhisperer.net/dashboard'}

This is an automated notification. Most errors resolve automatically, but we wanted to keep you informed.

Sales Whisperer - Elevate your sales performance with AI
https://saleswhisperer.net`
})