// components/leads/ActionsDialog.tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { Lead, Action } from "./utils/leadTypes";
import { ActionCard } from "./ActionCard";

interface ActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: Lead | null;
  leadActions: Action[];
  onOpenActionForm: (action?: Action) => void;
  onMarkActionDone: (actionId: string) => void;
  onMarkActionCancelled: (actionId: string) => void;
  onDeleteAction: (actionId: string) => void;
}

export const ActionsDialog = ({
  open,
  onOpenChange,
  selectedLead,
  leadActions,
  onOpenActionForm,
  onMarkActionDone,
  onMarkActionCancelled,
  onDeleteAction
}: ActionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Planifier une action | Renseigner une action réalisée</DialogTitle>
          <DialogDescription>
            Gérez les actions pour {selectedLead?.contact_name} - {selectedLead?.company_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button onClick={() => onOpenActionForm()} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Action
          </Button>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leadActions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune action enregistrée pour ce lead</p>
                <p className="text-sm">Créez votre première action pour commencer le suivi</p>
              </div>
            ) : (
              leadActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onEdit={onOpenActionForm}
                  onMarkDone={onMarkActionDone}
                  onMarkCancelled={onMarkActionCancelled}
                  onDelete={onDeleteAction}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};