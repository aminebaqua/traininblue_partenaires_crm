import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [connexionData, setConnexionData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    company: ""
  }); 

  // ======================= Connexion =======================
  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: connexionData.email,
          password: connexionData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Erreur lors de la connexion");

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      toast.success("Connexion réussie !");
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================= Signup =======================
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Vérifier la confirmation du mot de passe
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    // Vérifier la longueur du mot de passe
    if (signupData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          fullName: signupData.fullName,
          company: signupData.company
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Erreur lors de l'inscription");

      // Sauvegarder le JWT dans LocalStorage
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      toast.success("Compte créé avec succès !");
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
            Traininblue Partners
          </CardTitle>
          <CardDescription className="text-center">
            Plateforme de gestion des partenaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connexion" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connexion">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            {/* ===== Connexion Tab ===== */}
            <TabsContent value="connexion">
              <form onSubmit={handleConnexion} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="connexion-email">Email</Label>
                  <Input
                    id="connexion-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={connexionData.email}
                    onChange={(e) => setConnexionData({ ...connexionData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connexion-password">Mot de passe</Label>
                  <Input
                    id="connexion-password"
                    type="password"
                    placeholder="••••••••"
                    value={connexionData.password}
                    onChange={(e) => setConnexionData({ ...connexionData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ===== Signup Tab ===== */}
              {/* ===== Signup Tab ===== */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Entreprise</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="Nom de votre entreprise"
                    value={signupData.company}
                    onChange={(e) => setSignupData({ ...signupData, company: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer un compte"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
