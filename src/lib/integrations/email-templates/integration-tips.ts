export interface IntegrationTipsData {
  integration_name: string
  integration_icon?: string
  user_email: string
  user_name?: string
  tips_category: 'setup' | 'optimization' | 'troubleshooting' | 'best_practices'
  dashboard_url?: string
  support_url?: string
}

export const integrationTipsTemplate = (data: IntegrationTipsData) => {
  const getTipsContent = () => {
    switch (data.tips_category) {
      case 'setup':
        return {
          title: '🚀 Setup Your Integration',
          tips: [
            'Complete the initial sync to import your existing data',
            'Configure webhook notifications for real-time updates',
            'Set up field mappings to match your workflow',
            'Test the integration with a sample transcript'
          ],
          action: 'Complete Setup'
        }
      case 'optimization':
        return {
          title: '⚡ Optimize Your Integration',
          tips: [
            'Enable automatic sync for seamless data flow',
            'Configure custom fields to capture specific data points',
            'Set up automation rules to streamline your workflow',
            'Use bulk operations for processing multiple items'
          ],
          action: 'Optimize Now'
        }
      case 'troubleshooting':
        return {
          title: '🔧 Troubleshooting Guide',
          tips: [
            'Check your API rate limits and usage quotas',
            'Verify webhook endpoints are receiving data',
            'Review sync logs for any error patterns',
            'Ensure your authentication tokens are current'
          ],
          action: 'Check Status'
        }
      case 'best_practices':
        return {
          title: '🎯 Best Practices',
          tips: [
            'Regularly review sync performance and error rates',
            'Keep your integration credentials secure and updated',
            'Monitor data quality and consistency across platforms',
            'Use integration insights to improve your sales process'
          ],
          action: 'View Analytics'
        }
    }
  }

  const content = getTipsContent()

  return {
    subject: `💡 ${content.title} - ${data.integration_name} Tips`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f0f9ff, #e0e7ff); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 48px; margin-bottom: 16px;">💡</div>
          <h1 style="color: #3730a3; font-size: 28px; margin: 0 0 8px 0;">${content.title}</h1>
          <p style="color: #4338ca; font-size: 16px; margin: 0;">Get the most out of your ${data.integration_name} integration</p>
        </div>
        
        <div style="background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
            <div style="font-size: 32px; margin-bottom: 8px;">${data.integration_icon || '🔗'}</div>
            <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 8px 0;">${data.integration_name}</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Hey ${data.user_name || 'there'}! Here are some tips to help you succeed.</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 24px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 32px;">
            <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 20px 0;">${content.title}</h3>
            ${content.tips.map((tip, index) => `
              <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">${index + 1}</div>
                <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">${tip}</p>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.dashboard_url || 'https://app.saleswhisperer.net/dashboard'}" style="background: #3b82f6; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">📊 ${content.action}</a>
          </div>
          
          <div style="background: #fffbeb; padding: 24px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; font-size: 16px; margin: 0 0 16px 0;">🤝 Need Help?</h3>
            <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Check our comprehensive documentation and guides</p>
            <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Join our community forum for tips and discussions</p>
            <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">• Contact our support team for personalized assistance</p>
            <p style="color: #92400e; font-size: 14px; margin: 0;">• Schedule a one-on-one demo to learn best practices</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 24px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 24px;">
            <h3 style="color: #047857; font-size: 16px; margin: 0 0 16px 0;">🎉 Success Stories</h3>
            <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">Companies using ${data.integration_name} with Sales Whisperer report:</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 6px 0;">• 40% faster deal closure rates</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 6px 0;">• 60% improvement in lead qualification</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 6px 0;">• 75% reduction in manual data entry</p>
            <p style="color: #374151; font-size: 14px; margin: 0;">• 90% increase in sales team productivity</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">Want to share your success story or need personalized guidance?</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
            <a href="${data.support_url || 'https://app.saleswhisperer.net/support'}" style="color: #3b82f6; text-decoration: none;">Contact our team</a> - we'd love to help!
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            <a href="https://saleswhisperer.net" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Sales Whisperer</a><br>
            Elevate your sales performance with AI
          </p>
        </div>
      </div>
    `,
    text: `${content.title}

Get the most out of your ${data.integration_name} integration

Hey ${data.user_name || 'there'}! Here are some tips to help you succeed.

${content.title}:
${content.tips.map((tip, index) => `${index + 1}. ${tip}`).join('\n')}

${content.action}: ${data.dashboard_url || 'https://app.saleswhisperer.net/dashboard'}

Need Help?
• Check our comprehensive documentation and guides
• Join our community forum for tips and discussions
• Contact our support team for personalized assistance
• Schedule a one-on-one demo to learn best practices

Success Stories:
Companies using ${data.integration_name} with Sales Whisperer report:
• 40% faster deal closure rates
• 60% improvement in lead qualification
• 75% reduction in manual data entry
• 90% increase in sales team productivity

Want to share your success story or need personalized guidance?
Contact our team: ${data.support_url || 'https://app.saleswhisperer.net/support'}

Sales Whisperer - Elevate your sales performance with AI
https://saleswhisperer.net`
  }
}