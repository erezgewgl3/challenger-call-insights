# Manual Vault Integration Test Guide

## Prerequisites
- Admin access to Supabase dashboard
- Test user account created

## Test Scenario 1: New Connection with Vault Storage

### Steps:
1. **Create a new integration connection via `integration-callback`:**
   ```bash
   # This would normally happen via OAuth flow
   # POST to integration-callback edge function
   ```
   
   **Expected Result:**
   - New record in `integration_connections` with `vault_secret_id` populated
   - `credentials` field should be empty `{}`
   - New record in `vault_access_log` with operation='store' and success=true

2. **Verify in Supabase Dashboard:**
   ```sql
   -- Check the connection was created with vault reference
   SELECT 
     id, 
     integration_type, 
     vault_secret_id, 
     credentials,
     connection_status
   FROM integration_connections
   WHERE integration_type = 'zoom'
   ORDER BY created_at DESC
   LIMIT 1;
   
   -- Check vault access was logged
   SELECT 
     operation,
     integration_type,
     success,
     error_message,
     created_at
   FROM vault_access_log
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Test Scenario 2: Retrieve Credentials from Vault

### Steps:
1. **Trigger a sync operation via `integration-sync`:**
   ```bash
   # POST to integration-sync edge function
   # This will retrieve credentials from vault
   ```
   
   **Expected Result:**
   - Sync operation starts successfully
   - New record in `vault_access_log` with operation='retrieve' and success=true
   - No errors in edge function logs

2. **Verify in Supabase Dashboard:**
   ```sql
   -- Check vault retrieval was logged
   SELECT 
     operation,
     vault_secret_id,
     success,
     error_message,
     created_at
   FROM vault_access_log
   WHERE operation = 'retrieve'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Test Scenario 3: Update Credentials in Vault

### Steps:
1. **Trigger token refresh in `get-zoom-meetings`:**
   ```bash
   # POST to get-zoom-meetings edge function
   # This will refresh the access token and update vault
   ```
   
   **Expected Result:**
   - Access token refreshed
   - New record in `vault_access_log` with operation='update' and success=true

2. **Verify in Supabase Dashboard:**
   ```sql
   -- Check vault update was logged
   SELECT 
     operation,
     vault_secret_id,
     success,
     created_at
   FROM vault_access_log
   WHERE operation = 'update'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Test Scenario 4: Delete Credentials from Vault

### Steps:
1. **Disconnect integration via `integration-disconnect`:**
   ```bash
   # POST to integration-disconnect edge function
   ```
   
   **Expected Result:**
   - Connection status changed to 'inactive'
   - `vault_secret_id` cleared
   - New record in `vault_access_log` with operation='delete' and success=true

2. **Verify in Supabase Dashboard:**
   ```sql
   -- Check the connection was disconnected
   SELECT 
     id,
     connection_status,
     vault_secret_id
   FROM integration_connections
   WHERE id = '[connection-id]';
   
   -- Check vault deletion was logged
   SELECT 
     operation,
     vault_secret_id,
     success,
     created_at
   FROM vault_access_log
   WHERE operation = 'delete'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Test Scenario 5: Legacy Fallback

### Steps:
1. **Create a connection without vault_secret_id:**
   ```sql
   -- Simulate legacy connection
   INSERT INTO integration_connections (
     user_id,
     integration_type,
     connection_name,
     credentials,
     vault_secret_id
   ) VALUES (
     '[user-id]',
     'test',
     'Legacy Test Connection',
     '{"access_token": "legacy-token"}'::jsonb,
     NULL
   );
   ```

2. **Trigger sync operation:**
   ```bash
   # POST to integration-sync edge function with legacy connection
   ```
   
   **Expected Result:**
   - Sync works using credentials from database
   - Edge function logs warning about legacy credentials
   - No vault access log entry for retrieve operation

## Expected Database State After All Tests

```sql
-- Vault access log should have entries for all operations
SELECT 
  operation,
  COUNT(*) as operation_count
FROM vault_access_log
GROUP BY operation
ORDER BY operation;

-- Expected results:
-- store    | 1
-- retrieve | 1-2
-- update   | 0-1
-- delete   | 1
```

## Verification Checklist

- [ ] Vault storage creates audit log entry
- [ ] Vault retrieval creates audit log entry
- [ ] Vault update creates audit log entry
- [ ] Vault deletion creates audit log entry
- [ ] Legacy fallback works without errors
- [ ] RLS policies prevent unauthorized access to vault logs
- [ ] No credentials stored in plaintext in `credentials` column
- [ ] Edge function logs show no errors

## Quick Verification Query

Run this to see the overall vault usage:

```sql
SELECT 
  u.email,
  COUNT(val.*) as total_vault_operations,
  COUNT(val.*) FILTER (WHERE val.operation = 'store') as stores,
  COUNT(val.*) FILTER (WHERE val.operation = 'retrieve') as retrievals,
  COUNT(val.*) FILTER (WHERE val.operation = 'update') as updates,
  COUNT(val.*) FILTER (WHERE val.operation = 'delete') as deletes,
  COUNT(val.*) FILTER (WHERE val.success = false) as failures
FROM users u
LEFT JOIN vault_access_log val ON u.id = val.user_id
GROUP BY u.email
ORDER BY total_vault_operations DESC;
```
