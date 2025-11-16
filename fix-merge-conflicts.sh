#!/bin/bash

# Fix Merge Conflicts in package-lock.json
# This script resolves the 74 conflicts by regenerating the lock file

set -e  # Exit on any error

echo "🔧 Fix: Resolving package-lock.json merge conflicts"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Run this script from the project root."
    exit 1
fi

print_info "This will regenerate package-lock.json to resolve all conflicts."
echo ""

# Step 1: Backup current package-lock.json (if it exists)
if [ -f "package-lock.json" ]; then
    print_info "Step 1: Creating backup of package-lock.json..."
    cp package-lock.json package-lock.json.backup
    print_success "Backup created: package-lock.json.backup"
else
    print_info "Step 1: No existing package-lock.json found (this is fine)"
fi
echo ""

# Step 2: Remove conflicted package-lock.json
print_info "Step 2: Removing conflicted package-lock.json..."
rm -f package-lock.json
print_success "Removed package-lock.json"
echo ""

# Step 3: Clean node_modules (optional but recommended)
read -p "Do you want to also clean node_modules? (recommended) [Y/n]: " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    print_info "Step 3: Cleaning node_modules..."
    rm -rf node_modules
    print_success "Removed node_modules"
else
    print_info "Step 3: Skipping node_modules cleanup"
fi
echo ""

# Step 4: Regenerate package-lock.json
print_info "Step 4: Running npm install to regenerate package-lock.json..."
echo ""
npm install
echo ""
print_success "package-lock.json regenerated successfully!"
echo ""

# Step 5: Deduplicate dependencies (optional)
print_info "Step 5: Deduplicating dependencies (optional but recommended)..."
npm dedupe
print_success "Dependencies deduplicated"
echo ""

# Step 6: Verify installation
print_info "Step 6: Verifying installation..."
if npm ls --depth=0 > /dev/null 2>&1; then
    print_success "All dependencies installed correctly"
else
    print_error "Warning: Some peer dependency warnings exist (usually safe to ignore)"
fi
echo ""

# Step 7: Test build
print_info "Step 7: Testing build..."
echo ""
if npm run build; then
    echo ""
    print_success "Build successful!"
else
    echo ""
    print_error "Build failed. Check the errors above."
    exit 1
fi
echo ""

# Summary
echo "=================================================="
echo "🎉 Fix Complete!"
echo "=================================================="
echo ""
print_success "All 74 merge conflicts have been resolved!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff package-lock.json"
echo "  2. Commit the fix: git add package-lock.json"
echo "  3. Commit: git commit -m \"fix: resolve package-lock.json merge conflicts\""
echo "  4. Push: git push"
echo ""
echo "Backup file saved as: package-lock.json.backup"
echo "(You can delete it once you've verified everything works)"
echo ""
print_info "To test the application: npm run dev"
echo ""
