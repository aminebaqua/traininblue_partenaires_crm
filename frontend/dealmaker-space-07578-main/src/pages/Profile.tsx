import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  phone: string | null;
  company: string | null;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    email: "",
    first_name: "",
    last_name: "",
    date_joined: "",
    phone: "",
    company: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get the current user's profile from Django REST API
      const response = await fetch('/api/users/current/profile/');
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du profil");
      }

      const userData = await response.json();
      setProfile(userData);

    } catch (error: any) {
      toast.error("Erreur lors du chargement du profil");
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
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
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-foreground font-medium">{profile.email || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Prénom</Label>
                <p className="text-foreground font-medium">{profile.first_name || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Nom</Label>
                <p className="text-foreground font-medium">{profile.last_name || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Téléphone</Label>
                <p className="text-foreground font-medium">{profile.phone || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Entreprise</Label>
                <p className="text-foreground font-medium">{profile.company || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Date d'inscription</Label>
                <p className="text-foreground font-medium">
                  {profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('fr-FR') : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;