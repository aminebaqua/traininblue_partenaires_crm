// components/leads/LeadEditForm.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lead, LeadFormData, ValidationErrors, ValidationState } from "./utils/leadTypes";

interface LeadEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: LeadFormData) => void;
  offres: any[];
  editingLead: Lead | null;
}

export const LeadEditForm = ({ open, onOpenChange, onSubmit, offres, editingLead }: LeadEditFormProps) => {
  const [formData, setFormData] = useState<LeadFormData>({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    siret: "",
    status: "nouveau",
    notes: "",
    offre_id: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    addSiret: "",
    editSiret: "",
  });

  const [isValid, setIsValid] = useState<ValidationState>({
    add: false,
    edit: false,
  });

  useEffect(() => {
    if (editingLead) {
      const currentOffreId = editingLead.current_offre_id || editingLead.offre_details?.id || "";
      
      setFormData({
        company_name: editingLead.company_name,
        contact_name: editingLead.contact_name,
        email: editingLead.email,
        phone: editingLead.phone || "",
        siret: editingLead.siret || "",
        status: editingLead.status,
        notes: editingLead.notes || "",
        offre_id: currentOffreId,
      });

      // Valider le SIRET existant
      if (editingLead.siret && editingLead.siret.length === 9) {
        setErrors(prev => ({ ...prev, editSiret: "" }));
        setIsValid(prev => ({ ...prev, edit: true }));
      }
    }
  }, [editingLead]);


const handleEditSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 9);

  setFormData({ ...formData, siret: onlyNumbers });

  if (onlyNumbers.length !== 9) {
    setErrors((prev) => ({ ...prev, editSiret: "Le SIRET doit contenir exactement 9 chiffres." }));
    setIsValid((prev) => ({ ...prev, edit: false }));
  } else {
    setErrors((prev) => ({ ...prev, editSiret: "" }));
    setIsValid((prev) => ({ ...prev, edit: true }));
  }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le Lead</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {editingLead?.company_name}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company_name">Entreprise *</Label>
              <Input
                id="edit-company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact_name">Contact *</Label>
              <Input
                id="edit-contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-siret">SIRET</Label>
              <Input
                id="edit-siret"
                value={formData.siret}
                onChange={handleEditSiretChange}
                placeholder="9 chiffres"
                maxLength={9}
                className={errors.editSiret ? "border-red-500" : ""}
              />
              {errors.editSiret && (
                <p className="text-red-500 text-xs">{errors.editSiret}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="en_cours">En Cours</SelectItem>
                  <SelectItem value="converti">Converti</SelectItem>
                  <SelectItem value="perdu">Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-offre_id">Offre *</Label>
            
            {editingLead?.offre_details && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200 mb-2">
                <p className="text-sm font-medium text-blue-800">Offre actuelle :</p>
                <p className="text-sm text-blue-700">
                  <strong>{editingLead.offre_details.nom}</strong>
                  {" "}({editingLead.offre_details.taux_commission}% - {editingLead.offre_details.plan_commission})
                </p>
              </div>
            )}
            
            <Select 
              value={formData.offre_id} 
              onValueChange={(value) => setFormData({ ...formData, offre_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  editingLead?.offre_details 
                    ? "Changer l'offre..." 
                    : "Sélectionnez une offre"
                } />
              </SelectTrigger>
              <SelectContent>
                {offres.map((offre: any) => (
                  <SelectItem key={offre.id} value={offre.id.toString()}>
                    {offre.nom_offre} ({offre.taux_commission}% - {offre.plan_commission})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes supplémentaires..."
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid.edit}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};