#!/bin/bash

# Step 1: Create the /opt/webapp directory
sudo mkdir -p /opt/webapp

# Step 2: Give ubuntu user permission to upload files to /opt/webapp
# Temporarily set the owner to ubuntu
sudo chown ubuntu:ubuntu /opt/webapp
sudo chmod 755 /opt/webapp

# After Packer uploads the files, change the ownership to csye6225 in deploy_app.sh
