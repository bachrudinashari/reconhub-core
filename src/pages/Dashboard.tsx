import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Dashboard = () => {
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("recon");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) {
      toast.error("Please enter a target!");
      return;
    }
    
    // Here you would typically make an API call to start the scan
    const command = scanType === "recon" 
      ? `./reconftw.sh -d ${target} -r`
      : `./reconftw.sh -d ${target} -a`;
    
    console.log("Executing command:", command);
    toast.success("Scan started successfully!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">ReconFTW Dashboard</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Start New Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="space-y-6">
                <div className="space-y-2">
                  <Label>Target (Domain or IP)</Label>
                  <Input
                    type="text"
                    placeholder="example.com or 192.168.1.1"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="bg-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scan Type</Label>
                  <RadioGroup value={scanType} onValueChange={setScanType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recon" id="recon" />
                      <Label htmlFor="recon">Recon Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full">Full Scan (Recon + Vulnerability)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full">
                  Start Scan
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No recent scans available.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;