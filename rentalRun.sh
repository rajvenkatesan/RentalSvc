#!/usr/bin/env bash

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
CLEAN=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --clean)
      CLEAN=true
      shift
      ;;
    *)
      ;;
  esac
done

echo "Starting PostgreSQL..."
brew services start postgresql@17

echo "Moving to repo root..."
cd "$REPO_ROOT"

echo "Installing dependencies..."
pnpm install

echo "Generating Prisma client..."
cd packages/backend
npx prisma generate

echo "Running migrations..."
npx prisma migrate dev

if [ "$CLEAN" = true ]; then
  echo "Cleaning and seeding database..."
  npx prisma db seed
else
  echo "Skipping database seed (pass --clean to seed database)"
fi

echo "Starting services..."
cd "$REPO_ROOT"

pnpm --filter @rentalsvc/backend dev &
pnpm --filter @rentalsvc/frontend dev &

wait
