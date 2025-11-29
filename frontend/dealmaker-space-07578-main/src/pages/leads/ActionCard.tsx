// components/leads/ActionCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Users, FileText, CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";
import { Action } from "./utils/leadTypes";
import { getActionStatusLabel, getPriorityLabel } from "./utils/leadUtils";

interface ActionCardProps {
  action: Action;
  onEdit: (action: Action) => void;
  onMarkDone: (actionId: string) => void;
  onMarkCancelled: (actionId: string) => void;
  onDelete: (actionId: string) => void;
}

export const ActionCard = ({ 
  action, 
  onEdit, 
  onMarkDone, 
  onMarkCancelled, 
  onDelete 
}: ActionCardProps) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-600';
      case 'call': return 'bg-green-100 text-green-600';
      case 'meeting': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <Card key={action.id} className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            <div className={`mt-1 p-2 rounded-full ${getActionColor(action.action_type)}`}>
              {getActionIcon(action.action_type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{action.titre}</span>
                <Badge variant="outline" className="text-xs">
                  {new Date(action.date_echeance).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={
                    action.statut === 'terminee' ? 'default' :
                    action.statut === 'annulee' ? 'destructive' : 'secondary'
                  }
                  className="text-xs"
                >
                  {action.statut === 'en_attente' && '⏳ En attente'}
                  {action.statut === 'terminee' && '✅ Terminée'}
                  {action.statut === 'annulee' && '❌ Annulée'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(action.priorite)}`}
                >
                  {getPriorityIcon(action.priorite)} {getPriorityLabel(action.priorite)}
                </Badge>
              </div>
              
              {action.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {action.notes}
                </p>
              )}
              
              {action.statut === 'terminee' && action.realise_le && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Réalisée le {new Date(action.realise_le).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {action.statut === 'en_attente' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkDone(action.id)}
                  title="Marquer comme terminée"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkCancelled(action.id)}
                  title="Annuler l'action"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(action)}
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(action.id)}
              title="Supprimer"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};