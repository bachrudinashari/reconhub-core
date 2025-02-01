const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

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
  const outputDir = `./reconftw_output/${target}`;

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
    folderSize: '0 KB'
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
  res.json(scanResults);
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