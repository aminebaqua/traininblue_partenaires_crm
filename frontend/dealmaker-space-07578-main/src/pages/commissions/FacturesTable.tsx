

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Facture {
  id: number;
  numero_facture: string;
  montant_ht: number;
  montant_ttc: number;
  date_facture: string;
  statut_paiement: string;
  fichier: string | null;
}

const fetchFactures = async (): Promise<Facture[]> => {
  const response = await apiClient.get("/factures/");
  return response.data.results || response.data;
};

function FactureRow({ facture }: { facture: Facture }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("fichier", file);

    try {
      await apiClient.post(`/factures/${facture.id}/upload_file/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Invalidate the query to refetch the data
      await queryClient.invalidateQueries({ queryKey: ["factures"] });
    } catch (error) {
      console.error("Error uploading file:", error);
      // You might want to show a toast notification here
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "pending": return "secondary";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  return (
    <TableRow key={facture.id}>
      <TableCell>{facture.numero_facture}</TableCell>
      <TableCell>{new Date(facture.date_facture).toLocaleDateString()}</TableCell>
      <TableCell>{facture.montant_ht} €</TableCell>
      <TableCell>{facture.montant_ttc} €</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(facture.statut_paiement)}>
          {facture.statut_paiement}
        </Badge>
      </TableCell>
      <TableCell>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.png" 
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={!!facture.fichier || isUploading}
          size="sm"
        >
          {isUploading ? "Uploading..." : (facture.fichier ? "Fichier joint" : "Uploader fichier")}
        </Button>
      </TableCell>
    </TableRow>
  );
}


function FacturesTable() {
  const { data: factures, isLoading, isError, error } = useQuery<Facture[]>({
    queryKey: ["factures"],
    queryFn: fetchFactures,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-red-500">Error fetching factures: {error.message}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro Facture</TableHead>
          <TableHead>Date Facture</TableHead>
          <TableHead>Montant HT</TableHead>
          <TableHead>Montant TTC</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {factures?.map((facture) => (
          <FactureRow key={facture.id} facture={facture} />
        ))}
      </TableBody>
    </Table>
  );
}

export default FacturesTable;

