// components/leads/LeadList.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Lead } from "./utils/leadTypes";
import { LeadCard } from "./LeadCard";

interface LeadListProps {
  leads: Lead[];
  onOpenActions: (lead: Lead) => void;
  onOpenEdit: (lead: Lead) => void;
}

export const LeadList = ({ leads, onOpenActions, onOpenEdit }: LeadListProps) => {
  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun lead</h3>
          <p className="text-muted-foreground text-center">
            Vous n'avez pas encore de leads. Créez votre premier lead pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onOpenActions={onOpenActions}
          onOpenEdit={onOpenEdit}
        />
      ))}
    </div>
  );
};