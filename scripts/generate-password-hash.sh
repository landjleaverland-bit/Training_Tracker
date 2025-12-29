#!/bin/bash
# Generate SHA-256 hash of a password for APP_SECRET_PASSWORD env var

echo "=== Password Hash Generator ==="
echo ""
echo "This script generates a SHA-256 hash of your password."
echo "Use the output as the APP_SECRET_PASSWORD environment variable."
echo ""

read -sp "Enter password: " password
echo ""

# Generate SHA-256 hash (without trailing newline)
hash=$(echo -n "$password" | sha256sum | cut -d' ' -f1)

echo ""
echo "=== Generated Hash ==="
echo "$hash"
echo ""
echo "Set this as your environment variable:"
echo "  export APP_SECRET_PASSWORD=$hash"
echo ""
echo "Or for Google Cloud Functions:"
echo "  gcloud functions deploy FUNCTION_NAME --set-env-vars APP_SECRET_PASSWORD=$hash"
echo ""
