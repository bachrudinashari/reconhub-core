const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('dist')); // Serve the built frontend

// In-memory storage for scan results (replace with database in production)
const scanResults = [];
let scanCounter = 0;

app.post('/scan', (req, res) => {
  const { target, scanType } = req.body;
  
  if (!target) {
    return res.status(400).json({ error: 'Target is required' });
  }

  const scanId = ++scanCounter;
  const timestamp = new Date().toISOString();
  const outputDir = `./reconftw_output/${target}_${timestamp.replace(/[:.]/g, '-')}`;

  // Build the reconftw command
  const command = scanType === "recon" 
    ? `./reconftw.sh -d ${target} -r`
    : `./reconftw.sh -d ${target} -a`;

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

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    const scanIndex = scanResults.findIndex(s => s.id === scanId);
    if (scanIndex !== -1) {
      scanResults[scanIndex].status = error ? 'failed' : 'completed';
      
      // Calculate folder size
      try {
        const size = getFolderSize(outputDir);
        scanResults[scanIndex].folderSize = formatBytes(size);
      } catch (err) {
        console.error('Error calculating folder size:', err);
      }
    }

    if (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({ error: 'Failed to execute scan' });
    }
    
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    
    res.json({ 
      message: 'Scan started successfully',
      output: stdout,
      scanId 
    });
  });
});

app.get('/scans', (req, res) => {
  // Sort scans by timestamp in descending order (newest first)
  const sortedScans = [...scanResults].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  res.json(sortedScans);
});

// Serve scan results images
app.get('/results/:scanId/images/*', (req, res) => {
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