import React from 'react';

interface RegistrationSuccessEmailProps {
  fixedCount: number;
  fixedUsers: Array<{
    email: string;
    id: string;
  }>;
  timestamp: string;
}

export const RegistrationSuccessEmail: React.FC<RegistrationSuccessEmailProps> = ({
  fixedCount,
  fixedUsers,
  timestamp
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ backgroundColor: '#10B981', color: 'white', padding: '20px', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>✅ SUCCESS: Registration Issues Resolved</h1>
      </div>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e5e5' }}>
        <div style={{ backgroundColor: '#EFF6FF', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #BFDBFE' }}>
          <h2 style={{ color: '#1E40AF', margin: '0 0 10px 0', fontSize: '18px' }}>
            🎉 Auto-Repair Successful
          </h2>
          <p style={{ margin: 0, color: '#1E40AF', fontSize: '16px' }}>
            The system has automatically resolved <strong>{fixedCount}</strong> orphaned user registration(s).
          </p>
        </div>

        <h3 style={{ color: '#374151', fontSize: '16px', marginBottom: '15px' }}>
          📊 Repair Summary
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tr style={{ backgroundColor: '#F3F4F6' }}>
            <td style={{ padding: '12px', border: '1px solid #E5E7EB', fontWeight: 'bold' }}>
              Fixed Users Count
            </td>
            <td style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#10B981', fontWeight: 'bold' }}>
              {fixedCount}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #E5E7EB', fontWeight: 'bold' }}>
              Repair Timestamp
            </td>
            <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>
              {new Date(timestamp).toLocaleString()}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#F3F4F6' }}>
            <td style={{ padding: '12px', border: '1px solid #E5E7EB', fontWeight: 'bold' }}>
              Repair Method
            </td>
            <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>
              Automatic - Orphaned user repair
            </td>
          </tr>
        </table>

        {fixedUsers.length > 0 && (
          <>
            <h3 style={{ color: '#374151', fontSize: '16px', marginBottom: '15px' }}>
              👥 Fixed User Accounts
            </h3>
            
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '15px' }}>
              {fixedUsers.map((user, index) => (
                <div key={user.id} style={{ 
                  padding: '10px', 
                  borderBottom: index < fixedUsers.length - 1 ? '1px solid #F3F4F6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: '#374151' }}>{user.email}</strong>
                    <div style={{ color: '#6B7280', fontSize: '14px' }}>
                      ID: {user.id}
                    </div>
                  </div>
                  <div style={{ 
                    backgroundColor: '#10B981', 
                    color: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    FIXED
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ backgroundColor: '#F0F9FF', padding: '15px', borderRadius: '8px', marginTop: '20px', border: '1px solid #BAE6FD' }}>
          <p style={{ margin: 0, color: '#0C4A6E', fontSize: '14px' }}>
            <strong>💡 What happened:</strong> The system detected users who existed in the authentication system but were missing from the users table. These accounts have been automatically repaired and the related registration failure alerts have been marked as resolved.
          </p>
        </div>

        <div style={{ backgroundColor: '#FEF3C7', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #FCD34D' }}>
          <p style={{ margin: 0, color: '#92400E', fontSize: '14px' }}>
            <strong>📋 Next Steps:</strong> No action required. The system will continue monitoring for registration issues and will automatically repair orphaned users when detected.
          </p>
        </div>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
        
        <div style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>
          <p style={{ margin: '5px 0' }}>Sales Whisperer Registration Monitoring System</p>
          <p style={{ margin: '5px 0' }}>This is an automated notification from the system health monitoring service.</p>
          <p style={{ margin: '5px 0' }}>Generated at: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};