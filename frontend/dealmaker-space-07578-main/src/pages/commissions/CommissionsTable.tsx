import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Deal } from "../deals/types"; // Import your existing types

// Define Facture interface based on your backend, including the new file field
interface Facture {
  id: number;
  numero_facture: string;
  montant_ht: number;
  montant_ttc: number;
  date_facture: string;
  date_echeance: string | null;
  statut_paiement: string;
  commercial_name: string;
  deals: Deal[];
  created_at: string;
  fichier: string | null; // Added file field
}

// Fetch commissions (won deals without invoices)
const fetchCommissions = async (): Promise<Deal[]> => {
  const response = await apiClient.get("/deals/commissions/");
  return response.data.results || response.data;
};

// Fetch invoices
const fetchFactures = async (): Promise<Facture[]> => {
  const response = await apiClient.get("/factures/");
  return response.data.results || response.data;
};

// Create invoice from selected deals
const createFacture = async (dealIds: string[]): Promise<Facture> => {
  const response = await apiClient.post("/deals/create_facture_from_deals/", {
    deal_ids: dealIds.map(id => parseInt(id)) // Convert string IDs to numbers for backend
  });
  return response.data;
};

function CommissionsPage() {
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFactureId, setUploadingFactureId] = useState<number | null>(null);

  // Fetch commissions data
  const { data: deals, isLoading: dealsLoading, isError: dealsError, error } = useQuery<Deal[]>({
    queryKey: ["commissions"],
    queryFn: fetchCommissions,
  });

  // Fetch invoices data
  const { data: factures, isLoading: facturesLoading } = useQuery<Facture[]>({
    queryKey: ["factures"],
    queryFn: fetchFactures,
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ factureId, file }: { factureId: number; file: File }) => {
      const formData = new FormData();
      formData.append("fichier", file);
      const response = await apiClient.post(`/factures/${factureId}/upload_file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      toast({ 
        title: "Fichier uploadé avec succès",
        description: "Le fichier a été uploadé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'upload",
        description: error.response?.data?.error || "Une erreur est survenue lors de l'upload du fichier.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploadingFactureId(null);
    }
  });

  // Create invoice mutation
  const createFactureMutation = useMutation({
    mutationFn: createFacture,
    onSuccess: (newFacture) => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      setSelectedDeals([]);
      toast({
        title: "Facture créée avec succès",
        description: `Facture ${newFacture.numero_facture} a été créée.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la création de la facture",
        variant: "destructive",
      });
    },
  });

  // Filter deals that have client payment
  const dealsWithClientPayment = deals?.filter(deal => deal.date_paiment_client) || [];

  // Handle individual deal selection
  const handleSelectDeal = (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId) 
        : [...prev, dealId]
    );
  };

  // Handle select all deals with client payment
  const handleSelectAll = (checked: boolean) => {
    if (dealsWithClientPayment.length === 0) return;
    
    if (checked) {
      setSelectedDeals(dealsWithClientPayment.map(deal => deal.id));
    } else {
      setSelectedDeals([]);
    }
  };

  // Handle create invoice
  const handleCreateFacture = () => {
    if (selectedDeals.length === 0) {
      toast({
        title: "Aucun deal sélectionné",
        description: "Veuillez sélectionner au moins un deal pour créer une facture.",
        variant: "destructive",
      });
      return;
    }
    createFactureMutation.mutate(selectedDeals);
  };
  
  // Handle upload button click
  const handleUploadClick = (factureId: number) => {
    setUploadingFactureId(factureId);
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadingFactureId) {
      uploadFileMutation.mutate({ factureId: uploadingFactureId, file });
    }
    // Reset file input
    if (event.target) event.target.value = "";
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("fr-FR", { 
      style: "currency", 
      currency: "EUR" 
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "pending": return "secondary";
      case "overdue": return "destructive";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Payée";
      case "pending": return "En attente";
      case "overdue": return "En retard";
      case "cancelled": return "Annulée";
      default: return status;
    }
  };

  // Get company name from deal
  const getCompanyName = (deal: Deal): string => {
    if (deal.nom_entreprise) return deal.nom_entreprise;
    if (deal.lead_info?.company_name) return deal.lead_info.company_name;
    if (deal.relation_info?.lead_company) return deal.relation_info.lead_company;
    return "N/A";
  };

  // Check if all eligible deals are selected
  const isAllSelected = dealsWithClientPayment.length > 0 && 
    selectedDeals.length === dealsWithClientPayment.length;

  // Check if some eligible deals are selected
  const isSomeSelected = selectedDeals.length > 0 && 
    selectedDeals.length < dealsWithClientPayment.length;

  if (dealsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Erreur lors du chargement des commissions: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hidden file input for uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        style={{ display: 'none' }} 
        accept=".pdf,.doc,.docx,.jpg,.png" 
      />
      
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
        </TabsList>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Deals Gagnés</CardTitle>
                  <CardDescription>
                    Sélectionnez les deals avec paiement client pour créer une facture.
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleCreateFacture} 
                  disabled={selectedDeals.length === 0 || createFactureMutation.isPending}
                >
                  {createFactureMutation.isPending ? "Création..." : `Créer Facture (${selectedDeals.length})`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                          className="rounded-none"
                        />
                      </TableHead>
                      <TableHead>Nom du Deal</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Remporté le</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Taux Commission</TableHead>
                      <TableHead>Paiement Client</TableHead>
                      <TableHead>Paiement Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals?.map((deal) => {
                      const hasPayment = !!deal.date_paiment_client;
                      const isSelected = selectedDeals.includes(deal.id);
                      
                      return (
                        <TableRow 
                          key={deal.id} 
                          className={hasPayment ? "" : "opacity-50 bg-muted/50"}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => hasPayment && handleSelectDeal(deal.id)}
                              disabled={!hasPayment}
                              aria-label={`Select deal ${deal.nom_deal}`}
                              className="rounded-none"
                            />
                          </TableCell>
                          <TableCell className={`font-medium ${!hasPayment ? "text-muted-foreground" : ""}`}>
                            {deal.nom_deal}
                          </TableCell>
                          <TableCell className={!hasPayment ? "text-muted-foreground" : ""}>
                            {getCompanyName(deal)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={deal.type_deal === "one_shot" ? "default" : "secondary"}
                              className={!hasPayment ? "opacity-50" : ""}
                            >
                              {deal.type_deal === "one_shot" ? "One-shot" : "Durable"}
                            </Badge>
                          </TableCell>
                          <TableCell className={!hasPayment ? "text-muted-foreground" : ""}>
                            {formatDate(deal.remporte_le)}
                          </TableCell>
                          <TableCell className={!hasPayment ? "text-muted-foreground" : ""}>
                            {formatCurrency(deal.montant)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={!hasPayment ? "opacity-50" : ""}
                            >
                              {deal.taux_commission !== null ? `${deal.taux_commission}%` : "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className={!hasPayment ? "text-muted-foreground" : ""}>
                            {hasPayment ? (
                              formatDate(deal.date_paiment_client)
                            ) : (
                              <span className="text-red-500 font-medium">En attente</span>
                            )}
                          </TableCell>
                          <TableCell className={!hasPayment ? "text-muted-foreground" : ""}>
                            {formatDate(deal.date_paiment_commission)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {deals?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Aucun deal gagné disponible pour la commission
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factures Tab */}
        <TabsContent value="factures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factures Créées</CardTitle>
              <CardDescription>
                Liste de toutes vos factures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {facturesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro Facture</TableHead>
                      <TableHead>Commercial</TableHead>
                      <TableHead>Date Facture</TableHead>
                      <TableHead>Montant HT</TableHead>
                      <TableHead>Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Nombre de Deals</TableHead>
                      <TableHead>Fichier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures?.map((facture) => (
                      <TableRow key={facture.id}>
                        <TableCell className="font-mono font-medium">
                          {facture.numero_facture}
                        </TableCell>
                        <TableCell>{facture.commercial_name}</TableCell>
                        <TableCell>{formatDate(facture.date_facture)}</TableCell>
                        <TableCell>{formatCurrency(facture.montant_ht)}</TableCell>
                        <TableCell>{formatCurrency(facture.montant_ttc)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(facture.statut_paiement)}>
                            {getStatusLabel(facture.statut_paiement)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {facture.deals?.length || 0}
                        </TableCell>
                        <TableCell>
                          {facture.fichier ? (
                            <Button asChild variant="link" size="sm">
                              <a 
                                href={facture.fichier} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                Voir fichier
                              </a>
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleUploadClick(facture.id)} 
                              disabled={uploadFileMutation.isPending && uploadingFactureId === facture.id} 
                              size="sm"
                              variant="outline"
                            >
                              {uploadFileMutation.isPending && uploadingFactureId === facture.id ? "Upload..." : "Uploader"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {factures?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucune facture créée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CommissionsPage;