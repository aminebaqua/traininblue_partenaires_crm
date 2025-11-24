// types/lead.ts
export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  siret: string | null;
  status: 'nouveau' | 'en_cours' | 'converti' | 'perdu';
  notes: string | null;
  declared_at: string;
  created_at: string;
  updated_at: string;
  created_by_email: string;
  created_by_name: string;
}

export interface LeadsResponse {
  success: boolean;
  leads: Lead[];
  count: number;
  error?: string;
}