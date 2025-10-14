# CryptoPulse Production Deployment

## 🚀 World-Class Production Deployment with Docker

This directory contains everything needed to deploy CryptoPulse in a production environment using Docker and Docker Compose. The setup is designed to be **world-class**, **scalable**, and **production-ready**.

## 📋 Prerequisites

### Required Software
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git** (for cloning the repository)

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended
- **Storage**: 20GB+ free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

## 🏗️ Architecture

### Services Included
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + PostgreSQL
- **Cloud Services**: Microservices for external integrations
- **Databases**: PostgreSQL (Primary + Replica), Redis (Primary + Replica), MongoDB
- **Load Balancer**: Nginx with advanced configuration
- **Monitoring**: Prometheus + Grafana
- **Backup**: Automated database backups

### Network Architecture
```
Internet → Nginx (Load Balancer) → Frontend/Backend Services
                                ↓
                            Database Cluster
                            (PostgreSQL + Redis + MongoDB)
```

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd CryptoPulse--main/docker
```

### 2. Configure Environment
```bash
# Copy the environment template
cp env.production.example env.production

# Edit the environment file with your production values
nano env.production
```

### 3. Deploy (Windows)
```powershell
# Run the deployment script
.\deploy.ps1

# Or with specific command
.\deploy.ps1 deploy
```

### 3. Deploy (Linux/Mac)
```bash
# Make script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh

# Or with specific command
./deploy.sh deploy
```

### 4. Verify Deployment
```bash
# Check service status
.\deploy.ps1 status  # Windows
./deploy.sh status   # Linux/Mac

# View logs
.\deploy.ps1 logs    # Windows
./deploy.sh logs     # Linux/Mac
```

## 🌐 Service URLs

After successful deployment, access your services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application interface |
| **Backend API** | http://localhost:1337 | REST API endpoints |
| **Cloud Services** | http://localhost:3001 | Microservices |
| **Load Balancer** | http://localhost | Nginx (routes to frontend) |
| **Prometheus** | http://localhost:9090 | Metrics and monitoring |
| **Grafana** | http://localhost:3002 | Dashboards and visualization |

## 📊 Monitoring

### Prometheus Metrics
- System metrics (CPU, Memory, Disk)
- Application metrics (Response time, Error rate)
- Database metrics (Connections, Queries)
- Container metrics (Resource usage)

### Grafana Dashboards
- **System Overview**: Server health and performance
- **Application Metrics**: API performance and errors
- **Database Performance**: Query performance and connections
- **Trading Bot**: Trading-specific metrics

### Alerting
- **Critical**: Service down, database unavailable
- **Warning**: High resource usage, slow responses
- **Info**: Low activity, maintenance reminders

## 🔧 Management Commands

### Windows (PowerShell)
```powershell
# Deploy all services
.\deploy.ps1 deploy

# Stop all services
.\deploy.ps1 stop

# Restart all services
.\deploy.ps1 restart

# Show service status
.\deploy.ps1 status

# View logs (all services)
.\deploy.ps1 logs

# View logs (specific service)
.\deploy.ps1 logs backend

# Clean up (remove containers and images)
.\deploy.ps1 cleanup

# Show help
.\deploy.ps1 help
```

### Linux/Mac (Bash)
```bash
# Deploy all services
./deploy.sh deploy

# Stop all services
./deploy.sh stop

# Restart all services
./deploy.sh restart

# Show service status
./deploy.sh status

# View logs (all services)
./deploy.sh logs

# View logs (specific service)
./deploy.sh logs backend

# Clean up (remove containers and images)
./deploy.sh cleanup

# Show help
./deploy.sh help
```

## 🔒 Security Features

### Built-in Security
- **Non-root containers**: All services run as non-root users
- **Read-only filesystems**: Containers use read-only root filesystems
- **Security headers**: Nginx configured with security headers
- **Rate limiting**: API rate limiting and connection limiting
- **CORS protection**: Proper CORS configuration
- **CSRF protection**: Built-in CSRF protection

### Network Security
- **Isolated network**: Custom Docker network for service communication
- **Internal communication**: Services communicate through internal network
- **External access**: Only Nginx exposed to external traffic

## 📈 Scaling

### Horizontal Scaling
```yaml
# In docker-compose.production.yml
services:
  backend:
    deploy:
      replicas: 3  # Scale to 3 instances
```

### Vertical Scaling
```yaml
# Adjust resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G      # Increase memory limit
          cpus: '1.0'     # Increase CPU limit
```

## 🔄 Backup and Recovery

### Automated Backups
- **Database backups**: Daily automated PostgreSQL backups
- **Configuration backups**: Environment and configuration files
- **Log retention**: 30-day log retention policy

### Manual Backup
```bash
# Backup database
docker-compose exec postgres pg_dump -U cryptopulse_prod cryptopulse_prod > backup.sql

# Backup volumes
docker run --rm -v cryptopulse_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker-compose logs [service_name]

# Check resource usage
docker stats

# Restart specific service
docker-compose restart [service_name]
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U cryptopulse_prod

# Check database logs
docker-compose logs postgres
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :1337

# Change ports in env.production
BACKEND_PORT=1338
```

### Log Locations
- **Application logs**: `./logs/`
- **Nginx logs**: `./logs/nginx/`
- **Docker logs**: `docker-compose logs [service]`

## 📝 Configuration

### Environment Variables
Key environment variables in `env.production`:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
MONGO_PASSWORD=your_mongo_password

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:1337
```

### Custom Configuration
- **Nginx**: Edit `nginx/nginx.production.conf`
- **Prometheus**: Edit `monitoring/prometheus.yml`
- **Grafana**: Configure in web interface

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] SSL certificates ready (if using HTTPS)
- [ ] Database passwords changed
- [ ] API keys configured
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Production Considerations
1. **Use HTTPS**: Configure SSL certificates for production
2. **External databases**: Consider using managed database services
3. **Load balancer**: Use external load balancer for high availability
4. **Monitoring**: Set up external monitoring and alerting
5. **Backup**: Implement automated backup to external storage

## 📞 Support

### Getting Help
- **Documentation**: Check this README and inline comments
- **Logs**: Always check logs first for error details
- **Issues**: Create an issue in the repository
- **Community**: Join our Discord/Telegram community

### Contributing
- Fork the repository
- Create a feature branch
- Make your changes
- Test thoroughly
- Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Happy Trading! 🚀📈**
