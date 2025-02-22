const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

// Configure paths
const RECONFTW_PATH = '/root/reconftw/reconftw.sh';
const RECON_OUTPUT_PATH = '/root/reconftw/Recon';

// Configure CORS to allow requests from your VPS IP
app.use(cors({
  origin: 'http://38.242.149.132',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static('dist'));

// In-memory storage for scan results (replace with database in production)
const scanResults = [];
let scanCounter = 0;

// Helper function to run command in background
const runCommandInBackground = (command, scanId) => {
  return new Promise((resolve, reject) => {
    const process = exec(command, { detached: true }, (error, stdout, stderr) => {
      const scanIndex = scanResults.findIndex(s => s.id === scanId);
      if (scanIndex !== -1) {
        scanResults[scanIndex].status = error ? 'failed' : 'completed';
        
        // Calculate folder size
        try {
          const size = getFolderSize(scanResults[scanIndex].outputDir);
          scanResults[scanIndex].folderSize = formatBytes(size);
        } catch (err) {
          console.error('Error calculating folder size:', err);
        }
      }

      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
      } else {
        console.log(`Scan completed: ${stdout}`);
        resolve(stdout);
      }
    });

    // Unref the child process so it can run independently
    process.unref();
  });
};

// Update route paths to include /backend prefix
app.post('/backend/scan', (req, res) => {
  const { target, scanType } = req.body;
  
  if (!target) {
    return res.status(400).json({ error: 'Target is required' });
  }

  const scanId = ++scanCounter;
  const timestamp = new Date().toISOString();
  const outputDir = path.join(RECON_OUTPUT_PATH, `${target}_${timestamp.replace(/[:.]/g, '-')}`);

  // Build the reconftw command
  const command = scanType === "recon" 
    ? `${RECONFTW_PATH} -d ${target} -r`
    : `${RECONFTW_PATH} -d ${target} -a`;

  // Add scan to results
  scanResults.push({
    id: scanId,
    target,
    scanType,
    timestamp,
    status: 'running',
    folderSize: '0 KB',
    outputDir
  });

  // Run the command in background
  runCommandInBackground(command, scanId)
    .catch(error => console.error('Background scan error:', error));

  res.json({ 
    message: 'Scan started successfully',
    scanId 
  });
});

app.get('/backend/scans', (req, res) => {
  const sortedScans = [...scanResults].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  res.json(sortedScans);
});

app.get('/backend/results/:scanId/images/*', (req, res) => {
  const scanId = parseInt(req.params.scanId);
  const scan = scanResults.find(s => s.id === scanId);
  
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  const imagePath = path.join(scan.outputDir, req.params[0]);
  
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.sendFile(imagePath);
});

// Helper functions
function getFolderSize(directoryPath) {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath);
      }
    });
  } catch (err) {
    console.error('Error reading directory:', err);
  }
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
