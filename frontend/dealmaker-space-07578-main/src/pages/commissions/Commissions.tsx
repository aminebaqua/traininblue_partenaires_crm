
import Layout from "@/components/Layout";
import CommissionsTable from "./CommissionsTable";
import FacturesTable from "./FacturesTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function Commissions() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Commissions</h2>
        </div>
        <Tabs defaultValue="commissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="factures">Factures</TabsTrigger>
          </TabsList>
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commissions</CardTitle>
                <CardDescription>
                  Commissions based on deals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommissionsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="factures" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Factures</CardTitle>
                <CardDescription>
                  Invoices for commissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FacturesTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export default Commissions;
