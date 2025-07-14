-- Add missing admin policies for transcripts table
CREATE POLICY "Admins can view all transcripts" 
ON transcripts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add missing admin policies for conversation_analysis table  
CREATE POLICY "Admins can view all analysis" 
ON conversation_analysis 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add missing admin policies for accounts table
CREATE POLICY "Admins can view all accounts" 
ON accounts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);