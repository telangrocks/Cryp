# Render Automation Workflows

This directory contains GitHub Actions workflows that provide full end-to-end automation for your Render services, handling deployments, environment management, private links, and custom domains like a human would.

## 🚀 Available Workflows

### 1. Render Full Automation (`render-full-automation.yml`)
**Main workflow for comprehensive deployment management**

**Triggers:**
- Push to `main` or `staging` branches
- Manual dispatch with various actions

**Actions Available:**
- `deploy` - Standard deployment
- `redeploy` - Redeploy without cache clear
- `clear-cache` - Deploy with cache cleared
- `full-deploy` - Complete deployment with health checks
- `rollback` - Rollback to previous deployment
- `logs` - Fetch recent service logs
- `set-env` - Update environment variables
- `health-check` - Perform health checks
- `private-link` - Create private connections
- `domain-setup` - Configure custom domains

**Usage Examples:**
```bash
# Deploy all services
action: deploy, service: all

# Deploy specific service with cache clear
action: clear-cache, service: frontend

# Update environment variables
action: set-env, service: backend
envPairs: |
  API_BASE_URL=https://api.example.com
  NODE_ENV=production
  DEBUG=false

# Full deployment with health checks
action: full-deploy, service: all
```

### 2. Private Links Setup (`private-links-setup.yml`)
**Secure connections to external infrastructure**

**Actions:**
- `create` - Create private link to external service
- `list` - List existing private links
- `status` - Check private link status
- `delete` - Remove private link

**Usage Examples:**
```bash
# Create private link to database
action: create
privateLinkName: db-connection
targetService: backend
connectionType: database
externalEndpoint: your-db-endpoint.amazonaws.com

# Check status
action: status
privateLinkName: db-connection
targetService: backend
```

### 3. Domain Management (`domain-management.yml`)
**Custom domain and SSL management**

**Actions:**
- `setup` - Add custom domain
- `verify` - Verify domain and enable SSL
- `ssl` - Manage SSL certificates
- `delete` - Remove custom domain
- `list` - List all domains

**Usage Examples:**
```bash
# Setup custom domain
action: setup
domain: app.yourdomain.com
targetService: frontend

# Verify domain after DNS setup
action: verify
domain: app.yourdomain.com
targetService: frontend
```

## 🔧 Setup Requirements

### 1. Render API Credentials
Add these secrets to GitHub → Settings → Secrets and variables → Actions:

**Required:**
- `RENDER_API_KEY` - Your Render API key
- `RENDER_OWNER_ID` - Your team/workspace ID
- `FRONTEND_SERVICE_ID` - Frontend service ID
- `BACKEND_SERVICE_ID` - Backend service ID

**Optional (for faster deploys):**
- `FRONTEND_DEPLOY_HOOK` - Frontend deploy hook URL
- `BACKEND_DEPLOY_HOOK` - Backend deploy hook URL

### 2. How to Get Render Credentials

**API Key:**
1. Render Dashboard → Settings → API Keys
2. Create New API Key
3. Name: "GitHub Actions - Cryptopulse"
4. Copy the token

**Owner ID:**
1. Same API Keys page shows Owner ID
2. Or check service URL: `render.com/.../owners/<ownerId>/services/...`

**Service IDs:**
1. Open each service → Settings → Advanced
2. Copy the Service ID

**Deploy Hooks (optional):**
1. Service → Settings → Deploy Hooks
2. Copy the hook URL

### 3. Team Setup (Recommended)
1. Create Team in Render (top-left dropdown)
2. Transfer services to Team
3. Invite GitHub account as Maintainer/Admin
4. This provides auditability and manual access when needed

## 🎯 Common Workflows

### Initial Setup
1. Add all secrets to GitHub
2. Test with manual workflow run:
   - Action: `deploy`, Service: `frontend`
3. Verify deployment and check logs

### Regular Deployment
- Push to `main` → automatic deployment
- Manual: Action `full-deploy`, Service `all`

### Environment Updates
```bash
action: set-env
service: backend
envPairs: |
  API_KEY=new-key
  FEATURE_FLAG=enabled
```
Then run `action: redeploy, service: backend`

### Custom Domain Setup
1. Run `domain-management` workflow:
   - Action: `setup`, Domain: `app.yourdomain.com`
2. Add DNS record (printed in workflow output)
3. Run again with Action: `verify`

### Private Infrastructure Connection
1. Run `private-links-setup` workflow:
   - Action: `create`
   - PrivateLinkName: `database-connection`
   - TargetService: `backend`
   - ConnectionType: `database`

### Rollback
```bash
action: rollback
service: frontend
rollbackDeployId: <deploy-id-from-logs>
```

## 📊 Monitoring and Logs

**Built-in Features:**
- Health checks after deployment
- Log fetching and artifact upload
- Service URL reporting
- Deployment status tracking

**Manual Access:**
- GitHub Actions → Artifacts → Download logs
- Render Dashboard → Services → Logs
- Workflow summaries show URLs and status

## 🔒 Security Features

**Private Links:**
- Secure connections to external infrastructure
- No public internet traffic
- Enhanced performance and lower costs

**Environment Variables:**
- Secure API key management
- Runtime environment updates
- No secrets in code

**Access Control:**
- API key-based automation
- Team-based permissions
- Audit trails in Render

## 🚨 Troubleshooting

**Common Issues:**
1. **Missing secrets** → Check GitHub Secrets are set
2. **Service not found** → Verify Service IDs are correct
3. **DNS not working** → Wait 5-30 minutes for propagation
4. **Deployment fails** → Check logs in artifacts

**Debug Steps:**
1. Run workflow manually with verbose logging
2. Check GitHub Actions logs
3. Download artifacts for detailed output
4. Verify Render service status

## 📈 Advanced Usage

**Multi-environment:**
- Use different branches for staging/production
- Separate Service IDs for each environment
- Environment-specific secrets

**Custom Actions:**
- Extend workflows for specific needs
- Add notification integrations
- Custom health check endpoints

**Monitoring:**
- Set up alerts for deployment failures
- Monitor service health
- Track deployment metrics

This automation system gives you human-level control over your Render infrastructure through GitHub Actions, with full audit trails and secure credential management.
