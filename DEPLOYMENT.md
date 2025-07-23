# IT Cost Analyzer - Deployment Guide

This guide covers various deployment options for the IT Cost Analyzer application.

## 📋 Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Docker (for containerized deployment)
- Git

## 🚀 Quick Start Deployment

### Local Development

1. **Clone and setup**
```bash
git clone <repository-url>
cd it-cost-analyzer
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. **Start development servers**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

5. **Access application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555

## 🐳 Docker Deployment

### Production with Docker Compose

1. **Prepare environment**
```bash
cp .env.example .env
# Configure production values in .env
```

2. **Deploy with Docker Compose**
```bash
docker-compose up -d
```

3. **Initialize database**
```bash
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma db seed
```

### Development with Docker

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Single Container Deployment

```bash
# Build image
docker build -t it-cost-analyzer .

# Run container
docker run -d \
  --name it-cost-analyzer \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:./data/prod.db" \
  -e JWT_SECRET="your-production-secret" \
  -v $(pwd)/data:/app/data \
  it-cost-analyzer
```

## ☁️ Cloud Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - Instance type: t3.medium or larger
   - Configure security groups (ports 22, 80, 443)

2. **Setup server**
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt update
sudo apt install nginx
```

3. **Deploy application**
```bash
# Clone repository
git clone <repository-url>
cd it-cost-analyzer

# Install dependencies
npm install

# Build application
npm run build

# Configure environment
cp .env.example .env
# Edit .env with production values

# Initialize database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/it-cost-analyzer
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/it-cost-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Heroku Deployment

1. **Prepare for Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name
```

2. **Configure environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-production-secret"
heroku config:set ENCRYPTION_KEY="your-32-char-key"
# Add other required environment variables
```

3. **Deploy**
```bash
git push heroku main
```

4. **Initialize database**
```bash
heroku run npx prisma db push
heroku run npx prisma db seed
```

### Vercel Deployment (Frontend Only)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy frontend**
```bash
cd src/client
vercel --prod
```

3. **Configure environment variables in Vercel dashboard**
   - Add `REACT_APP_API_URL` pointing to your backend

### DigitalOcean App Platform

1. **Create app.yaml**
```yaml
name: it-cost-analyzer
services:
- name: api
  source_dir: /
  github:
    repo: your-username/it-cost-analyzer
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: your-production-secret
    type: SECRET
  - key: DATABASE_URL
    value: file:./data/prod.db
```

2. **Deploy via DigitalOcean dashboard or CLI**

## 🔧 Production Configuration

### Environment Variables

**Required:**
- `NODE_ENV=production`
- `JWT_SECRET` - Strong secret key
- `ENCRYPTION_KEY` - 32-character encryption key
- `DATABASE_URL` - Database connection string

**Optional but Recommended:**
- `CORS_ORIGIN` - Frontend URL
- `RATE_LIMIT_MAX_REQUESTS` - API rate limiting
- `LOG_LEVEL=error` - Reduce log verbosity

### Database Setup

**SQLite (Default):**
```bash
# Production database
export DATABASE_URL="file:./data/prod.db"
npx prisma db push
```

**PostgreSQL:**
```bash
# Install PostgreSQL client
npm install pg @types/pg

# Update DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/itcostanalyzer"
npx prisma db push
```

**MySQL:**
```bash
# Install MySQL client
npm install mysql2

# Update DATABASE_URL
export DATABASE_URL="mysql://user:password@localhost:3306/itcostanalyzer"
npx prisma db push
```

### SSL/HTTPS Setup

**Let's Encrypt with Certbot:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Performance Optimization

**PM2 Configuration (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'it-cost-analyzer',
    script: './dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

**Nginx Optimization:**
```nginx
# Add to server block
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📊 Monitoring & Maintenance

### Health Checks

The application includes a health check endpoint:
```bash
curl http://localhost:3001/api/health
```

### Log Management

**PM2 Logs:**
```bash
pm2 logs it-cost-analyzer
pm2 logs --lines 100
```

**Log Rotation:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 ./data/prod.db ".backup ./backups/backup_$DATE.db"
find ./backups -name "*.db" -mtime +7 -delete
```

**Cron Job:**
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Updates and Maintenance

**Update Process:**
```bash
# Backup database
./backup.sh

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run migrations
npx prisma db push

# Restart application
pm2 restart it-cost-analyzer
```

## 🔒 Security Checklist

- [ ] Use strong JWT secrets and encryption keys
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for secrets
- [ ] Implement proper error handling
- [ ] Regular dependency updates

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

**Database Connection Issues:**
```bash
# Check database file permissions
ls -la data/
# Reset database
rm data/prod.db
npx prisma db push
npx prisma db seed
```

**Memory Issues:**
```bash
# Check memory usage
free -h
# Restart application
pm2 restart it-cost-analyzer
```

**SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates
# Renew certificate
sudo certbot renew
```

### Performance Issues

**High CPU Usage:**
- Check PM2 cluster mode
- Monitor database queries
- Review log files for errors

**High Memory Usage:**
- Restart application periodically
- Check for memory leaks
- Optimize database queries

**Slow Response Times:**
- Enable Nginx caching
- Optimize database indexes
- Monitor network latency

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Review security settings
5. Contact support with detailed error messages

---

**Happy Deploying! 🚀**