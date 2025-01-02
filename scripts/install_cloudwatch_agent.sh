#!/bin/bash

# Download and install the Amazon CloudWatch Agent
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Create necessary directories for the CloudWatch Agent configuration
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/
