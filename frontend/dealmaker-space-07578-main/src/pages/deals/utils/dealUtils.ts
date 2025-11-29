export const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    prospection: "bg-blue-100 text-blue-800 border-blue-200",
    negociation: "bg-orange-100 text-orange-800 border-orange-200",
    gagne: "bg-green-100 text-green-800 border-green-200",
    perdu: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[stage] || colors.prospection;
};

export const getTypeDealLabel = (typeDeal: string) => {
  const labels: Record<string, string> = {
    one_shot: "One-shot",
    durable: "Durable",
  };
  return labels[typeDeal] || typeDeal;
};

export const getPlanCommissionLabel = (plan: string | null) => {
  const labels: Record<string, string> = {
    standard: "Standard",
    premium: "Premium",
    enterprise: "Enterprise",
    custom: "Personnalisé",
    one_shot: "One-shot",
    durable: "Durable",
  };
  return plan ? labels[plan] || plan : "Non défini";
};

export const calculateCommission = (montant: number | null, taux: number | null) => {
  if (!montant || !taux) return null;
  return (montant * taux) / 100;
};

export const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    prospection: "Prospection",
    negociation: "Négociation", 
    gagne: "Gagné",
    perdu: "Perdu",
  };
  return labels[stage] || stage;
};