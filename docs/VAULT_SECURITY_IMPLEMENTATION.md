# Vault Security Implementation

## Overview
All OAuth credentials and sensitive integration tokens are now encrypted and stored in Supabase Vault instead of plaintext database columns.

## Architecture

### Storage Flow
```
Integration Connection → Vault Storage → vault_secret_id reference
                         (encrypted)    (UUID only in DB)
```

### Components

1. **Vault Helpers** (`supabase/functions/_shared/vault-helpers.ts`)
   - `storeCredentialsInVault()` - Encrypts and stores credentials
   - `getCredentialsFromVault()` - Retrieves and decrypts credentials
   - `updateCredentialsInVault()` - Updates existing credentials
   - `deleteCredentialsFromVault()` - Removes credentials from vault

2. **Database Schema**
   - `integration_connections.vault_secret_id` - UUID reference to vault
   - `vault_access_log` - Audit trail of all vault operations
   
3. **Edge Functions**
   - All integration functions use vault helpers
   - Legacy fallback for old connections without vault_secret_id

## Security Features

### Encryption
- All credentials encrypted at rest using Supabase Vault (AES-256)
- Credentials never stored in plaintext in database columns
- Vault access requires service role key (edge functions only)

### Audit Logging
Every vault operation is logged to `vault_access_log`:
- Operation type (store, retrieve, update, delete)
- User ID and integration type
- Success/failure status
- Error messages (if applicable)
- Timestamp

### Access Control
- RLS policies restrict vault log access to:
  - Users can see their own operations
  - Admins can see all operations
- Vault operations only callable from edge functions (server-side)

## Migration Strategy

### New Connections
1. User initiates OAuth flow
2. Tokens received from provider
3. `storeCredentialsInVault()` called
4. `vault_secret_id` stored in `integration_connections`
5. No plaintext credentials in database

### Legacy Connections
- Existing connections without `vault_secret_id` continue working
- Fallback to `credentials` column if `vault_secret_id` is null
- Warning logged when fallback is used
- Admin can identify and migrate legacy connections

## Integration Flow

### Connection Creation
```typescript
// 1. OAuth callback receives tokens
const tokens = { access_token, refresh_token, expires_at };

// 2. Store in vault
const vaultSecretId = await storeCredentialsInVault(
  supabase,
  tokens,
  `zoom_token_${userId}_${Date.now()}`,
  userId,
  'zoom'
);

// 3. Store only vault reference in DB
await supabase.from('integration_connections').insert({
  user_id: userId,
  integration_type: 'zoom',
  vault_secret_id: vaultSecretId,
  credentials: {}, // Empty - all in vault
  // ... other fields
});
```

### Credential Retrieval
```typescript
// 1. Get connection
const { data: connection } = await supabase
  .from('integration_connections')
  .select('vault_secret_id, credentials')
  .eq('user_id', userId)
  .single();

// 2. Get from vault if available
let credentials;
if (connection.vault_secret_id) {
  credentials = await getCredentialsFromVault(
    supabase,
    connection.vault_secret_id,
    userId,
    'zoom'
  );
} else {
  // Legacy fallback
  credentials = connection.credentials;
  console.warn('[SECURITY] Using legacy credentials from database');
}
```

### Token Refresh
```typescript
// 1. Get existing credentials
const credentials = await getCredentialsFromVault(...);

// 2. Refresh with provider
const newTokens = await refreshTokens(credentials.refresh_token);

// 3. Update in vault
await updateCredentialsInVault(
  supabase,
  vaultSecretId,
  { ...credentials, ...newTokens },
  userId,
  'zoom'
);
```

## Frontend Integration

### Visual Indicators
- "Vault Secured" badge with shield icon
- Tooltip: "Credentials are encrypted and stored securely in Supabase Vault"
- Shows on integration cards and status displays

### User Visibility
Users see vault security status in:
- Integration list cards
- Connection status panels
- Settings pages

## Admin Monitoring

### Vault Access Dashboard Queries
```sql
-- Recent vault operations
SELECT 
  val.created_at,
  val.user_id,
  u.email,
  val.integration_type,
  val.operation,
  val.success,
  val.error_message
FROM vault_access_log val
LEFT JOIN users u ON val.user_id = u.id
ORDER BY val.created_at DESC
LIMIT 100;

-- Failed vault operations
SELECT 
  val.user_id,
  u.email,
  val.integration_type,
  val.operation,
  val.error_message,
  val.created_at
FROM vault_access_log val
LEFT JOIN users u ON val.user_id = u.id
WHERE val.success = false
ORDER BY val.created_at DESC;

-- Vault usage by user
SELECT 
  u.email,
  val.integration_type,
  COUNT(*) FILTER (WHERE val.operation = 'store') as stores,
  COUNT(*) FILTER (WHERE val.operation = 'retrieve') as retrievals,
  COUNT(*) FILTER (WHERE val.operation = 'update') as updates,
  COUNT(*) FILTER (WHERE val.operation = 'delete') as deletions,
  COUNT(*) FILTER (WHERE val.success = false) as failures
FROM vault_access_log val
LEFT JOIN users u ON val.user_id = u.id
GROUP BY u.email, val.integration_type
ORDER BY stores DESC;

-- Legacy connections without vault
SELECT 
  ic.id,
  u.email,
  ic.integration_type,
  ic.connection_name,
  ic.created_at,
  ic.connection_status
FROM integration_connections ic
JOIN users u ON ic.user_id = u.id
WHERE ic.vault_secret_id IS NULL
  AND ic.connection_status = 'active'
ORDER BY ic.created_at DESC;
```

## Testing Checklist

### New Connection Test
- [ ] Connect new Zoom integration
- [ ] Verify `vault_secret_id` is set in database
- [ ] Verify `credentials` column is empty/minimal
- [ ] Check `vault_access_log` has 'store' operation
- [ ] Verify "Vault Secured" badge appears in UI

### Credential Retrieval Test
- [ ] Trigger sync operation
- [ ] Check `vault_access_log` has 'retrieve' operation
- [ ] Verify sync completes successfully
- [ ] No credentials in console logs

### Token Refresh Test
- [ ] Trigger token refresh (expired token)
- [ ] Check `vault_access_log` has 'update' operation
- [ ] Verify new tokens work for API calls

### Disconnect Test
- [ ] Disconnect integration
- [ ] Check `vault_access_log` has 'delete' operation
- [ ] Verify `vault_secret_id` is null in database
- [ ] Verify vault secret is deleted

### Legacy Fallback Test
- [ ] Use existing connection without `vault_secret_id`
- [ ] Verify sync still works
- [ ] Check for fallback warning in logs

## Security Best Practices

### DO
✅ Always use vault helpers for credential storage
✅ Log all vault operations for audit trail
✅ Validate user ownership before vault operations
✅ Handle vault errors gracefully with fallbacks
✅ Rotate vault secrets periodically

### DON'T
❌ Never store credentials in plaintext columns
❌ Never log actual credential values
❌ Never expose vault operations to client-side
❌ Never skip error handling in vault operations
❌ Never bypass vault storage for "convenience"

## Troubleshooting

### Common Issues

**Issue**: Vault secret not found
- Check if `vault_secret_id` exists in database
- Verify vault secret wasn't manually deleted
- Check `vault_access_log` for deletion events

**Issue**: Credentials not decrypting
- Verify service role key is correct
- Check vault permissions
- Review error in `vault_access_log`

**Issue**: Legacy connection not working
- Ensure fallback code is present
- Check if `credentials` column has data
- Review connection status

## Compliance

### GDPR
- Vault access fully audited in `vault_access_log`
- User can request credential deletion
- Retention policy: credentials deleted with connection
- Right to access: users can see their vault operations

### SOC 2
- All credential access logged
- Encryption at rest and in transit
- Access control via RLS policies
- Regular audit trail review

## Performance

### Caching Strategy
- Credentials cached in memory during edge function execution
- No persistent client-side caching
- Vault access only when credentials needed

### Optimization
- Batch operations where possible
- Minimize vault calls in hot paths
- Use connection pooling for database access

## Future Enhancements

1. **Automatic Migration Tool**
   - Admin function to migrate legacy credentials to vault
   - Batch processing of old connections

2. **Vault Secret Rotation**
   - Scheduled rotation of vault secrets
   - Automatic re-encryption with new keys

3. **Enhanced Monitoring**
   - Real-time alerts for failed vault operations
   - Dashboard for vault health metrics
   - Anomaly detection for unusual access patterns

4. **Multi-Region Vault**
   - Geographic distribution for compliance
   - Region-specific vault instances
