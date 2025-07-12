-- Reset the invite for erezgew@yahoo.com to allow proper registration
UPDATE invites 
SET used_at = NULL 
WHERE email = 'erezgew@yahoo.com' AND used_at IS NOT NULL;