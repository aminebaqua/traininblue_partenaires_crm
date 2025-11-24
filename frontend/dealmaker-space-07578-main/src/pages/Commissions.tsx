import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Deal {
  id: string;
  deal_name: string;
  commission_plan: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_amount: number;
  commission_rate: number;
  commission_amount: number;
  invoice_date: string;
  payment_status: string;
  deals: {
    deal_name: string;
  } | null;
}

const Commissions = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    deal_id: "",
    invoice_number: "",
    invoice_amount: "",
    invoice_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          deals (
            deal_name
          )
        `)
        .eq("commercial_id", user.id)
        .order("invoice_date", { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Load won deals for the dropdown
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select("id, deal_name, commission_plan")
        .eq("commercial_id", user.id)
        .eq("stage", "gagné");

      if (dealsError) throw dealsError;
      setDeals(dealsData || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = (amount: number, plan: string) => {
    const rates: Record<string, number> = {
      plan_30: 0.30,
      plan_20: 0.20,
      plan_25_20: 0.25, // For simplicity, using 25% as base rate
    };
    return amount * (rates[plan] || 0.30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const selectedDeal = deals.find((d) => d.id === formData.deal_id);
      if (!selectedDeal) throw new Error("Deal non trouvé");

      const invoiceAmount = Number(formData.invoice_amount);
      const commissionRate = Number(
        selectedDeal.commission_plan === "plan_30" ? 30 :
        selectedDeal.commission_plan === "plan_20" ? 20 : 25
      );
      const commissionAmount = calculateCommission(invoiceAmount, selectedDeal.commission_plan);

      const { error } = await supabase.from("invoices").insert({
        deal_id: formData.deal_id,
        commercial_id: user.id,
        invoice_number: formData.invoice_number,
        invoice_amount: invoiceAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        invoice_date: formData.invoice_date,
        payment_status: "pending",
      });

      if (error) throw error;

      toast.success("Facture ajoutée avec succès !");
      setDialogOpen(false);
      setFormData({
        deal_id: "",
        invoice_number: "",
        invoice_amount: "",
        invoice_date: new Date().toISOString().split("T")[0],
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de la facture");
    }
  };

  const totalCommissions = invoices.reduce(
    (sum, inv) => sum + Number(inv.commission_amount),
    0
  );

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
            <h1 className="text-4xl font-bold text-foreground">Commissions</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos factures et suivez vos commissions
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-elegant">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une facture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une facture</DialogTitle>
                <DialogDescription>
                  Saisissez les détails de la facture pour calculer automatiquement la commission
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deal_id">Deal associé *</Label>
                  <Select value={formData.deal_id} onValueChange={(value) => setFormData({ ...formData, deal_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un deal" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.deal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Numéro de facture *</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_amount">Montant de la facture (€) *</Label>
                  <Input
                    id="invoice_amount"
                    type="number"
                    step="0.01"
                    value={formData.invoice_amount}
                    onChange={(e) => setFormData({ ...formData, invoice_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Date de facture *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter la facture</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Total des commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent">
              {totalCommissions.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} €
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Historique des factures</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.deals?.deal_name || "-"}</TableCell>
                    <TableCell>
                      {new Date(invoice.invoice_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.invoice_amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })} €
                    </TableCell>
                    <TableCell className="text-right">{invoice.commission_rate}%</TableCell>
                    <TableCell className="text-right font-medium text-accent">
                      {invoice.commission_amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invoices.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Aucune facture pour le moment
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Commissions;
