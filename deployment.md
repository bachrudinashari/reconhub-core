# Deployment Guide for Ubuntu VPS

## Prerequisites
- Node.js and npm (already installed)
- Nginx
- PM2 (for process management)

## Deployment Steps

1. Install Nginx and PM2:
```bash
sudo apt update
sudo apt install nginx
sudo npm install -g pm2
```

2. Clone your repository and install dependencies:
```bash
git clone <your-repo-url>
cd <repo-directory>
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
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        root /path/to/your/dist;  # Replace with actual path to your built frontend
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Enable the Nginx configuration:
```bash
sudo ln -s /etc/nginx/sites-available/recon-gan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. Start the Node.js server with PM2:
```bash
pm2 start server.js
pm2 save
pm2 startup
```

7. Set up permissions for reconftw:
```bash
# Assuming reconftw is in the same directory as your application
chmod +x reconftw.sh
sudo chown -R $USER:$USER reconftw_output
```

8. Configure firewall (if enabled):
```bash
sudo ufw allow 80
sudo ufw allow 443  # If using HTTPS
```

## Additional Security Considerations

1. Set up SSL/HTTPS using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. Configure proper file permissions:
```bash
sudo chown -R $USER:$USER /path/to/your/app
chmod -R 755 /path/to/your/app
```

3. Set up environment variables if needed:
```bash
nano ~/.bashrc
# Add your environment variables
export NODE_ENV=production
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