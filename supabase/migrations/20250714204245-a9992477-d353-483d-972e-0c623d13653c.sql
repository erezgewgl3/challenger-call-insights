-- Add email tracking fields to invites table
ALTER TABLE invites 
ADD COLUMN email_sent boolean DEFAULT false,
ADD COLUMN email_sent_at timestamp with time zone,
ADD COLUMN email_error text;