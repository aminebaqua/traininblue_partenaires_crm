import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import apiClient from "@/services/api";
import { AvailableRelation, FormData } from "../types";
import { LeadSearchSelect } from "./LeadSearchSelect";

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: AvailableRelation[];
  onDealCreated: () => void;
  children: React.ReactNode;
}

export const CreateDealDialog = ({
  open,
  onOpenChange,
  leads,
  onDealCreated,
  children
}: CreateDealDialogProps) => {
  const [formData, setFormData] = useState<FormData>({
    nom_deal: "",
    stage: "prospection",
    type_deal: "one_shot",
    montant: "",
    notes: "",
    relation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        nom_deal: "",
        stage: "prospection",
        type_deal: "one_shot",
        montant: "",
        notes: "",
        relation: "",
      });
      setFormErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nom_deal.trim()) {
      errors.nom_deal = "Le nom du deal est obligatoire";
    }

    if (!formData.relation) {
      errors.relation = "La relation commerciale est obligatoire";
    }

    if (!formData.type_deal) {
      errors.type_deal = "Le type de deal est obligatoire";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = Object.values(formErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }
    
    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      const payload = {
        nom_deal: formData.nom_deal.trim(),
        stage: formData.stage,
        type_deal: formData.type_deal,
        montant: formData.montant ? parseFloat(formData.montant) : null,
        notes: formData.notes?.trim() || null,
        relation: formData.relation,
      };

      await apiClient.post('/deals/', payload);
      toast.success("Deal créé avec succès !");
      
      onOpenChange(false);
      onDealCreated();
    } catch (error: any) {
      console.error('Erreur création deal:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        const newErrors: Record<string, string> = {};
        
        // Gestion des différents formats d'erreur
        if (errorData.details) {
          Object.entries(errorData.details).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              newErrors[field] = messages[0];
            } else if (typeof messages === 'string') {
              newErrors[field] = messages;
            }
          });
        } else if (errorData.non_field_errors) {
          newErrors.non_field_errors = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors;
        } else {
          Object.entries(errorData).forEach(([field, message]) => {
            if (Array.isArray(message) && message.length > 0) {
              newErrors[field] = message[0];
            } else if (typeof message === 'string') {
              newErrors[field] = message;
            } else if (field === 'error' && typeof message === 'string') {
              newErrors.non_field_errors = message;
            }
          });
        }
        
        setFormErrors(newErrors);
        
        const firstError = Object.values(newErrors)[0];
        if (firstError) {
          toast.error(firstError);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          toast.error("Erreur lors de la création du deal");
        }
      } else if (error.request) {
        toast.error("Erreur de connexion");
      } else {
        toast.error("Erreur inattendue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setFormData({
        nom_deal: "",
        stage: "prospection",
        type_deal: "one_shot",
        montant: "",
        notes: "",
        relation: "",
      });
      setFormErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un nouveau deal</DialogTitle>
          <DialogDescription>
            Remplissez les informations de l'opportunité
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom_deal">Nom du deal *</Label>
            <Input
              id="nom_deal"
              value={formData.nom_deal}
              onChange={(e) => setFormData({ ...formData, nom_deal: e.target.value })}
              placeholder="Ex: Contrat annuel, Projet spécial..."
              required
              disabled={isSubmitting}
              className={formErrors.nom_deal ? "border-red-500" : ""}
            />
            {formErrors.nom_deal && (
              <p className="text-sm text-red-500">{formErrors.nom_deal}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">Lead *</Label>
            <LeadSearchSelect
              leads={leads}
              value={formData.relation}
              onValueChange={(value) => setFormData({ ...formData, relation: value })}
              disabled={isSubmitting}
              hasError={!!formErrors.relation}
            />
            {formErrors.relation && (
              <p className="text-sm text-red-500">{formErrors.relation}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Étape</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospection">Prospection</SelectItem>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="negociation">Négociation</SelectItem>
                  <SelectItem value="contrat">Contrat</SelectItem>
                  <SelectItem value="gagne">Gagné</SelectItem>
                  <SelectItem value="perdu">Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type_deal">Type de deal *</Label>
              <Select 
                value={formData.type_deal} 
                onValueChange={(value) => setFormData({ ...formData, type_deal: value })}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger className={formErrors.type_deal ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_shot">One-shot</SelectItem>
                  <SelectItem value="durable">Durable</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.type_deal && (
                <p className="text-sm text-red-500">{formErrors.type_deal}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="montant">Montant estimé (€)</Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                min="0"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                placeholder="0.00"
                disabled={isSubmitting}
                className={formErrors.montant ? "border-red-500" : ""}
              />
              {formErrors.montant && (
                <p className="text-sm text-red-500">{formErrors.montant}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes supplémentaires sur ce deal..."
              disabled={isSubmitting}
              className={formErrors.notes ? "border-red-500" : ""}
            />
            {formErrors.notes && (
              <p className="text-sm text-red-500">{formErrors.notes}</p>
            )}
          </div>

          {formErrors.non_field_errors && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formErrors.non_field_errors}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-24"
            >
              {isSubmitting ? "Création..." : "Créer le deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};