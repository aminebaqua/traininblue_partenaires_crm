// components/leads/LeadForm.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadFormData, ValidationErrors, ValidationState } from "./utils/leadTypes";

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: LeadFormData) => void;
  offres: any[];
  initialData?: LeadFormData;
}

export const LeadForm = ({ open, onOpenChange, onSubmit, offres, initialData }: LeadFormProps) => {
  const [formData, setFormData] = useState<LeadFormData>(
    initialData || {
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      siret: "",
      status: "nouveau",
      notes: "",
      offre_id: "",
    }
  );

  const [errors, setErrors] = useState<ValidationErrors>({
    addSiret: "",
    editSiret: "",
  });

  const [isValid, setIsValid] = useState<ValidationState>({
    add: false,
    edit: false,
  });

const handleAddSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 9);

  setFormData({ ...formData, siret: onlyNumbers });

  if (onlyNumbers.length !== 9) {
    setErrors((prev) => ({ ...prev, addSiret: "Le SIRET doit contenir exactement 9 chiffres." }));
    setIsValid((prev) => ({ ...prev, add: false }));
  } else {
    setErrors((prev) => ({ ...prev, addSiret: "" }));
    setIsValid((prev) => ({ ...prev, add: true }));
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le lead" : "Créer un nouveau lead"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modifiez les informations du lead" : "Remplissez les informations du prospect"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Votre formulaire ici - même structure que dans votre fichier actuel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Entreprise *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
              />
            </div>
          </div>
          
          {/* ... reste du formulaire ... */}
                          <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      value={formData.siret}
                      onChange={handleAddSiretChange}
                      placeholder="9 chiffres"
                      maxLength={9}
                      className={errors.addSiret ? "border-red-500" : ""}
                    />

                    {errors.addSiret && (
                      <p className="text-red-500 text-xs">{errors.addSiret}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
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
                  <Label htmlFor="offre_id">Offre *</Label>
                  <Select 
                    value={formData.offre_id} 
                    onValueChange={(value) => setFormData({ ...formData, offre_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une offre" />
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                
          <DialogFooter>
            <Button type="submit" disabled={!isValid.add}>
              {initialData ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};