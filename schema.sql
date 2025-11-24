-- Enum Types
CREATE TYPE public.lead_status AS ENUM ('nouveau', 'contacté', 'qualifié', 'converti', 'perdu');
CREATE TYPE public.deal_stage AS ENUM ('prospection', 'négociation', 'gagné', 'perdu');
CREATE TYPE public.commission_plan AS ENUM ('plan_30', 'plan_20', 'plan_25_20');

-- Table Schemas
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE public.lead_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('call', 'email', 'meeting', 'other')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
