
-- Migration: 20251018232829
-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('nouveau', 'contacté', 'qualifié', 'converti', 'perdu');

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  siret TEXT,
  status lead_status DEFAULT 'nouveau',
  notes TEXT,
  declared_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads policies
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = commercial_id);

CREATE POLICY "Users can insert their own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = commercial_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = commercial_id);

-- Create enum for deal stage
CREATE TYPE public.deal_stage AS ENUM ('prospection', 'négociation', 'gagné', 'perdu');

-- Create enum for commission plan
CREATE TYPE public.commission_plan AS ENUM ('plan_30', 'plan_20', 'plan_25_20');

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  commercial_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  stage deal_stage DEFAULT 'prospection',
  commission_plan commission_plan NOT NULL,
  estimated_amount DECIMAL(10, 2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  notes TEXT,
  won_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Deals policies
CREATE POLICY "Users can view their own deals"
  ON public.deals FOR SELECT
  USING (auth.uid() = commercial_id);

CREATE POLICY "Users can insert their own deals"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = commercial_id);

CREATE POLICY "Users can update their own deals"
  ON public.deals FOR UPDATE
  USING (auth.uid() = commercial_id);

CREATE POLICY "Users can delete their own deals"
  ON public.deals FOR DELETE
  USING (auth.uid() = commercial_id);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  invoice_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = commercial_id);

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = commercial_id);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = commercial_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_deals
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251031114452
-- Create lead_actions table for tracking interactions with leads
CREATE TABLE public.lead_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email', 'phone', 'meeting', 'other')),
  action_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_actions
CREATE POLICY "Users can view their own lead actions"
ON public.lead_actions
FOR SELECT
USING (auth.uid() = commercial_id);

CREATE POLICY "Users can create their own lead actions"
ON public.lead_actions
FOR INSERT
WITH CHECK (auth.uid() = commercial_id);

CREATE POLICY "Users can update their own lead actions"
ON public.lead_actions
FOR UPDATE
USING (auth.uid() = commercial_id);

CREATE POLICY "Users can delete their own lead actions"
ON public.lead_actions
FOR DELETE
USING (auth.uid() = commercial_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_actions_updated_at
BEFORE UPDATE ON public.lead_actions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_lead_actions_lead_id ON public.lead_actions(lead_id);
CREATE INDEX idx_lead_actions_commercial_id ON public.lead_actions(commercial_id);

-- Migration: 20251101132103
-- Create lead_tasks table for planned tasks
CREATE TABLE public.lead_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  commercial_id UUID NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('call', 'email', 'meeting', 'other')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_tasks
CREATE POLICY "Users can view their own lead tasks"
  ON public.lead_tasks
  FOR SELECT
  USING (auth.uid() = commercial_id);

CREATE POLICY "Users can create their own lead tasks"
  ON public.lead_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = commercial_id);

CREATE POLICY "Users can update their own lead tasks"
  ON public.lead_tasks
  FOR UPDATE
  USING (auth.uid() = commercial_id);

CREATE POLICY "Users can delete their own lead tasks"
  ON public.lead_tasks
  FOR DELETE
  USING (auth.uid() = commercial_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lead_tasks_updated_at
  BEFORE UPDATE ON public.lead_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251101133221
-- Add foreign key relationship between lead_tasks and leads
ALTER TABLE public.lead_tasks
ADD CONSTRAINT lead_tasks_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES public.leads(id)
ON DELETE CASCADE;
