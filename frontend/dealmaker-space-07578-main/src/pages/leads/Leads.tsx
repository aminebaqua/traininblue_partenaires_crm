// components/leads/Leads.tsx
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api";

// Import des composants
import { LeadList } from "./LeadList";
import { LeadForm } from "./LeadForm";
import { LeadEditForm } from "./LeadEditForm";
import { ActionsDialog } from "./ActionsDialog";
import { ActionForm } from "./ActionForm";

// Import des types et utilitaires
import { 
  Lead, 
  Action, 
  ActionFormData, 
  LeadFormData 
} from "./utils/leadTypes";

const Leads = () => {
  // États principaux
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [offres, setOffres] = useState<any[]>([]);
  
  // États pour les dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLeadFormOpen, setEditLeadFormOpen] = useState(false);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [actionFormOpen, setActionFormOpen] = useState(false);
  
  // États pour la sélection
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [leadActions, setLeadActions] = useState<Action[]>([]);
  
  // États pour la soumission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chargement initial
  useEffect(() => {
    loadLeads();
    loadAvailableOffres();
  }, []);

  // Fonctions de chargement
  const loadLeads = async () => {
  setLoading(true);
  try {
    console.log("🔄 Loading leads from:", '/leads/');
    const response = await apiClient.get('/leads/');
    console.log("✅ Full response object:", response);
    
    if (response.data && Array.isArray(response.data)) {
      setLeads(response.data);
      console.log("✅ Leads loaded as array:", response.data.length);
    } else if (response.data && response.data.results) {
      setLeads(response.data.results);
      console.log("✅ Leads loaded with pagination:", response.data.results.length);
    } else if (response.data && response.data.leads) {
      setLeads(response.data.leads);
      console.log("✅ Leads loaded with 'leads' key:", response.data.leads.length);
    } else {
      console.error("❌ Unknown response structure:", response.data);
      toast.error("Format de réponse inattendu");
    }
  } catch (error: any) {
    console.error('❌ Full error object:', error);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error data:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error headers:', error.response?.headers);
    
    // Afficher plus de détails sur l'erreur
    if (error.response?.data) {
      console.error('❌ Server error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    toast.error(error.response?.data?.error || "Erreur serveur (500)");
  } finally {
    setLoading(false);
  }
};

// *****************************************************************************
  const loadAvailableOffres = async () => {
    try {
      const response = await apiClient.get('/leads/available-offres/');
      setOffres(response.data);
    } catch (error: any) {
      console.error('Error loading offres:', error);
      toast.error("Erreur lors du chargement des offres");
    }
  };

  const loadLeadActions = async (leadId: string) => {
    try {
      const response = await apiClient.get(`/actions/?lead=${leadId}`);
      setLeadActions(response.data);
    } catch (error: any) {
      console.error('Error loading actions:', error);
      toast.error(error.response?.data?.error || "Erreur lors du chargement des actions");
    }
  };

  // Gestion des leads
  const handleSubmitLead = async (formData: LeadFormData) => {
    try {
      const payload = {
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone || null,
        siret: formData.siret || null,
        status: formData.status,
        notes: formData.notes || null,
        offre_id: formData.offre_id,
      };
      
      await apiClient.post('/leads/', payload);
      toast.success("Lead créé avec succès !");
      setDialogOpen(false);
      loadLeads();
    } catch (error: any) {
      console.error('❌ Error creating lead:', error);
      if (error.response?.data?.details) {
        const firstError = Object.values(error.response.data.details)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(error.response?.data?.error || "Erreur lors de la création du lead");
      }
    }
  };

  const handleSubmitEditLead = async (formData: LeadFormData) => {
    if (!editingLead) return;

    try {
      const payload = {
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone || null,
        siret: formData.siret || null,
        status: formData.status,
        notes: formData.notes || null,
        offre_id: formData.offre_id,
      };

      await apiClient.put(`/leads/${editingLead.id}/`, payload);
      toast.success("Lead modifié avec succès !");
      setEditLeadFormOpen(false);
      setEditingLead(null);
      loadLeads();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error(error.response?.data?.error || "Erreur lors de la modification du lead");
    }
  };

  // Gestion des actions
  const handleSubmitAction = async (formData: ActionFormData) => {
    if (!selectedLead || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const payload: any = {
        lead: selectedLead.id,
        action_type: formData.action_type,
        date_echeance: new Date(formData.date_echeance).toISOString(),
        titre: formData.titre,
        notes: formData.notes || null,
        priorite: formData.priorite,
        statut: formData.statut,
      };
      console.log("payload====>",payload )
      if (editingAction) {
        await apiClient.put(`/actions/${editingAction.id}/`, payload);
        toast.success("Action mise à jour !");
      } else {
        await apiClient.post('/actions/', payload);
        toast.success("Action créée !");
      }

      setActionFormOpen(false);
      setEditingAction(null);
      loadLeadActions(selectedLead.id);
    } catch (error: any) {
      console.error('Error saving action:', error);
      if (error.response?.data?.details) {
        const firstError = Object.values(error.response.data.details)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(error.response?.data?.error || "Erreur lors de l'enregistrement de l'action");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers pour les interactions
  const handleOpenActions = (lead: Lead) => {
    setSelectedLead(lead);
    loadLeadActions(lead.id);
    setActionsDialogOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditLeadFormOpen(true);
  };

  const handleOpenActionForm = (action?: Action) => {
    if (action) {
      setEditingAction(action);
    } else {
      setEditingAction(null);
    }
    setActionFormOpen(true);
  };

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
            <LeadForm
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSubmit={handleSubmitLead}
              offres={offres}
            />
          </Dialog>
        </div>

        {/* Liste des leads */}
        <LeadList
          leads={leads}
          onOpenActions={handleOpenActions}
          onOpenEdit={handleOpenEdit}
        />

        {/* Dialogs */}
        <LeadEditForm
          open={editLeadFormOpen}
          onOpenChange={setEditLeadFormOpen}
          onSubmit={handleSubmitEditLead}
          offres={offres}
          editingLead={editingLead}
        />

        <ActionsDialog
          open={actionsDialogOpen}
          onOpenChange={setActionsDialogOpen}
          selectedLead={selectedLead}
          leadActions={leadActions}
          onOpenActionForm={handleOpenActionForm}
          onMarkActionDone={handleMarkActionDone}
          onMarkActionCancelled={handleMarkActionCancelled}
          onDeleteAction={handleDeleteAction}
        />

        <ActionForm
          open={actionFormOpen}
          onOpenChange={setActionFormOpen}
          onSubmit={handleSubmitAction}
          selectedLead={selectedLead}
          editingAction={editingAction}
          isSubmitting={isSubmitting}
        />
      </div>
    </Layout>
  );
};

export default Leads;