# From the repo root
cd /Users/rajvenkatesan/intent/workspaces/workspace-create/repo
 
# Install dependencies
pnpm install
 
# Build backend
pnpm --filter @rentalsvc/backend build
 
# Build frontend
pnpm --filter @rentalsvc/frontend build
 
# Run backend tests
pnpm --filter @rentalsvc/backend test
 
# Run frontend tests
pnpm --filter @rentalsvc/frontend test
