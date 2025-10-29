#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Define the relative path to your Angular build output directory.
BUILD_DIR="dist/teleport-project-template-angular"
# --- End Configuration ---

# 1. VALIDATE INPUT
# Check if the BACKEND_URL environment variable is set.
if [ -z "$BACKEND_URL" ]; then
  echo "Error: BACKEND_URL environment variable is not set."
  echo "Usage: BACKEND_URL=https://your-api.appspot.com ./deploy.sh"
  exit 1
fi

# 2. VALIDATE BUILD DIRECTORY
# Check if the build directory exists before proceeding.
if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: Build directory not found at '$BUILD_DIR'."
  echo "Please run 'ng build' before deploying."
  exit 1
fi

echo "Backend URL is set to: $BACKEND_URL"
echo "Generating app.yaml inside '$BUILD_DIR'..."

# 3. GENERATE app.yaml IN THE CORRECT LOCATION
# Use 'sed' to replace the placeholder and output the final app.yaml
# directly into the specified build directory.
sed "s|__BACKEND_API_URL__|$BACKEND_URL|g" app.template.yaml > "$BUILD_DIR/app.yaml"

echo "app.yaml generated successfully."
echo "-----------------------------------"
# Optional: print the generated file's content for verification.
cat "$BUILD_DIR/app.yaml"
echo "-----------------------------------"

# 4. DEPLOY TO GOOGLE APP ENGINE
# Point the gcloud command to the app.yaml inside the build directory.
# App Engine will then upload the contents of that directory.
#echo "Deploying to App Engine from '$BUILD_DIR'..."
#gcloud app deploy "$BUILD_DIR/app.yaml"

#echo "Deployment complete."