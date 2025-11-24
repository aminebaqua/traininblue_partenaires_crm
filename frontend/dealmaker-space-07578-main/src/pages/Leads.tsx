// Leads.tsx
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Building2, Users, Calendar, Edit, History, Loader2, 
         FileText, Trash2, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api";
import { Lead, LeadsResponse } from "@/services/lead_service"; // ✅ Utilisation directe de vos types existants

interface Action {
  id: string;
  lead: string;
  commercial: string;
  action_type: string;
  date_echeance: string;
  realise_le: string | null;
  titre: string;
  notes: string | null;
  priorite: string;
  statut: string;
  created_at: string;
  updated_at: string;
  commercial_name?: string;
  lead_company?: string;
  lead_contact?: string;
}

interface ActionFormData {
  action_type: string;
  date_echeance: string;
  titre: string;
  notes: string;
  priorite: string;
  statut: string;
  realise_le?: string;
}


const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  // const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  // const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  // const [leadActions, setLeadActions] = useState<Action[]>([]);
  // const [actionFormOpen, setActionFormOpen] = useState(false);
  // const [editingAction, setEditingAction] = useState<Action | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    siret: "",
    status: "nouveau",
    notes: "",
  });

const [leadActions, setLeadActions] = useState<Action[]>([]);
const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
const [actionFormOpen, setActionFormOpen] = useState(false);
const [editingAction, setEditingAction] = useState<Action | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [actionFormData, setActionFormData] = useState<ActionFormData>({
  action_type: "email",
  date_echeance: new Date().toISOString().slice(0, 19).replace('T', ' '),
  titre: "",
  notes: "",
  priorite: "medium",
  statut: "en_attente",
});
// *****************************************************
const [editingLead, setEditingLead] = useState<any>(null);
const [editLeadFormOpen, setEditLeadFormOpen] = useState(false);
const [editLeadFormData, setEditLeadFormData] = useState({
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  siret: "",
  status: "nouveau",
  notes: "",
});
// *****************************************************
  useEffect(() => {
    loadLeads();
  }, []);
//  *******************************Afficher la liste des leads***********************************
  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<LeadsResponse>('/leads/'); // ✅ Typage direct
      console.error(' success::::', response.data);
      if (response.data.success) {
        setLeads(response.data.leads);

        console.error(' setLeads::::', Leads);
      } else {
        toast.error(response.data.error || "Erreur lors du chargement des leads");
      }
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast.error(error.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };
// ********************************Ajouter un Lead*************************************
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // ✅ CORRECT - Utiliser les mêmes noms que le serializer Django
    const payload = {
      company_name: formData.company_name,
      contact_name: formData.contact_name,
      email: formData.email,
      phone: formData.phone || null,
      siret: formData.siret || null,
      status: formData.status,
      notes: formData.notes || null,
    };
    console.log("playload====>", payload)
    await apiClient.post('/leads/', payload);
    
    toast.success("Lead créé avec succès !");
    setDialogOpen(false);
    // Réinitialisation
    setFormData({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      siret: "",
      status: "nouveau", // Note: minuscule pour correspondre aux valeurs du Select
      notes: "",
    });
    loadLeads();
  } catch (error: any) {
    console.error('Error creating lead:', error);
    toast.error(error.response?.data?.error || "Erreur lors de la création du lead");
  }
};
// **************************************Modifier un Lead************************************************
const handleOpenEditLeadForm = (lead: any) => {
  setEditingLead(lead);
  setEditLeadFormData({
    company_name: lead.company_name,
    contact_name: lead.contact_name,
    email: lead.email,
    phone: lead.phone || "",
    siret: lead.siret || "",
    status: lead.status,
    notes: lead.notes || "",
  });
  setEditLeadFormOpen(true);
};

const handleSubmitEditLead = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingLead) return;

  try {
    const payload = {
      company_name: editLeadFormData.company_name,
      contact_name: editLeadFormData.contact_name,
      email: editLeadFormData.email,
      phone: editLeadFormData.phone || null,
      siret: editLeadFormData.siret || null,
      status: editLeadFormData.status,
      notes: editLeadFormData.notes || null,
    };
    console.log("editlead===>", payload)

    await apiClient.put(`/leads/${editingLead.id}/`, payload);
    
    toast.success("Lead modifié avec succès !");
    setEditLeadFormOpen(false);
    setEditingLead(null);
    
    // Recharger les données
    loadLeads();
  } catch (error: any) {
    console.error('Error updating lead:', error);
    toast.error(error.response?.data?.error || "Erreur lors de la modification du lead");
  }
};
// **************************************Aficcher la lite des Actions d'un Lead****************************************************
  // Charger les actions d'un lead
const loadLeadActions = async (leadId: string) => {
  try {
    const response = await apiClient.get(`/actions/?lead=${leadId}`);
    setLeadActions(response.data);
  } catch (error: any) {
    console.error('Error loading actions:', error);
    toast.error(error.response?.data?.error || "Erreur lors du chargement des actions");
  }
};

// Ouvrir le dialog des actions
const handleOpenActions = (lead: Lead) => {
  setSelectedLead(lead);
  loadLeadActions(lead.id);
  setActionsDialogOpen(true);
};

// Ouvrir le formulaire d'action
const handleOpenActionForm = (action?: Action) => {
  if (action) {
    setEditingAction(action);
    setActionFormData({
      action_type: action.action_type,
      date_echeance: new Date(action.date_echeance).toISOString().slice(0, 19).replace('T', ' '),
      titre: action.titre,
      notes: action.notes || "",
      priorite: action.priorite,
      statut: action.statut,
    });
  } else {
    setEditingAction(null);
    setActionFormData({
      action_type: "email",
      date_echeance: new Date().toISOString().slice(0, 19).replace('T', ' '),
      titre: `Action email - ${new Date().toLocaleDateString('fr-FR')}`,
      notes: "",
      priorite: "medium",
      statut: "en_attente",
    });
  }
  setActionFormOpen(true);
};

// Soumettre le formulaire d'action
const handleSubmitAction = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedLead || isSubmitting) return;
  
  setIsSubmitting(true);
  
  try {
    const payload: any = {
      lead: selectedLead.id,
      action_type: actionFormData.action_type,
      date_echeance: new Date(actionFormData.date_echeance).toISOString(),
      titre: actionFormData.titre,
      notes: actionFormData.notes || null,
      priorite: actionFormData.priorite,
      statut: actionFormData.statut,
    };


    if (editingAction) {
      await apiClient.put(`/actions/${editingAction.id}/`, payload);
      toast.success("Action mise à jour !");
    } else {
      await apiClient.post('/actions/', payload);
      toast.success("Action créée !");
    }

    setActionFormOpen(false);
    resetActionForm();
    loadLeadActions(selectedLead.id);
  } catch (error: any) {
    console.error('Error saving action:', error);
    
    if (error.response?.data?.details) {
      const errorDetails = error.response.data.details;
      const firstError = Object.values(errorDetails)[0];
      toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
    } else {
      toast.error(error.response?.data?.error || "Erreur lors de l'enregistrement de l'action");
    }
  } finally {
    setIsSubmitting(false);
  }
};

// Réinitialiser le formulaire
const resetActionForm = () => {
  setActionFormData({
    action_type: "email",
    date_echeance: new Date().toISOString().slice(0, 19).replace('T', ' '),
    titre: "",
    notes: "",
    priorite: "medium",
    statut: "en_attente",
  });
  setEditingAction(null);
};
// ********************************Fonctions d'action rapide*************************************
// Marquer une action comme terminée
const handleMarkActionDone = async (actionId: string) => {
  try {
    await apiClient.post(`/actions/${actionId}/marquer_terminee/`);
    toast.success("Action marquée comme terminée !");
    if (selectedLead) {
      loadLeadActions(selectedLead.id);
    }
  } catch (error: any) {
    console.error('Error marking action as done:', error);
    toast.error(error.response?.data?.error || "Erreur lors de la mise à jour de l'action");
  }
};

// Marquer une action comme annulée
const handleMarkActionCancelled = async (actionId: string) => {
  try {
    await apiClient.post(`/actions/${actionId}/marquer_annulee/`);
    toast.success("Action annulée !");
    if (selectedLead) {
      loadLeadActions(selectedLead.id);
    }
  } catch (error: any) {
    console.error('Error marking action as cancelled:', error);
    toast.error(error.response?.data?.error || "Erreur lors de l'annulation de l'action");
  }
};

// Supprimer une action
const handleDeleteAction = async (actionId: string) => {
  try {
    await apiClient.delete(`/actions/${actionId}/`);
    toast.success("Action supprimée !");
    if (selectedLead) {
      loadLeadActions(selectedLead.id);
    }
  } catch (error: any) {
    console.error('Error deleting action:', error);
    toast.error(error.response?.data?.error || "Erreur lors de la suppression de l'action");
  }
};
// ************************************Fonctions utilitaires*********************************
// Vérifier si une action est en retard
const isActionOverdue = (dateEcheance: string) => {
  return new Date(dateEcheance) < new Date();
};

// Obtenir le libellé du type d'action
const getActionTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    call: "Appel",
    email: "Email",
    meeting: "Réunion",
    other: "Autre",
  };
  return types[type] || type;
};

// Obtenir la couleur de la priorité
const getPriorityColor = (priorite: string) => {
  const colors: Record<string, string> = {
    high: "text-red-600",
    medium: "text-orange-600",
    low: "text-green-600",
  };
  return colors[priorite] || "text-gray-600";
};

// Obtenir le libellé de la priorité
const getPriorityLabel = (priorite: string) => {
  const labels: Record<string, string> = {
    high: "Haute",
    medium: "Moyenne",
    low: "Basse",
  };
  return labels[priorite] || priorite;
};

// Obtenir le libellé du statut
const getStatusLabel = (statut: string) => {
  const labels: Record<string, string> = {
    en_attente: "En attente",
    terminee: "Terminée",
    annulee: "Annulée",
  };
  return labels[statut] || statut;
};

// Générer un titre automatique basé sur le type d'action
const generateAutoTitle = (actionType: string, lead: Lead | null) => {
  const titles: Record<string, string> = {
    call: `Appel ${lead?.contact_name || ''}`,
    email: `Email ${lead?.contact_name || ''}`,
    meeting: `RDV ${lead?.company_name || ''}`,
    other: 'Action planifiée'
  };
  return titles[actionType]?.trim() || `Action ${actionType}`;
};

// ******************************************************************************************
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nouveau: "bg-blue-100 text-blue-800 border-blue-200",
      en_cours: "bg-yellow-100 text-yellow-800 border-yellow-200",
      converti: "bg-green-100 text-green-800 border-green-200",
      perdu: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || colors.nouveau;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement des leads...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes Leads</h1>
            <p className="text-muted-foreground mt-1">
              {leads.length} lead{leads.length > 1 ? 's' : ''} au total
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau lead</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du prospect
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                        onChange={(e) => {
                          // N'autoriser que les chiffres et limiter à 9 caractères
                          const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setFormData({ ...formData, siret: onlyNumbers });
                        }}
                        placeholder="9 chiffres"
                        maxLength={9} // Limite visuelle
                      />
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Créer le lead</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des leads */}
        {leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun lead</h3>
              <p className="text-muted-foreground text-center">
                Vous n'avez pas encore de leads. Créez votre premier lead pour commencer.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        {lead.company_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.contact_name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${lead.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lead.email}
                      </a>
                    </div>
                    
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {lead.siret && (
                      <div>SIRET: {lead.siret}</div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Déclaré le {formatDate(lead.declared_at)}
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-muted-foreground bg-muted/50 p-2 rounded">
                        {lead.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenActions(lead)}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Actions
                    </Button>
                   <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenEditLeadForm(lead)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Dialog Modification Lead */}
          <Dialog open={editLeadFormOpen} onOpenChange={setEditLeadFormOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Modifier le Lead</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de {editingLead?.company_name}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmitEditLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-company_name">Entreprise *</Label>
                    <Input
                      id="edit-company_name"
                      value={editLeadFormData.company_name}
                      onChange={(e) => setEditLeadFormData({ ...editLeadFormData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contact_name">Contact *</Label>
                    <Input
                      id="edit-contact_name"
                      value={editLeadFormData.contact_name}
                      onChange={(e) => setEditLeadFormData({ ...editLeadFormData, contact_name: e.target.value })}
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
                      value={editLeadFormData.email}
                      onChange={(e) => setEditLeadFormData({ ...editLeadFormData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Téléphone</Label>
                    <Input
                      id="edit-phone"
                      value={editLeadFormData.phone}
                      onChange={(e) => setEditLeadFormData({ ...editLeadFormData, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-siret">SIRET</Label>
                    <Input
                      id="edit-siret"
                      value={editLeadFormData.siret}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setEditLeadFormData({ ...editLeadFormData, siret: onlyNumbers });
                      }}
                      placeholder="9 chiffres"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Statut</Label>
                    <Select 
                      value={editLeadFormData.status} 
                      onValueChange={(value) => setEditLeadFormData({ ...editLeadFormData, status: value })}
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
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editLeadFormData.notes}
                    onChange={(e) => setEditLeadFormData({ ...editLeadFormData, notes: e.target.value })}
                    rows={3}
                    placeholder="Notes supplémentaires..."
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditLeadFormOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    Mettre à jour
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog des Actions */}
            <Dialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Planifier une action | Renseigner une action réalisée</DialogTitle>
                  <DialogDescription>
                    Gérez les actions pour {selectedLead?.contact_name} - {selectedLead?.company_name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Button onClick={() => handleOpenActionForm()} className="w-full">
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
                        <Card key={action.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`mt-1 p-2 rounded-full ${
                                  action.action_type === 'email' ? 'bg-blue-100 text-blue-600' :
                                  action.action_type === 'call' ? 'bg-green-100 text-green-600' :
                                  action.action_type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {action.action_type === 'email' && <Mail className="h-4 w-4" />}
                                  {action.action_type === 'call' && <Phone className="h-4 w-4" />}
                                  {action.action_type === 'meeting' && <Users className="h-4 w-4" />} {/* ✅ Changé Calendar → Users */}
                                  {action.action_type === 'other' && <FileText className="h-4 w-4" />} {/* ✅ Changé History → FileText */}
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
                                      className={`text-xs ${
                                        action.priorite === 'high' ? 'border-red-200 bg-red-50 text-red-700' :
                                        action.priorite === 'medium' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                        'border-green-200 bg-green-50 text-green-700'
                                      }`}
                                    >
                                      {action.priorite === 'high' && '🔴 Haute'}
                                      {action.priorite === 'medium' && '🟡 Moyenne'}
                                      {action.priorite === 'low' && '🟢 Basse'}
                                    </Badge>
                                  </div>
                                  
                                  {action.notes && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {action.notes}
                                    </p>
                                  )}
                                  
                                  {/* ✅ AJOUT: Date de réalisation si l'action est terminée */}
                                  {action.statut === 'terminee' && action.realise_le && (
                                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Réalisée le {new Date(action.realise_le).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {/* ✅ AJOUT: Bouton pour marquer comme terminée si en attente */}
                                {action.statut === 'en_attente' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkActionDone(action.id)}
                                    title="Marquer comme terminée"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {/* ✅ AJOUT: Bouton pour annuler si en attente */}
                                {action.statut === 'en_attente' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkActionCancelled(action.id)}
                                    title="Annuler l'action"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenActionForm(action)}
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {/* ✅ AJOUT: Bouton supprimer */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAction(action.id)}
                                  title="Supprimer"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog Formulaire Action */}
            <Dialog open={actionFormOpen} onOpenChange={setActionFormOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingAction ? "Modifier l'action" : "Nouvelle Action"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedLead && `Pour ${selectedLead.company_name} - ${selectedLead.contact_name}`}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmitAction} className="space-y-4">
                  {/* Type d'action */}
                  <div className="space-y-2">
                    <Label htmlFor="action_type">Type d'action *</Label>
                    <Select 
                      value={actionFormData.action_type} 
                      onValueChange={(value) => {
                        const newFormData = { ...actionFormData, action_type: value };
                        
                        // Générer un titre automatique si c'est une nouvelle action
                        if (!editingAction && (!actionFormData.titre || actionFormData.titre.startsWith('Action'))) {
                          const titles = {
                            call: `Appel ${selectedLead?.contact_name || ''}`,
                            email: `Email ${selectedLead?.contact_name || ''}`,
                            meeting: `RDV ${selectedLead?.company_name || ''}`,
                            other: 'Action planifiée'
                          };
                          newFormData.titre = titles[value as keyof typeof titles]?.trim() || `Action ${value}`;
                        }
                        
                        setActionFormData(newFormData);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">📞 Appel téléphonique</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="meeting">👥 Réunion</SelectItem> {/* ✅ Changé l'icône */}
                        <SelectItem value="other">📝 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Titre */}
                  <div className="space-y-2">
                    <Label htmlFor="titre">Titre *</Label>
                    <Input
                      id="titre"
                      value={actionFormData.titre}
                      onChange={(e) => setActionFormData({ ...actionFormData, titre: e.target.value })}
                      placeholder="Ex: Appel de suivi, Envoi de devis..."
                      required
                    />
                  </div>
                  
                  {/* Date et heure d'échéance */}
                  <div className="space-y-2">
                    <Label htmlFor="date_echeance">Date et heure d'échéance *</Label>
                    <Input
                      id="date_echeance"
                      type="datetime-local"
                      value={actionFormData.date_echeance}
                      onChange={(e) => setActionFormData({ ...actionFormData, date_echeance: e.target.value })}
                      required
                    />
                    {actionFormData.date_echeance}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Priorité */}
                    <div className="space-y-2">
                      <Label htmlFor="priorite">Priorité</Label>
                      <Select 
                        value={actionFormData.priorite} 
                        onValueChange={(value) => setActionFormData({ ...actionFormData, priorite: value })}
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
                        value={actionFormData.statut} 
                        onValueChange={(value) => setActionFormData({ ...actionFormData, statut: value })}
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
                  
                  {/* ✅ AJOUT: Champ realise_le si statut est "terminee" */}
                  {actionFormData.statut === 'terminee' && (
                    <div className="space-y-2">
                      <Label htmlFor="realise_le">Date de réalisation</Label>
                      <Input
                        id="realise_le"
                        type="datetime-local"
                        value={actionFormData.realise_le || new Date().toISOString().slice(0, 16)}
                        
                      />
                    </div>
                  )}
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={actionFormData.notes}
                      onChange={(e) => setActionFormData({ ...actionFormData, notes: e.target.value })}
                      rows={3}
                      placeholder="Notes supplémentaires sur cette action..."
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActionFormOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Enregistrement..." : editingAction ? "Mettre à jour" : "Créer l'action"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

      </div>
    </Layout>
  );
};

export default Leads;