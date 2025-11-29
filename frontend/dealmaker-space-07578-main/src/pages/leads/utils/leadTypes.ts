// types/leadTypes.ts
export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  siret?: string;
  status: string;
  notes?: string;
  declared_at: string;
  created_at: string;
  created_by?: number;
  created_by_username?: string;
  current_offre_id?: string;
  offre_details?: OffreDetails;
}

export interface OffreDetails {
  id: string;
  nom: string;
  taux_commission: number;
  plan_commission: string;
}

export interface Action {
  id: string;
  lead: string;
  commercial: string;
  action_type: string;
  date_echeance: string;
  realise_le: string | null;
  titre: string;
  notes: string | null;
  priorite: string;
  statut: string;
  created_at: string;
  updated_at: string;
  commercial_name?: string;
  lead_company?: string;
  lead_contact?: string;
}

export interface ActionFormData {
  action_type: string;
  date_echeance: string;
  titre: string;
  notes: string;
  priorite: string;
  statut: string;
  realise_le?: string;
}

export interface LeadFormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  siret: string;
  status: string;
  notes: string;
  offre_id: string;
}

export interface ValidationErrors {
  addSiret: string;
  editSiret: string;
}

export interface ValidationState {
  add: boolean;
  edit: boolean;
}