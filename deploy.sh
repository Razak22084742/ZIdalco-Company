#!/bin/bash

# Zidalco Deployment Script
echo "🚀 Starting Zidalco Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    print_status "All dependencies are installed."
}

# Test local build
test_local() {
    print_status "Testing local build..."
    
    # Install dependencies
    npm install
    
    # Test backend
    print_status "Starting backend test..."
    timeout 10s npm start &
    BACKEND_PID=$!
    
    sleep 5
    
    # Test health endpoint
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null
    print_status "Local tests completed successfully"
}

# Deploy to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if command -v vercel &> /dev/null; then
        vercel --prod
        print_status "Frontend deployed to Vercel"
    else
        print_warning "Vercel CLI not found. Please deploy manually:"
        echo "1. Go to https://vercel.com"
        echo "2. Import your GitHub repository"
        echo "3. Set environment variable: NEXT_PUBLIC_API_URL=https://api.mysite.com"
        echo "4. Deploy!"
    fi
}

# Deploy to Render
deploy_backend_render() {
    print_status "Deploying backend to Render..."
    print_warning "Please deploy manually to Render:"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Select 'Web Service'"
    echo "4. Set build command: npm install"
    echo "5. Set start command: npm start"
    echo "6. Configure environment variables (see DEPLOYMENT.md)"
    echo "7. Deploy!"
}

# Deploy to Railway
deploy_backend_railway() {
    print_status "Deploying backend to Railway..."
    print_warning "Please deploy manually to Railway:"
    echo "1. Go to https://railway.app"
    echo "2. Connect your GitHub repository"
    echo "3. Railway will auto-detect configuration"
    echo "4. Set environment variables (see DEPLOYMENT.md)"
    echo "5. Deploy!"
}

# Main deployment function
main() {
    echo "🏗️  Zidalco Static + Dynamic Deployment"
    echo "========================================"
    
    check_dependencies
    test_local
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy frontend to Vercel"
    echo "2. Deploy backend to Render or Railway"
    echo "3. Configure DNS records"
    echo "4. Set up environment variables"
    echo "5. Test the deployment"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
    
    # Ask user which backend to deploy
    echo ""
    read -p "Which backend service would you like to deploy to? (render/railway/skip): " backend_choice
    
    case $backend_choice in
        "render")
            deploy_backend_render
            ;;
        "railway")
            deploy_backend_railway
            ;;
        "skip")
            print_warning "Skipping backend deployment"
            ;;
        *)
            print_warning "Invalid choice. Skipping backend deployment"
            ;;
    esac
    
    # Ask about frontend deployment
    echo ""
    read -p "Deploy frontend to Vercel? (y/n): " frontend_choice
    
    if [[ $frontend_choice == "y" || $frontend_choice == "Y" ]]; then
        deploy_frontend
    else
        print_warning "Skipping frontend deployment"
    fi
    
    echo ""
    print_status "Deployment process completed!"
    echo "📖 Check DEPLOYMENT.md for detailed instructions"
}

# Run main function
main
