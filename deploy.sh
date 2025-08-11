#!/bin/bash

# Stop script on any error
set -e

# Fetch the latest code from GitHub
git pull origin main

# Install dependencies
npm install

# Build the app
npm run build

# Restart the PM2 process
pm2 stop storyMaker
pm2 start storyMaker

echo "Deployment complete."