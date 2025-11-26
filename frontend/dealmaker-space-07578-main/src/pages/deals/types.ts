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
  relation: string;
  facture?: string;
  relation_info?: RelationInfo;
  // Add this new field
  lead_info?: {
    company_name: string;
    contact_name: string;
    email: string;
  };
}

export interface OffreInfo {
  id: string;
  nom: string;
  plan_commission: string | null;
  taux_commission: number | null;
}

export interface Lead {
  id: string;
  contact_name: string;
  company_name: string;
  email: string;
  relation_id: string; // Ajoutez ce champ
}

// types.ts
export interface AvailableRelation {
  id: string;          // ID de la relation (pour le champ 'relation')
  company_name: string;
  contact_name: string;
  email: string;
}

export interface FormData {
  nom_deal: string;
  stage: string;
  type_deal: string;
  montant: string;
  notes: string;
  relation: string;    // Doit contenir l'ID de relation
}

