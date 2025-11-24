import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, XCircle, Phone, Mail, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import apiClient from "@/services/api";

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
  lead_company?: string;
  commercial_name?: string;
}

const Tasks = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      const response = await apiClient.get('/actions/');
      // Filtrer pour n'afficher que les actions en attente
      const pendingActions = response.data.filter((action: Action) => action.statut === 'en_attente');
      setActions(pendingActions);
    } catch (error: any) {
      console.error("Error loading actions:", error);
      toast.error(error.response?.data?.error || "Erreur lors du chargement des actions");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (actionId: string, newStatus: string) => {
    try {
      if (newStatus === 'terminee') {
        // Utiliser l'endpoint spécifique pour marquer comme terminée
        await apiClient.post(`/actions/${actionId}/marquer_terminee/`);
      } else {
        // Mettre à jour le statut normalement
        await apiClient.patch(`/actions/${actionId}/`, { 
          statut: newStatus 
        });
      }

      toast.success(
        newStatus === "terminee" ? "Action marquée comme terminée" : "Action annulée"
      );
      loadActions();
    } catch (error: any) {
      console.error("Error updating action:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la mise à jour de l'action");
    }
  };

  const getActionTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      call: "Appel",
      email: "Email",
      meeting: "Réunion",
      other: "Autre",
    };
    return types[type] || type;
  };

  const getActionTypeIcon = (type: string) => {
    const icons: { [key: string]: JSX.Element } = {
      call: <Phone className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      meeting: <Users className="h-4 w-4" />,
      other: <FileText className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const getPriorityLabel = (priorite: string) => {
    const priorities: { [key: string]: string } = {
      low: "Basse",
      medium: "Moyenne",
      high: "Haute",
    };
    return priorities[priorite] || priorite;
  };

  const getPriorityVariant = (priorite: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      low: "outline",
      medium: "secondary",
      high: "destructive",
    };
    return variants[priorite] || "outline";
  };

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Actions à venir</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos actions en cours et à venir
          </p>
        </div>

        {actions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucune action en cours</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => (
              <Card key={action.id} className={isOverdue(action.date_echeance) ? "border-destructive" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{action.titre}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {action.lead_company && (
                          <>
                            <span className="font-medium">
                              {action.lead_company}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <div className="flex items-center gap-2">
                          {getActionTypeIcon(action.action_type)}
                          <span>{getActionTypeLabel(action.action_type)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getPriorityVariant(action.priorite)}>
                        {getPriorityLabel(action.priorite)}
                      </Badge>
                      {isOverdue(action.date_echeance) && (
                        <Badge variant="destructive" className="text-xs">
                          En retard
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={isOverdue(action.date_echeance) ? "text-destructive font-medium" : ""}>
                          {format(new Date(action.date_echeance), "PPP", { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(action.date_echeance), "HH:mm")}
                        </span>
                      </div>
                    </div>

                    {action.notes && (
                      <p className="text-sm text-muted-foreground">{action.notes}</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(action.id, "terminee")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marquer comme terminée
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-red-00 hover:text-white"
                        onClick={() => handleToggleStatus(action.id, "annulee")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tasks;