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
import { Plus, Euro, Percent, FileText, CalendarFold, Building, NotebookTabs, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api";

interface Deal {
  id: string;
  nom_deal: string;
  nom_entreprise: string;
  stage: string;
  type_deal: string;
  montant: number | null;
  notes: string | null;
  remporte_le: string | null;
  created_at: string;
  updated_at: string;
  plan_commission: string | null;
  taux_commission: number | null;
  relation: string;
  facture?: string;
  relation_info?: RelationInfo;
}

interface OffreInfo {
  id: string;
  nom: string;
  plan_commission: string | null;
  taux_commission: number | null;
}

interface RelationInfo {
  id: string;
  commercial: string;
  lead_company: string;
  lead_contact: string;
  offre_nom: string;
  offre_info: OffreInfo | null;
}

interface Lead {
  id: string;
  contact_name: string;
  company_name: string;
}

const Deals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    nom_deal: "",
    stage: "prospection",
    type_deal: "one_shot",
    montant: "",
    notes: "",
    relation: "",
  });

  // Search state for leads
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  useEffect(() => {
    loadDeals();
    loadAvailableLeads();
  }, []);

  // Filter leads based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLeads(leads);
    } else {
      const filtered = leads.filter(lead =>
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeads(filtered);
    }
  }, [searchTerm, leads]);

  const loadDeals = async () => {
    try {
      const response = await apiClient.get('/deals/');
      setDeals(response.data);
    } catch (error: any) {
      console.error('Error loading deals:', error);
      toast.error(error.response?.data?.error || "Erreur lors du chargement des deals");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableLeads = async () => {
    try {
      const response = await apiClient.get('/deals/available_leads/');
      setLeads(response.data);
      setFilteredLeads(response.data); // Initialize filtered leads
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast.error("Erreur lors du chargement des leads");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom_deal.trim()) {
      toast.error("Le nom du deal est obligatoire");
      return;
    }
    
    if (!formData.relation) {
      toast.error("La relation commerciale est obligatoire");
      return;
    }
    
    try {
      const payload = {
        nom_deal: formData.nom_deal.trim(),
        stage: formData.stage,
        type_deal: formData.type_deal,
        montant: formData.montant ? parseFloat(formData.montant) : null,
        notes: formData.notes?.trim() || null,
        relation: formData.relation,
      };

      const response = await apiClient.post('/deals/', payload);
      console.log('Deal created successfully:', response.data);

      toast.success("Deal créé avec succès !");
      setDialogOpen(false);
      
      setFormData({
        nom_deal: "",
        stage: "prospection",
        type_deal: "one_shot",
        montant: "",
        notes: "",
        relation: "",
      });
      
      // Clear search when form is submitted
      setSearchTerm('');
      
      loadDeals();
    } catch (error: any) {
      console.error('Error creating deal:', error);
      
      if (error.response?.data?.details) {
        const errorDetails = error.response.data.details;
        const firstError = Object.values(errorDetails)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(error.response?.data?.error || "Erreur lors de la création du deal");
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospection: "bg-blue-100 text-blue-800 border-blue-200",
      negociation: "bg-orange-100 text-orange-800 border-orange-200",
      gagne: "bg-green-100 text-green-800 border-green-200",
      perdu: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[stage] || colors.prospection;
  };

  const getTypeDealLabel = (typeDeal: string) => {
    const labels: Record<string, string> = {
      one_shot: "One-shot",
      durable: "Durable",
    };
    return labels[typeDeal] || typeDeal;
  };

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggedDeal) return;

    try {
      await apiClient.patch(`/deals/${draggedDeal}/`, {
        stage: newStage
      });

      toast.success("Deal déplacé avec succès !");
      loadDeals();
    } catch (error: any) {
      console.error('Error moving deal:', error);
      toast.error(error.response?.data?.error || "Erreur lors du déplacement du deal");
    } finally {
      setDraggedDeal(null);
    }
  };

  const getPlanCommissionLabel = (plan: string | null) => {
    const labels: Record<string, string> = {
      standard: "Standard",
      premium: "Premium",
      enterprise: "Enterprise",
      custom: "Personnalisé",
      one_shot: "One-shot",
      durable: "Durable",
    };
    return plan ? labels[plan] || plan : "Non défini";
  };

  const calculateCommission = (montant: number | null, taux: number | null) => {
    if (!montant || !taux) return null;
    return (montant * taux) / 100;
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      prospection: "Prospection",
      negociation: "Négociation", 
      gagne: "Gagné",
      perdu: "Perdu",
    };
    return labels[stage] || stage;
  };

  const toggleDealExpansion = (dealId: string) => {
    setExpandedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const groupedDeals = {
    prospection: deals.filter((d) => d.stage === "prospection"),
    negociation: deals.filter((d) => d.stage === "negociation"),
    gagne: deals.filter((d) => d.stage === "gagne"),
    perdu: deals.filter((d) => d.stage === "perdu"),
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Pipeline des Deals</h1>
            <p className="text-muted-foreground mt-2">
              Suivez l'avancement de vos opportunités
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-elegant">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau deal</DialogTitle>
                <DialogDescription>
                  Remplissez les informations de l'opportunité
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom_deal">Nom du deal *</Label>
                    <Input
                      id="nom_deal"
                      value={formData.nom_deal}
                      onChange={(e) => setFormData({ ...formData, nom_deal: e.target.value })}
                      placeholder="Ex: Contrat annuel, Projet spécial..."
                      required
                    />
                  </div>
                </div>

                {/* Lead Search Select */}
                <div className="space-y-2">
                  <Label htmlFor="lead">Lead *</Label>
                  <Select 
                    value={formData.relation} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, relation: value });
                      clearSearch(); // Clear search when a lead is selected
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rechercher un lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Rechercher par entreprise ou contact..."
                            className="h-8 flex-1"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {searchTerm && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={clearSearch}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {filteredLeads.length} lead(s) trouvé(s)
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium text-sm">{lead.contact_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {lead.company_name}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <div>🚫</div>
                            <div className="mt-1">
                              {searchTerm ? 'Aucun lead trouvé pour "' + searchTerm + '"' : 'Aucun lead disponible'}
                            </div>
                            {searchTerm && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={clearSearch}
                              >
                                Effacer la recherche
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stage">Étape</Label>
                    <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospection">Prospection</SelectItem>
                        <SelectItem value="negociation">Négociation</SelectItem>
                        <SelectItem value="gagne">Gagné</SelectItem>
                        <SelectItem value="perdu">Perdu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type_deal">Type de deal *</Label>
                    <Select value={formData.type_deal} onValueChange={(value) => setFormData({ ...formData, type_deal: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_shot">One-shot</SelectItem>
                        <SelectItem value="durable">Durable</SelectItem>
                      </SelectContent>
                    </Select>
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
                    />
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
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Créer le deal</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rest of your existing JSX for deals pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Object.entries(groupedDeals).map(([stage, stageDeals]) => (
            <div 
              key={stage} 
              className="space-y-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {getStageLabel(stage)}
                <Badge variant="secondary">{stageDeals.length}</Badge>
              </h3>
              <div className="space-y-3 min-h-[200px] p-2 rounded-lg transition-colors bg-muted/20">
                {stageDeals.map((deal) => {
                  const isExpanded = expandedDeals.has(deal.id);
                  const planCommission = deal.plan_commission || deal.relation_info?.offre_info?.plan_commission;
                  const tauxCommission = deal.taux_commission || deal.relation_info?.offre_info?.taux_commission;
                  const commissionPotentielle = calculateCommission(deal.montant, tauxCommission);

                  return (
                    <Card 
                      key={deal.id} 
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move transition-all border-2 ${
                        draggedDeal === deal.id ? 'opacity-50' : ''
                      } ${getStageColor(deal.stage)}`}
                    >
                      <CardHeader 
                        className="pb-3 cursor-pointer" 
                        onClick={() => toggleDealExpansion(deal.id)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{deal.nom_deal}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDealExpansion(deal.id);
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
                          <div className="flex items-center gap-1 text-xs">
                            <Building className="h-3 w-3 text-blue-500" />
                            <span className="text-muted-foreground">Entreprise:</span>
                            <span className="font-medium">{deal.nom_entreprise}</span>
                          </div>

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
                })}
                {stageDeals.length === 0 && (
                  <Card className="border-dashed bg-gray-50/50">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Aucun deal
                      <p className="text-xs mt-1">Déposez un deal ici</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Deals;