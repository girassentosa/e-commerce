import { execSync } from 'node:child_process';

try {
  console.log('Generating Prisma Client...');
  execSync('prisma generate', { stdio: 'inherit' });
  
  console.log('Deploying migrations...');
  try {
    execSync('prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    // If migrate deploy fails (no migrations or already applied), use db push
    console.log('Migration deploy failed, using db push instead...');
    execSync('prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });
  }
  
  console.log('Building Next.js...');
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

