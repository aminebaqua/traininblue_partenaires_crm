import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import apiClient from "@/services/api";
import { Deal, Lead } from "./types";
import { CreateDealDialog } from "./components/CreateDealDialog";
import { DealPipeline } from "./components/DealPipeline";
import { Plus } from "lucide-react";

const Deals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDeals();
    loadAvailableLeads();
  }, []);

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
        const response = await apiClient.get('/deals/available_relations/'); // Changé le endpoint
        setLeads(response.data);
    } catch (error: any) {
        console.error('Error loading relations:', error);
        toast.error("Erreur lors du chargement des relations");
    }
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
          <CreateDealDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            leads={leads}
            onDealCreated={loadDeals}
          >
            <Button className="shadow-elegant">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Deal
            </Button>
          </CreateDealDialog>
        </div>

        <DealPipeline deals={deals} onDealMoved={loadDeals} />
      </div>
    </Layout>
  );
};

export default Deals;