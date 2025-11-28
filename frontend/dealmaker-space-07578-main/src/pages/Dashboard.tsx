import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
import apiClient from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeDeals: 0,
    wonDeals: 0,
  });


// ***********************************************************
//const [stats, setStats] = useState<any>({});
const [authError, setAuthError] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setdata] = useState([]);

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Exécuter les deux requêtes en parallèle
      const [statsResponse] = await Promise.all([
        apiClient.get('/dashboard-stats/'),
      ]);

      setStats(statsResponse.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, []);

// Afficher un message d'erreur si auth échoue
if (authError) {
  return (
    <div className="p-4 bg-red-100 text-red-700 rounded">
      ❌ Session expirée. Veuillez vous reconnecter.
    </div>
  );
}
// ***********************************************************
  const statCards = [
    {
      title: "Leads totaux",
      value: stats.totalLeads,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Deals actifs",
      value: stats.activeDeals,
      icon: Briefcase,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Deals gagnés",
      value: stats.wonDeals,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },

  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de votre activité commerciale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-elegant hover:shadow-glow transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Bienvenue sur Traininblue Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gérez efficacement vos leads, deals et commissions depuis cette plateforme.
              Utilisez le menu de navigation pour accéder aux différentes sections.
            </p>
          </CardContent>
        </Card>

      </div>
    </Layout>


  );
};

export default Dashboard;
