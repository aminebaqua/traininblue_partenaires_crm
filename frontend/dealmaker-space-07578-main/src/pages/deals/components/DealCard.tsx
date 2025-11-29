import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Euro, Percent, FileText, NotebookTabs, CalendarFold, ChevronDown, ChevronUp, User, Mail } from "lucide-react";
import { Deal } from "../types";
import { getStageColor, getTypeDealLabel, getPlanCommissionLabel, calculateCommission } from "../utils/dealUtils";

interface DealCardProps {
  deal: Deal;
  draggedDeal: string | null;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
}

export const DealCard = ({ deal, draggedDeal, onDragStart, onDragEnd }: DealCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const planCommission = deal.plan_commission || deal.relation_info?.offre_info?.plan_commission;
  const tauxCommission = deal.taux_commission || deal.relation_info?.offre_info?.taux_commission;
  const commissionPotentielle = calculateCommission(deal.montant, tauxCommission);

  // Get lead information from the new lead_info field
  const leadInfo = deal.lead_info;
  const contactName = leadInfo?.contact_name || deal.relation_info?.lead_contact;
  const companyName = leadInfo?.company_name || deal.nom_entreprise;
  const email = leadInfo?.email;

  return (
    <Card 
      draggable
      onDragStart={() => onDragStart(deal.id)}
      onDragEnd={onDragEnd}
      className={`cursor-move transition-all border-2 ${
        draggedDeal === deal.id ? 'opacity-50' : ''
      } ${getStageColor(deal.stage)}`}
    >
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={toggleExpansion}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{deal.nom_deal}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpansion();
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {/* Lead Contact Information */}
          {contactName && (
            <div className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium">{contactName}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs">
            <Building className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Entreprise:</span>
            <span className="font-medium">{companyName}</span>
          </div>

          {/* Email if available */}
          {email && (
            <div className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{email}</span>
            </div>
          )}

          {/* Commission Section */}
          {(planCommission || tauxCommission) && (
            <div className="space-y-1 pt-2 border-t">
              {planCommission && (
                <div className="flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{getPlanCommissionLabel(planCommission)}</span>
                </div>
              )}
              {deal.montant && (
                <div className="flex items-center gap-1 text-xs">
                  <Euro className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">Montant:</span>        
                  {deal.montant.toLocaleString("fr-FR")} €
                </div>
              )}
              {tauxCommission && (
                <div className="flex items-center gap-1 text-xs">
                  <Percent className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">Taux:</span>
                  <span className="font-medium">{tauxCommission}%</span>
                </div>
              )}
              {commissionPotentielle && deal.montant && (
                <div className="flex items-center gap-1 text-xs">
                  <Euro className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">Commission: </span>
                  <span>{commissionPotentielle.toLocaleString("fr-FR", { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })} €</span>
                </div>
              )}
            </div>
          )}
          
          {deal.notes && (
            <div className="flex items-start gap-1 text-xs">
              <NotebookTabs className="h-3 w-3 text-blue-500 mt-0.5" />   
              <div>
                <span className="text-muted-foreground">Notes: </span>               
                <span className="line-clamp-2">{deal.notes}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs">
            <CalendarFold className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Créé le</span>
            <span className="font-medium"> {new Date(deal.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};