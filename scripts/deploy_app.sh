#!/bin/bash

# Move to /opt/webapp directory
cd /opt/webapp

# Unzip the webapp.zip file
sudo unzip -o webapp.zip
sudo rm webapp.zip

# Change the ownership of the webapp directory to csye6225
sudo chown -R csye6225:csye6225 /opt/webapp

# Check if package.json exists
if [ ! -f /opt/webapp/package.json ]; then
  echo "Error: package.json not found in /opt/webapp"
  exit 1
fi

# Check if server.js exists
if [ ! -f /opt/webapp/src/server.js ]; then
  echo "Error: server.js not found in /opt/webapp/src"
  exit 1
fi

# Install Node.js dependencies
sudo -u csye6225 npm install --prefix /opt/webapp

# Install PM2 globally
sudo npm install -g pm2

#Install AWS V3
sudo npm install @aws-sdk/client-s3
sudo npm install express multer
sudo npm install node-statsd
sudo npm install winston

# Run database migrations (with custom config if needed)
sudo npx sequelize-cli db:migrate --config src/config/database.js

# Start the application using PM2
pm2 start /opt/webapp/src/server.js --name webapp

# Ensure PM2 restarts on server reboot
pm2 startup
pm2 save
