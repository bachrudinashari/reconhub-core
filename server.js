const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/scan', (req, res) => {
  const { target, scanType } = req.body;
  
  // Validate input
  if (!target) {
    return res.status(400).json({ error: 'Target is required' });
  }

  // Build the reconftw command
  const command = scanType === "recon" 
    ? `./reconftw.sh -d ${target} -r`
    : `./reconftw.sh -d ${target} -a`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({ error: 'Failed to execute scan' });
    }
    
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    
    res.json({ 
      message: 'Scan started successfully',
      output: stdout 
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});