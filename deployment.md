# Deployment Guide for Ubuntu VPS

## Prerequisites
- Node.js and npm (already installed)
- Nginx
- PM2 (for process management)
- ReconFTW installed in /root/reconftw

## Deployment Steps

1. Install Nginx and PM2:
```bash
sudo apt update
sudo apt install nginx
sudo npm install -g pm2
```

2. Clone your repository and install dependencies:
```bash
cd /root
git clone <your-repo-url> reconhub-core
cd reconhub-core
npm install
```

3. Build the frontend:
```bash
npm run build
```

4. Configure Nginx:
Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/recon-gan
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name 38.242.149.132;

    # Frontend static files
    location / {
        root /root/reconhub-core/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /backend/ {
        proxy_pass http://localhost:3000/backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Increase timeouts for long-running scans
        proxy_read_timeout 3600;
        proxy_connect_timeout 3600;
        proxy_send_timeout 3600;
    }

    # Enable CORS
    add_header 'Access-Control-Allow-Origin' 'http://38.242.149.132' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
}
```

5. Enable the Nginx configuration:
```bash
sudo ln -s /etc/nginx/sites-available/recon-gan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. Configure paths in server.js:
Update the reconftw paths in your server.js to point to the correct locations:
```javascript
const RECONFTW_PATH = '/root/reconftw/reconftw.sh';
const RECON_OUTPUT_PATH = '/root/reconftw/Recon';
```

7. Start the Node.js server with PM2:
```bash
cd /root/reconhub-core
pm2 start server.js
pm2 save
pm2 startup
```

8. Set up permissions:
```bash
# Give necessary permissions to reconftw
sudo chmod +x /root/reconftw/reconftw.sh
# Ensure Node.js can access the Recon output directory
sudo chown -R $USER:$USER /root/reconftw/Recon
sudo chmod -R 755 /root/reconftw/Recon
```

9. Configure firewall (if enabled):
```bash
sudo ufw allow 80
sudo ufw allow 443  # If using HTTPS
```

## Monitoring and Maintenance

- Monitor logs with PM2:
```bash
pm2 logs
```

- Monitor Nginx logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

- Restart services:
```bash
pm2 restart all
sudo systemctl restart nginx
```

## Troubleshooting

If you encounter permission issues:
1. Make sure the Node.js process has access to both:
   - /root/reconftw/reconftw.sh
   - /root/reconftw/Recon
2. Check the PM2 logs for any path-related errors
3. Verify that the Nginx user has access to the dist directory

For scan result access issues:
1. Ensure the Recon directory exists at /root/reconftw/Recon
2. Check that file permissions are set correctly
3. Verify that the Node.js process can read/write to the Recon directory

For API access issues:
1. Check Nginx error logs for any routing problems
2. Verify that all API calls use the correct URL format: http://38.242.149.132/backend/
3. Ensure CORS headers are properly set in both Nginx and server.js
```