-- Email Campaigns Tracking Table
-- This tracks which users have received campaign emails

CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_name text NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'clicked')),
  resend_email_id text,
  error_message text,
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_campaign_name ON email_campaigns(campaign_name);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_email ON email_campaigns(user_email);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON email_campaigns(sent_at);

-- Composite index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_campaigns_campaign_user ON email_campaigns(campaign_name, user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER trigger_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();

-- Enable RLS (optional - adjust policies based on your needs)
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy for service role (for scripts)
CREATE POLICY "Service role can manage email campaigns"
  ON email_campaigns
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant access
GRANT ALL ON email_campaigns TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- View for campaign statistics
CREATE OR REPLACE VIEW email_campaign_stats AS
SELECT 
  campaign_name,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'sent') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
  MIN(sent_at) as first_sent,
  MAX(sent_at) as last_sent,
  ROUND(COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as open_rate,
  ROUND(COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as click_rate
FROM email_campaigns
GROUP BY campaign_name;

GRANT SELECT ON email_campaign_stats TO service_role;
