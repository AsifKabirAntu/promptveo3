-- Add plan column to subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')); 