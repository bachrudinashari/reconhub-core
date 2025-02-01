import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = "http://localhost:3000";

const StartScan = () => {
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("recon");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentProcess, setCurrentProcess] = useState("");
  const [scanStartTime, setScanStartTime] = useState<Date | null>(null);
  const [progressData, setProgressData] = useState<Array<{ time: string; progress: number }>>([]);

  const updateProgress = (output: string) => {
    // This is a simplified example - you'll need to adjust based on actual output
    const processes = {
      "Subdomain Enumeration": 20,
      "Port Scanning": 40,
      "Vulnerability Scanning": 60,
      "Directory Bruteforcing": 80,
      "Report Generation": 100
    };

    for (const [process, progress] of Object.entries(processes)) {
      if (output.includes(process)) {
        setCurrentProcess(process);
        setScanProgress(progress);
        const now = new Date();
        setProgressData(prev => [...prev, {
          time: now.toLocaleTimeString(),
          progress
        }]);
      }
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) {
      toast.error("Please enter a target!");
      return;
    }
    
    try {
      setIsScanning(true);
      setScanStartTime(new Date());
      setProgressData([]);
      
      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, scanType })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan');
      }

      updateProgress(data.output);
      toast.success("Scan started successfully!");
      
    } catch (error) {
      console.error("Error starting scan:", error);
      toast.error(error.message || "Failed to start scan. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-8">
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

            <Button type="submit" className="w-full" disabled={isScanning}>
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>
          </form>

          {isScanning && (
            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Process: {currentProcess}</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} />
              </div>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="progress" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StartScan;