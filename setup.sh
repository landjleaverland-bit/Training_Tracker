#!/bin/bash

# Training Tracker - Automated Setup Script
# This script installs Node.js, npm, and all project dependencies

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check if running on a supported OS
check_os() {
    print_header "Checking Operating System"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "Linux detected"
        
        # Check if it's Ubuntu/Debian
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
                print_success "Ubuntu/Debian-based system detected"
                return 0
            else
                print_warning "This script is optimized for Ubuntu/Debian. Proceeding anyway..."
            fi
        fi
    else
        print_error "This script is designed for Linux systems"
        exit 1
    fi
}

# Check if Node.js is already installed
check_nodejs() {
    print_header "Checking Node.js Installation"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js is already installed: ${NODE_VERSION}"
        
        # Extract major version number
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        
        if [ "$MAJOR_VERSION" -ge 22 ]; then
            print_success "Node.js version is compatible (v22 or higher)"
            return 0
        else
            print_warning "Node.js version is ${NODE_VERSION}, but v22+ is recommended"
            read -p "Do you want to upgrade to Node.js v22? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                return 1
            else
                print_info "Continuing with current Node.js version..."
                return 0
            fi
        fi
    else
        print_info "Node.js is not installed"
        return 1
    fi
}

# Install Node.js v22
install_nodejs() {
    print_header "Installing Node.js v22"
    
    print_info "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    
    print_info "Installing Node.js..."
    sudo apt install nodejs -y
    
    # Verify installation
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        print_success "Node.js ${NODE_VERSION} installed successfully"
        print_success "npm ${NPM_VERSION} installed successfully"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
}

# Install main project dependencies
install_main_dependencies() {
    print_header "Installing Main Project Dependencies"
    
    print_info "Running npm install in project root..."
    npm install
    
    print_success "Main project dependencies installed successfully"
}

# Install functions dependencies
install_functions_dependencies() {
    print_header "Installing Functions Dependencies"
    
    if [ -d "functions" ]; then
        print_info "Running npm install in functions directory..."
        cd functions
        npm install
        cd ..
        print_success "Functions dependencies installed successfully"
    else
        print_warning "Functions directory not found, skipping..."
    fi
}

# Run security audit
run_security_audit() {
    print_header "Running Security Audit"
    
    print_info "Checking for vulnerabilities..."
    npm audit || true  # Don't fail on vulnerabilities
    
    echo ""
    read -p "Do you want to attempt to fix vulnerabilities automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Running npm audit fix..."
        npm audit fix || true
        print_success "Audit fix completed"
    else
        print_info "Skipping automatic fixes"
    fi
}

# Display next steps
show_next_steps() {
    print_header "Setup Complete! 🎉"
    
    echo -e "${GREEN}Your Training Tracker project is ready to use!${NC}\n"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  ${YELLOW}1.${NC} Start the development server:"
    echo -e "     ${GREEN}npm run dev${NC}"
    echo -e ""
    echo -e "  ${YELLOW}2.${NC} Build for production:"
    echo -e "     ${GREEN}npm run build${NC}"
    echo -e ""
    echo -e "  ${YELLOW}3.${NC} Deploy to GitHub Pages:"
    echo -e "     ${GREEN}npm run gh-pages${NC}"
    echo -e ""
    echo -e "  ${YELLOW}4.${NC} Run type checking:"
    echo -e "     ${GREEN}npm run check${NC}"
    echo -e ""
    echo -e "${BLUE}For more information, see README.md${NC}\n"
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║   Training Tracker - Setup Script        ║"
    echo "║   Automated Installation & Configuration  ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check OS compatibility
    check_os
    
    # Check and install Node.js if needed
    if ! check_nodejs; then
        install_nodejs
    fi
    
    # Install dependencies
    install_main_dependencies
    install_functions_dependencies
    
    # Run security audit
    run_security_audit
    
    # Show next steps
    show_next_steps
}

# Run main function
main
