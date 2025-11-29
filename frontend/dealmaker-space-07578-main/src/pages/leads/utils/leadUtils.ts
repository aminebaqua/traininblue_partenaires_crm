// utils/leadUtils.ts
import { Lead, Action } from './leadTypes';

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    nouveau: "bg-blue-100 text-blue-800 border-blue-200",
    en_cours: "bg-yellow-100 text-yellow-800 border-yellow-200",
    converti: "bg-green-100 text-green-800 border-green-200",
    perdu: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || colors.nouveau;
};

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    nouveau: "Nouveau",
    en_cours: "En Cours",
    converti: "Converti",
    perdu: "Perdu",
  };
  return labels[status] || status;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const isActionOverdue = (dateEcheance: string) => {
  return new Date(dateEcheance) < new Date();
};

export const getActionTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    call: "Appel",
    email: "Email",
    meeting: "Réunion",
    other: "Autre",
  };
  return types[type] || type;
};

export const getPriorityColor = (priorite: string) => {
  const colors: Record<string, string> = {
    high: "text-red-600",
    medium: "text-orange-600",
    low: "text-green-600",
  };
  return colors[priorite] || "text-gray-600";
};

export const getPriorityLabel = (priorite: string) => {
  const labels: Record<string, string> = {
    high: "Haute",
    medium: "Moyenne",
    low: "Basse",
  };
  return labels[priorite] || priorite;
};

export const getActionStatusLabel = (statut: string) => {
  const labels: Record<string, string> = {
    en_attente: "En attente",
    terminee: "Terminée",
    annulee: "Annulée",
  };
  return labels[statut] || statut;
};

export const generateAutoTitle = (actionType: string, lead: Lead | null) => {
  const titles: Record<string, string> = {
    call: `Appel ${lead?.contact_name || ''}`,
    email: `Email ${lead?.contact_name || ''}`,
    meeting: `RDV ${lead?.company_name || ''}`,
    other: 'Action planifiée'
  };
  return titles[actionType]?.trim() || `Action ${actionType}`;
};