import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

interface ScanResult {
  id: number;
  target: string;
  scanType: string;
  timestamp: string;
  status: string;
  folderSize: string;
}

const API_URL = "http://localhost:3000";

const RecentScans = () => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch recent scans
    const fetchScans = async () => {
      try {
        const response = await fetch(`${API_URL}/scans`);
        const data = await response.json();
        setScans(data);
      } catch (error) {
        console.error("Error fetching scans:", error);
      }
    };

    fetchScans();
  }, []);

  const handleViewResults = (scanId: number) => {
    navigate(`/dashboard/scan/${scanId}`);
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Scans</CardTitle>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Scan Type</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Folder Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan, index) => (
                <TableRow key={scan.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{scan.target}</TableCell>
                  <TableCell>{scan.scanType}</TableCell>
                  <TableCell>{new Date(scan.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{scan.status}</TableCell>
                  <TableCell>{scan.folderSize}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => handleViewResults(scan.id)}
                    >
                      View Results
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentScans;