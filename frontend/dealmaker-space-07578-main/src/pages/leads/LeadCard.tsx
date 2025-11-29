// components/leads/LeadCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Calendar, History, Edit, Building, ContactRound, FileText } from "lucide-react";
import { Lead } from "./utils/leadTypes";
import { getStatusColor, getStatusLabel, formatDate } from "./utils/leadUtils";

interface LeadCardProps {
  lead: Lead;
  onOpenActions: (lead: Lead) => void;
  onOpenEdit: (lead: Lead) => void;
}

export const LeadCard = ({ lead, onOpenActions, onOpenEdit }: LeadCardProps) => {
  return (
<Card key={lead.id} className="hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <div className="flex justify-between items-start">
      <div>
        <CardTitle className="flex items-center gap-2 text-lg mb-1">
          <Building2 className="h-5 w-5 text-blue-500" />
          {lead.company_name}
        </CardTitle>
        <CardTitle className="flex items-center gap-2 text-lg mb-1">
          <ContactRound className="h-5 w-5 text-blue-500" />
          {lead.contact_name}
        </CardTitle>
      </div>
      <Badge className={getStatusColor(lead.status)}>
        {getStatusLabel(lead.status)}
      </Badge>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4 pt-0">
    {/* DEUX COLONNES */}
    <div className="grid grid-cols-2 gap-4">
      {/* Colonne gauche - Contact */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-blue-500" />
          <a href={`mailto:${lead.email}`} className="hover:underline">
            {lead.email}
          </a>
        </div>
        
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-green-500" />
            <a href={`tel:${lead.phone}`} className=" hover:underline">
              {lead.phone}
            </a>
          </div>
        )}
      </div>

      {/* Colonne droite - Infos */}
      <div className="space-y-3">
        {lead.siret && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">SIRET:</span>
            <span className="font-medium">{lead.siret}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-orange-500" />
          <span className="text-muted-foreground">Créé le</span>
          <span className="font-medium">{formatDate(lead.declared_at)}</span>
        </div>
      </div>
    </div>

    {/* NOTES - PLEINE LARGEUR */}
    {lead.notes && (
      <div className="bg-muted/30 p-3 rounded-lg border">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground">{lead.notes}</p>
          </div>
        </div>
      </div>
    )}

    {/* ACTIONS - PLEINE LARGEUR */}
    <div className="flex gap-2 pt-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onOpenActions(lead)}
        className="flex-1 flex items-center gap-2"
      >
        <History className="h-4 w-4" />
        Actions
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onOpenEdit(lead)}
        className="flex-1 flex items-center gap-2"
      >
        <Edit className="h-4 w-4" />
        Modifier
      </Button>
    </div>
  </CardContent>
</Card>
  );
};