# Security Testing Guide - Phase 6

## Overview
This guide provides comprehensive security testing procedures for Sales Whisperer. All tests should be performed in a staging environment before production deployment.

---

## Test Environment Setup

### Prerequisites
- [ ] Staging Supabase project configured
- [ ] Test user accounts created (admin, sales_user)
- [ ] RESEND_API_KEY configured for alert testing
- [ ] Console and network tabs open in browser DevTools

### Test User Accounts Required
```sql
-- Create test accounts with different roles
-- Admin user: admin@test-saleswhisperer.com
-- Sales user 1: sales1@test-saleswhisperer.com
-- Sales user 2: sales2@test-saleswhisperer.com
```

---

## Phase 1: Authentication Security Testing

### Test 1.1: Password Strength Validation ✅
**Objective:** Verify password requirements are enforced

**Test Steps:**
1. Navigate to registration page
2. Attempt to register with weak passwords:
   - "password" (too short, no uppercase, no numbers, no special chars)
   - "Password" (no numbers, no special chars)
   - "Password1" (no special chars)
   - "Pass1!" (too short - less than 12 chars)

**Expected Results:**
- ❌ All weak passwords should be rejected
- ✅ Clear error messages displayed for each requirement
- ✅ "Password123!@#" should be accepted

**Verification:**
```sql
-- Test the validation function directly
SELECT public.validate_password_strength('password');
SELECT public.validate_password_strength('Password123!@#');
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 1.2: Login Rate Limiting ✅
**Objective:** Verify brute force protection

**Test Steps:**
1. Attempt to login with incorrect password 5 times
2. Note the timing and lockout message
3. Attempt 6th login immediately

**Expected Results:**
- ✅ First 5 attempts: "Invalid credentials" error
- ✅ 6th attempt: "Too many failed attempts" with lockout duration
- ✅ Account locked for 15 minutes
- ✅ Event logged in `gdpr_audit_log`

**Verification:**
```sql
-- Check rate limit records
SELECT * FROM public.auth_rate_limits 
WHERE identifier = 'sales1@test-saleswhisperer.com' 
ORDER BY attempted_at DESC 
LIMIT 10;

-- Check security events
SELECT * FROM public.gdpr_audit_log 
WHERE event_type = 'login_failure' 
AND user_id = (SELECT id FROM auth.users WHERE email = 'sales1@test-saleswhisperer.com')
ORDER BY timestamp DESC;
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 1.3: Password Reset Rate Limiting ✅
**Objective:** Verify password reset flood protection

**Test Steps:**
1. Request password reset 3 times in rapid succession
2. Attempt 4th reset request immediately

**Expected Results:**
- ✅ First 3 requests accepted
- ✅ 4th request blocked with "Too many requests" message
- ✅ Shows time remaining until next allowed request
- ✅ No password reset emails sent for blocked request

**Verification:**
```sql
-- Check rate limit for password resets
SELECT * FROM public.auth_rate_limits 
WHERE identifier = 'sales1@test-saleswhisperer.com' 
AND attempt_type = 'password_reset'
ORDER BY attempted_at DESC;
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 1.4: Invite Generation Rate Limiting ✅
**Objective:** Verify invite spam protection

**Test Steps:**
1. Login as admin
2. Create 50 invite links rapidly
3. Attempt to create 51st invite

**Expected Results:**
- ✅ First 50 invites created successfully
- ✅ 51st invite blocked with daily limit message
- ✅ Counter shows "50/50 invites used today"

**Verification:**
```sql
-- Check invite rate limit
SELECT * FROM public.auth_rate_limits 
WHERE attempt_type = 'invite_generation'
AND attempted_at > now() - interval '24 hours'
ORDER BY attempted_at DESC;
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Phase 2: Row Level Security (RLS) Testing

### Test 2.1: Users Table - Own Data Access ✅
**Objective:** Verify users can only see their own data

**Test Steps:**
1. Login as sales1@test-saleswhisperer.com
2. Query users table:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*');
```

**Expected Results:**
- ✅ Returns only the logged-in user's record
- ✅ Email address visible only for self
- ✅ No other users' data returned

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 2.2: Users Table - Admin Access ✅
**Objective:** Verify admins can see all users

**Test Steps:**
1. Login as admin@test-saleswhisperer.com
2. Query users table:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*');
```

**Expected Results:**
- ✅ Returns all user records
- ✅ All email addresses visible
- ✅ Role information accessible

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 2.3: Transcripts Table - Owner Access ✅
**Objective:** Verify transcript ownership restrictions

**Test Steps:**
1. Login as sales1@test-saleswhisperer.com
2. Create a transcript
3. Logout and login as sales2@test-saleswhisperer.com
4. Attempt to query sales1's transcript:
```javascript
const { data, error } = await supabase
  .from('transcripts')
  .select('*')
  .eq('id', '<sales1-transcript-id>');
```

**Expected Results:**
- ❌ sales2 cannot see sales1's transcript
- ✅ Returns empty array or 403 error
- ✅ No sensitive data leaked in error message

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 2.4: Transcripts Table - Assigned User Access ✅
**Objective:** Verify assigned users can access transcripts

**Test Steps:**
1. Login as admin
2. Assign sales1's transcript to sales2
3. Login as sales2
4. Query the assigned transcript

**Expected Results:**
- ✅ sales2 can now access the transcript
- ✅ All transcript data visible
- ✅ Can update processing status

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 2.5: Integration Connections - Credential Protection ✅
**Objective:** Verify API credentials are never exposed

**Test Steps:**
1. Login as sales user
2. Create an integration connection with credentials
3. Query integration_connections table directly
4. Check the safe view:
```javascript
const { data: unsafe } = await supabase
  .from('integration_connections')
  .select('*');

const { data: safe } = await supabase
  .from('integration_connections_safe')
  .select('*');
```

**Expected Results:**
- ✅ `credentials` field should be null or undefined in both queries
- ✅ `vault_secret_id` should be returned
- ✅ No plaintext credentials exposed

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 2.6: Zapier API Keys - Hash Protection ✅
**Objective:** Verify API key hashes are not exposed

**Test Steps:**
1. Login as sales user
2. Generate Zapier API key
3. Query zapier_api_keys table:
```javascript
const { data } = await supabase
  .from('zapier_api_keys')
  .select('*');
```

**Expected Results:**
- ✅ Only `key_hash` returned (not plaintext key)
- ✅ User can only see their own keys
- ✅ Cannot access other users' keys

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Phase 3: Edge Function Security Testing

### Test 3.1: Archive Transcript - Authentication ✅
**Objective:** Verify JWT authentication is required

**Test Steps:**
1. Make request without authentication token:
```javascript
fetch('https://jtunkyfoadoowpymibjr.supabase.co/functions/v1/archive-transcript', {
  method: 'POST',
  body: JSON.stringify({ transcriptId: 'test-id' })
});
```

**Expected Results:**
- ❌ Request rejected with 401 Unauthorized
- ✅ No transcript modified
- ✅ Error message doesn't leak sensitive info

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 3.2: Archive Transcript - Ownership Verification ✅
**Objective:** Verify users can only archive their own transcripts

**Test Steps:**
1. Login as sales1
2. Get sales2's transcript ID
3. Attempt to archive sales2's transcript

**Expected Results:**
- ❌ Request rejected with 403 Forbidden
- ✅ Transcript not archived
- ✅ Security event logged

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 3.3: Zapier Webhooks - SSRF Protection ✅
**Objective:** Verify internal network access is blocked

**Test Steps:**
1. Login as authenticated user
2. Attempt to create webhooks with dangerous URLs:
   - `http://localhost:3000/callback`
   - `http://192.168.1.1/callback`
   - `http://10.0.0.1/callback`
   - `http://internal.local/callback`

**Expected Results:**
- ❌ All internal URLs rejected
- ✅ Clear error message about SSRF protection
- ✅ Only HTTPS external URLs accepted

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 3.4: Zapier Data - Rate Limiting ✅
**Objective:** Verify API key rate limiting

**Test Steps:**
1. Generate Zapier API key
2. Make 1001 requests in rapid succession using the API key
3. Check rate limit enforcement

**Expected Results:**
- ✅ First 1000 requests succeed
- ❌ Request 1001 rejected with 429 Too Many Requests
- ✅ Rate limit reset after 1 hour

**Verification:**
```sql
SELECT * FROM public.zapier_api_keys 
WHERE key_hash = '<hashed-key>'
AND last_used_at > now() - interval '1 hour';
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Phase 4: File Upload Security Testing

### Test 4.1: File Size Validation ✅
**Objective:** Verify file size limits are enforced

**Test Steps:**
1. Attempt to upload file larger than 10MB
2. Check rejection and error message

**Expected Results:**
- ❌ Upload rejected immediately
- ✅ "File size exceeds 10MB limit" error shown
- ✅ Event logged in security log

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 4.2: File Type Validation ✅
**Objective:** Verify only allowed file types accepted

**Test Steps:**
1. Attempt to upload files with various extensions:
   - .exe (should fail)
   - .bat (should fail)
   - .js (should fail)
   - .html (should fail)
   - .txt (should pass)
   - .docx (should pass)
   - .vtt (should pass)

**Expected Results:**
- ❌ Dangerous file types rejected
- ✅ Safe file types accepted
- ✅ Security events logged for blocked files

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 4.3: Filename Validation ✅
**Objective:** Verify path traversal protection

**Test Steps:**
1. Attempt to upload files with malicious names:
   - `../../etc/passwd.txt`
   - `<script>alert('xss')</script>.txt`
   - `autorun.inf`
   - `desktop.ini`

**Expected Results:**
- ❌ All malicious filenames rejected
- ✅ "Invalid filename" error shown
- ✅ Security event logged

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Phase 5: Security Monitoring Testing

### Test 5.1: Security Dashboard Access ✅
**Objective:** Verify only admins can access security dashboard

**Test Steps:**
1. Login as sales user
2. Navigate to `/admin/security`
3. Logout and login as admin
4. Navigate to `/admin/security`

**Expected Results:**
- ❌ Sales user redirected or sees access denied
- ✅ Admin user sees full security dashboard
- ✅ Metrics cards display correctly
- ✅ Event feed shows recent events

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 5.2: Real-time Security Notifications ✅
**Objective:** Verify real-time event updates

**Test Steps:**
1. Login as admin
2. Open security dashboard
3. In another browser/tab, trigger security event (failed login)
4. Observe dashboard

**Expected Results:**
- ✅ New event appears in feed within 2 seconds
- ✅ Metrics update automatically
- ✅ Toast notification appears for critical events
- ✅ No page refresh required

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 5.3: Email Security Alerts ✅
**Objective:** Verify automated email alerts work

**Test Steps:**
1. Configure RESEND_API_KEY
2. Trigger critical security event (5 failed logins)
3. Check admin email inbox

**Expected Results:**
- ✅ Email received within 1 minute
- ✅ Subject line indicates severity
- ✅ Email contains event details
- ✅ Link to security dashboard included

**Verification:**
Check Resend dashboard logs: https://resend.com/emails

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 5.4: IP Anomaly Detection ✅
**Objective:** Verify IP-based threat detection

**Test Steps:**
1. Login from normal IP address
2. Use VPN or proxy to change IP
3. Login from new IP address
4. Check security dashboard

**Expected Results:**
- ✅ Geographic anomaly detected
- ✅ Event logged with both IP addresses
- ✅ Risk level calculated correctly
- ✅ Alert sent if risk is high

**Verification:**
```sql
SELECT * FROM public.gdpr_audit_log 
WHERE event_type LIKE '%ip_anomaly%'
ORDER BY timestamp DESC;
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Phase 6: Vault Security Testing

### Test 6.1: Vault Credential Storage ✅
**Objective:** Verify credentials stored in vault, not plaintext

**Test Steps:**
1. Create new integration connection with OAuth
2. Query integration_connections table:
```sql
SELECT credentials, vault_secret_id 
FROM public.integration_connections 
WHERE user_id = auth.uid()
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Results:**
- ✅ `credentials` field is NULL
- ✅ `vault_secret_id` is populated with UUID
- ✅ Cannot retrieve plaintext credentials from table

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 6.2: Vault Access Logging ✅
**Objective:** Verify all vault operations are logged

**Test Steps:**
1. Store credentials in vault
2. Retrieve credentials from vault
3. Query vault access log:
```sql
SELECT * FROM public.vault_access_log 
WHERE user_id = auth.uid()
ORDER BY accessed_at DESC;
```

**Expected Results:**
- ✅ All vault operations logged
- ✅ Operation type recorded (store, retrieve, update, delete)
- ✅ Timestamp and user ID captured
- ✅ Success/failure status logged

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 6.3: Vault Access Control ✅
**Objective:** Verify users cannot access other users' vault secrets

**Test Steps:**
1. Login as sales1
2. Create integration with vault storage
3. Note the vault_secret_id
4. Logout and login as sales2
5. Attempt to access sales1's vault secret

**Expected Results:**
- ❌ Access denied
- ✅ Error logged
- ✅ No secret data leaked

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Phase 7: GDPR Compliance Testing

### Test 7.1: Right to Access (Data Export) ✅
**Objective:** Verify users can export all their data

**Test Steps:**
1. Login as sales user
2. Navigate to GDPR settings
3. Request data export
4. Download exported data

**Expected Results:**
- ✅ All user data included in export
- ✅ Transcripts, analyses, accounts included
- ✅ Export completes within reasonable time
- ✅ Data in readable format (JSON)

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 7.2: Right to Erasure (Account Deletion) ✅
**Objective:** Verify users can delete their accounts

**Test Steps:**
1. Login as test user
2. Request account deletion
3. Confirm deletion
4. Attempt to login again

**Expected Results:**
- ✅ Deletion warning displayed
- ✅ Confirmation required
- ✅ All related data deleted (transcripts, analyses)
- ❌ Login fails after deletion
- ✅ Audit log records deletion

**Verification:**
```sql
-- Should return no records
SELECT * FROM public.users WHERE email = 'deleted-test-user@test.com';
SELECT * FROM public.transcripts WHERE user_id = '<deleted-user-id>';
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### Test 7.3: Audit Log Retention ✅
**Objective:** Verify audit logs are retained properly

**Test Steps:**
1. Query audit logs older than 7 years
2. Run cleanup function
3. Verify old logs deleted

**Expected Results:**
- ✅ Logs older than 7 years deleted
- ✅ Recent logs preserved
- ✅ Cleanup operation logged

**Verification:**
```sql
SELECT public.cleanup_old_audit_logs();

SELECT COUNT(*) FROM public.gdpr_audit_log 
WHERE created_at < now() - interval '7 years';
-- Should return 0
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Critical Security Issues - Immediate Action Required

### Issue Tracking
| Issue | Severity | Status | Owner | Due Date |
|-------|----------|--------|-------|----------|
| | | | | |

### Severity Definitions
- **CRITICAL**: Immediate data breach risk, exploit publicly known
- **HIGH**: Significant security vulnerability, requires urgent fix
- **MEDIUM**: Security weakness, should be addressed in next sprint
- **LOW**: Minor security improvement, can be scheduled

---

## Test Execution Log

### Test Run #1
- **Date:** _____________
- **Tester:** _____________
- **Environment:** [ ] Staging [ ] Production
- **Tests Passed:** _____ / _____
- **Tests Failed:** _____ / _____
- **Critical Issues Found:** _____
- **Notes:**

---

### Test Run #2
- **Date:** _____________
- **Tester:** _____________
- **Environment:** [ ] Staging [ ] Production
- **Tests Passed:** _____ / _____
- **Tests Failed:** _____ / _____
- **Critical Issues Found:** _____
- **Notes:**

---

## Sign-off

### Security Testing Approval
- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Critical issues documented and assigned
- [ ] Penetration testing completed (if applicable)
- [ ] Security team approval obtained

**Security Lead Signature:** ___________________ **Date:** ___________

**Product Manager Signature:** ___________________ **Date:** ___________

---

## Appendix A: Automated Testing Scripts

### Script 1: RLS Policy Test Suite
```sql
-- Test users table RLS
BEGIN;
SET ROLE authenticated;
SET request.jwt.claims.sub = '<sales-user-1-id>';

SELECT * FROM public.users; -- Should return only own record

SET request.jwt.claims.sub = '<admin-user-id>';
SELECT * FROM public.users; -- Should return all records

ROLLBACK;
```

### Script 2: Rate Limit Test
```javascript
// Test login rate limiting
async function testLoginRateLimit() {
  const email = 'test@example.com';
  
  for (let i = 0; i < 6; i++) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'wrong-password'
    });
    
    console.log(`Attempt ${i + 1}:`, error);
    
    if (i === 5 && !error?.message.includes('Too many attempts')) {
      throw new Error('Rate limit not enforced!');
    }
  }
}
```

### Script 3: File Upload Security Test
```javascript
// Test file upload validation
async function testFileUploadSecurity() {
  const maliciousFiles = [
    { name: '../../etc/passwd.txt', type: 'text/plain' },
    { name: 'virus.exe', type: 'application/x-msdownload' },
    { name: 'autorun.inf', type: 'text/plain' }
  ];
  
  for (const file of maliciousFiles) {
    const result = await uploadTranscript(file);
    if (!result.error) {
      throw new Error(`Malicious file ${file.name} was not blocked!`);
    }
  }
}
```

---

## Appendix B: Security Testing Tools

### Recommended Tools
- **Burp Suite Community**: Web vulnerability scanning
- **OWASP ZAP**: Automated security testing
- **Postman**: API endpoint testing
- **pgTAP**: PostgreSQL unit testing
- **Jest**: JavaScript unit tests

### Supabase Testing Utilities
```javascript
// Helper function to switch test users
async function switchUser(userId) {
  const { data, error } = await supabase.rpc('set_test_user', {
    test_user_id: userId
  });
  return { data, error };
}

// Helper function to check RLS policy
async function testRLSPolicy(table, userId, expectedCount) {
  await switchUser(userId);
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (count !== expectedCount) {
    throw new Error(`RLS policy failed: expected ${expectedCount}, got ${count}`);
  }
}
```
