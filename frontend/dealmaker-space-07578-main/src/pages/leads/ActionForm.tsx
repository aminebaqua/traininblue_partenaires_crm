// components/leads/ActionForm.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Action, ActionFormData, Lead } from "./utils/leadTypes";
import { generateAutoTitle } from "./utils/leadUtils";

interface ActionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: ActionFormData) => void;
  selectedLead: Lead | null;
  editingAction: Action | null;
  isSubmitting: boolean;
}

export const ActionForm = ({
  open,
  onOpenChange,
  onSubmit,
  selectedLead,
  editingAction,
  isSubmitting
}: ActionFormProps) => {
  const [formData, setFormData] = useState<ActionFormData>({
    action_type: "email",
    date_echeance: "",
    titre: "",
    notes: "",
    priorite: "medium",
    statut: "en_attente",
  });

  // Fonction pour formater la date pour l'input datetime-local
  const formatDateTimeForInput = (date: Date | string): string => {
    const dateObj = new Date(date);
    return dateObj.toISOString().slice(0, 16);
  };

  // Fonction pour formater la date pour l'API
  const formatDateTimeForAPI = (dateTimeString: string): string => {
    return dateTimeString.replace('T', ' ') + ':00';
  };

  useEffect(() => {
    if (open) {
      if (editingAction) {
        // Mode édition
        setFormData({
          action_type: editingAction.action_type,
          date_echeance: formatDateTimeForInput(editingAction.date_echeance),
          titre: editingAction.titre,
          notes: editingAction.notes || "",
          priorite: editingAction.priorite,
          statut: editingAction.statut,
          realise_le: editingAction.realise_le ? formatDateTimeForInput(editingAction.realise_le) : undefined,
        });
      } else {
        // Mode création
        const autoTitle = generateAutoTitle("email", selectedLead);
        setFormData({
          action_type: "email",
          date_echeance: formatDateTimeForInput(new Date()),
          titre: autoTitle,
          notes: "",
          priorite: "medium",
          statut: "en_attente",
        });
      }
    }
  }, [editingAction, selectedLead, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider les champs requis
    if (!formData.titre.trim()) {
      alert("Le titre est obligatoire");
      return;
    }
    
    if (!formData.date_echeance) {
      alert("La date d'échéance est obligatoire");
      return;
    }

    // Formater les dates pour l'API
    const submitData = {
      ...formData,
      date_echeance: formatDateTimeForAPI(formData.date_echeance),
      realise_le: formData.realise_le ? formatDateTimeForAPI(formData.realise_le) : undefined,
    };
    
    onSubmit(submitData);
  };

  const handleActionTypeChange = (value: string) => {
    const newFormData = { 
      ...formData, 
      action_type: value as ActionFormData['action_type']
    };
    
    // Générer un titre automatique seulement en mode création
    if (!editingAction) {
      const autoTitle = generateAutoTitle(value as ActionFormData['action_type'], selectedLead);
      newFormData.titre = autoTitle;
    }
    
    setFormData(newFormData);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Réinitialiser le formulaire après fermeture
    setTimeout(() => {
      setFormData({
        action_type: "email",
        date_echeance: formatDateTimeForInput(new Date()),
        titre: "",
        notes: "",
        priorite: "medium",
        statut: "en_attente",
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingAction ? "Modifier l'action" : "Nouvelle Action"}
          </DialogTitle>
          <DialogDescription>
            {selectedLead ? `Pour ${selectedLead.company_name} - ${selectedLead.contact_name}` : "Sélectionnez un lead"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type d'action */}
          <div className="space-y-2">
            <Label htmlFor="action_type">Type d'action *</Label>
            <Select 
              value={formData.action_type} 
              onValueChange={handleActionTypeChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">📞 Appel téléphonique</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="meeting">👥 Réunion</SelectItem>
                <SelectItem value="other">📝 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Appel de suivi, Envoi de devis..."
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Date et heure d'échéance */}
          <div className="space-y-2">
            <Label htmlFor="date_echeance">Date et heure d'échéance *</Label>
            <Input
              id="date_echeance"
              type="datetime-local"
              value={formData.date_echeance}
              onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité</Label>
              <Select 
                value={formData.priorite} 
                onValueChange={(value) => setFormData({ ...formData, priorite: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Basse</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="high">🔴 Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select 
                value={formData.statut} 
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">⏳ En attente</SelectItem>
                  <SelectItem value="terminee">✅ Terminée</SelectItem>
                  <SelectItem value="annulee">❌ Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Champ realise_le si statut est "terminee" */}
          {formData.statut === 'terminee' && (
            <div className="space-y-2">
              <Label htmlFor="realise_le">Date de réalisation</Label>
              <Input
                id="realise_le"
                type="datetime-local"
                value={formData.realise_le || formatDateTimeForInput(new Date())}
                onChange={(e) => setFormData({ ...formData, realise_le: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          )}
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes supplémentaires sur cette action..."
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? "Enregistrement..." 
                : editingAction 
                  ? "Mettre à jour" 
                  : "Créer l'action"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};