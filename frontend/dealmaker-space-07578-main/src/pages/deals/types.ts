export interface Deal {
  id: string;
  nom_deal: string;
  nom_entreprise: string;
  stage: string;
  type_deal: string;
  montant: number | null;
  notes: string | null;
  remporte_le: string | null;
  created_at: string;
  updated_at: string;
  plan_commission: string | null;
  taux_commission: number | null;
  relation: string; // ID de la relation
  facture?: string;
  relation_info?: RelationInfo;
  lead_info?: {
    company_name: string;
    contact_name: string;
    email: string;
  };
  // Add missing fields for commissions functionality
  date_paiment_client?: string | null;
  date_paiment_commission?: string | null;
}

export interface RelationInfo {
  id: string;
  commercial: string;
  lead_company: string;
  lead_contact: string;
  offre_nom: string;
  offre_info?: OffreInfo;
}

export interface OffreInfo {
  id: string;
  nom: string;
  plan_commission: string | null;
  taux_commission: number | null;
}

export interface Lead {
  id: string; // ID du lead
  contact_name: string;
  company_name: string;
  email: string;
  relation_id: string; // ID de la relation associée
}

export interface AvailableRelation {
  id: string; // ID de la relation (pour le champ 'relation')
  company_name: string;
  contact_name: string;
  email: string;
  offre_nom?: string;
  plan_commission?: string;
  taux_commission?: number;
}

export interface FormData {
  nom_deal: string;
  stage: string;
  type_deal: string;
  montant: string;
  notes: string;
  relation: string; // Doit contenir l'ID de relation
}

// Pour les actions (si vous en avez besoin)
export interface ActionFormData {
  action_type: string;
  date_echeance: string;
  titre: string;
  notes: string;
  priorite: string;
  statut: string;
  realise_le?: string;
}

// Pour les réponses d'API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface Facture {
  id: string;
  numero_facture: string;
  montant_ht: number;
  montant_ttc: number;
  date_facture: string;
  date_echeance: string | null;
  statut_paiement: string;
  commercial_name: string;
  deals: Deal[];
  created_at: string;
  updated_at: string;
  fichier?: string | null; // Added file field for upload functionality
}