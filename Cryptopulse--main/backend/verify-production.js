#!/usr/bin/env node
// =============================================================================
// CryptoPulse Backend Production Readiness Verification
// =============================================================================
// This script verifies that the backend is ready for production deployment

const fs = require('fs');
const path = require('path');
const { execSync: _execSync } = require('child_process');
const logger = require('./lib/logging');

console.log('🔍 CryptoPulse Backend Production Readiness Check');
console.log('================================================\n');

let score = 0;
let maxScore = 0;
const issues = [];
const warnings = [];

// Check function
function check(description, test, points = 1) {
  maxScore += points;
  console.log(`Checking: ${description}...`);

  try {
    if (test()) {
      score += points;
      console.log(`  ✅ PASS (${points} point${points > 1 ? 's' : ''})`);
    } else {
      console.warn('  ❌ FAIL (0 points)');
    }
  } catch (error) {
    console.error(`  ❌ ERROR: ${error.message}`);
    issues.push(`${description}: ${error.message}`);
  }
}

// Warning function
function warn(description, message) {
  warnings.push(`${description}: ${message}`);
  console.warn(`  ⚠️  WARNING: ${message}`);
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

// Check if file has content
function _fileHasContent(filePath) {
  if (!fileExists(filePath)) {return false;}
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return content.trim().length > 0;
}

// Check if file contains placeholder values
function _hasPlaceholders(filePath) {
  if (!fileExists(filePath)) {return false;}
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  const placeholders = [
    'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER',
    'localhost', '127.0.0.1', 'example.com'
  ];
  return placeholders.some(placeholder => content.includes(placeholder));
}

// Check if secret is secure
function isSecureSecret(secret) {
  if (!secret || secret.length < 32) {return false;}
  const weakPatterns = ['test', 'dev', 'development', 'secret', 'key'];
  return !weakPatterns.some(pattern =>
    secret.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Environment file checks
console.log('📁 Environment Configuration:');
check('Environment file exists', () => fileExists('.env.backend') || fileExists('env.backend'), 2);
check('Production environment file exists', () => fileExists('.env.production') || fileExists('env.production.secure'), 2);

if (fileExists('.env.backend') || fileExists('env.backend')) {
  const envFile = fileExists('.env.backend') ? '.env.backend' : 'env.backend';
  const envContent = fs.readFileSync(path.join(__dirname, envFile), 'utf8');

  check('JWT_SECRET is configured', () => envContent.includes('JWT_SECRET='), 1);
  check('DATABASE_URL is configured', () => envContent.includes('DATABASE_URL='), 1);
  check('ENCRYPTION_KEY is configured', () => envContent.includes('ENCRYPTION_KEY='), 1);

  if (envContent.includes('JWT_SECRET=')) {
    const jwtSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1];
    if (jwtSecret && !isSecureSecret(jwtSecret)) {
      warn('JWT_SECRET', 'Secret appears to be weak or placeholder');
    }
  }
}

// Package.json checks
console.log('\n📦 Package Configuration:');
check('package.json exists', () => fileExists('package.json'), 1);
check('package-lock.json exists', () => fileExists('package-lock.json'), 1);

if (fileExists('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  check('Node.js version specified', () => packageJson.engines?.node, 1);
  check('Production start script', () => packageJson.scripts?.start, 1);
  check('Security dependencies present', () => {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return deps.helmet && deps['express-rate-limit'] && deps.bcryptjs;
  }, 2);
}


// Database schema checks
console.log('\n🗄️  Database Schema:');
check('Schema file exists', () => fileExists('schema.sql'), 2);
check('Schema has tables', () => {
  if (!fileExists('schema.sql')) {return false;}
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  return schema.includes('CREATE TABLE') && schema.includes('users');
}, 2);
check('Schema has indexes', () => {
  if (!fileExists('schema.sql')) {return false;}
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  return schema.includes('CREATE INDEX');
}, 1);

// Security checks
console.log('\n🔒 Security Configuration:');
check('Security middleware exists', () => fileExists('lib/security.js'), 2);
check('Authentication module exists', () => fileExists('lib/auth.js'), 2);
check('Environment validation exists', () => fileExists('lib/envValidation.js'), 2);

// Main application checks
console.log('\n🚀 Application Code:');
check('Main application exists', () => fileExists('index.js'), 2);
check('Error handling', () => {
  if (!fileExists('index.js')) {return false;}
  const index = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  return index.includes('errorHandler') && index.includes('try') && index.includes('catch');
}, 2);
check('Health endpoints', () => {
  if (!fileExists('index.js')) {return false;}
  const index = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  return index.includes('/health') && index.includes('/health/detailed');
}, 2);
check('Rate limiting', () => {
  if (!fileExists('index.js')) {return false;}
  const index = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  return index.includes('rateLimit') || index.includes('limiter');
}, 2);

// Test for production-specific issues
console.warn('\n⚠️  Production Warnings:');
if (fileExists('.env.backend') || fileExists('env.backend')) {
  const envFile = fileExists('.env.backend') ? '.env.backend' : 'env.backend';
  const envContent = fs.readFileSync(path.join(__dirname, envFile), 'utf8');

  if (envContent.includes('localhost')) {
    warn('Environment', 'Contains localhost URLs - not suitable for production');
  }
  if (envContent.includes('dev_password')) {
    warn('Environment', 'Contains development passwords - not suitable for production');
  }
  if (envContent.includes('ENABLE_DEBUG=true')) {
    warn('Environment', 'Debug mode enabled - should be false in production');
  }
}

// Run additional validation checks
console.log('\n🔧 Additional Validation Checks:');

// Check for configuration validation script
check('Configuration validator exists', () => fileExists('../scripts/config-validator.js'), 1);

// Check for secrets manager
check('Secrets manager exists', () => fileExists('../scripts/secrets-manager.js'), 1);

// Check for configuration guide
check('Configuration guide exists', () => fileExists('../CONFIGURATION_GUIDE.md'), 1);

// Run configuration validation if script exists
if (fileExists('../scripts/config-validator.js')) {
  try {
    const { execSync } = require('child_process');
    execSync('node ../scripts/config-validator.js', { stdio: 'pipe' });
    check('Configuration validation passed', () => true, 2);
  } catch (error) {
    check('Configuration validation passed', () => false, 2);
    issues.push('Configuration validation failed - run: node scripts/config-validator.js');
  }
}

// Calculate final score
const percentage = Math.round((score / maxScore) * 100);

console.log('\n📊 Production Readiness Score:');
console.log(`   Score: ${score}/${maxScore} (${percentage}%)`);

if (percentage >= 90) {
  console.log('   🎉 EXCELLENT - Ready for production!');
} else if (percentage >= 80) {
  console.log('   ✅ GOOD - Minor issues to address');
} else if (percentage >= 70) {
  console.warn('   ⚠️  FAIR - Several issues need attention');
} else {
  console.error('   ❌ POOR - Major issues must be fixed');
}

// Display issues
if (issues.length > 0) {
  console.error('\n❌ Issues Found:');
  issues.forEach(issue => console.error(`   - ${issue}`));
}

// Display warnings
if (warnings.length > 0) {
  console.warn('\n⚠️  Warnings:');
  warnings.forEach(warning => console.warn(`   - ${warning}`));
}

// Recommendations
console.log('\n💡 Recommendations:');
if (percentage < 90) {
  console.log('   - Fix all issues above before production deployment');
  console.log('   - Run configuration validation: node scripts/config-validator.js');
  console.log('   - Run secrets audit: node scripts/secrets-manager.js audit');
  console.log('   - Run security audit: pnpm run audit:security');
  console.log('   - Test all endpoints: pnpm run test');
  console.log('   - Review configuration guide: CONFIGURATION_GUIDE.md');
} else {
  console.log('   - Configuration is production-ready!');
  console.log('   - Run final security audit: pnpm run audit:security');
  console.log('   - Test in staging environment');
  console.log('   - Set up monitoring and alerting');
  console.log('   - Configure backup and disaster recovery');
  console.log('   - Schedule regular secret rotation (every 90 days)');
}

console.log('\n🚀 Production readiness check complete!');

// Exit with appropriate code
process.exit(percentage >= 80 ? 0 : 1);
