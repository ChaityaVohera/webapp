#!/bin/bash
echo "Setting up and starting the Node.js application"

cat << EOF | sudo tee /etc/systemd/system/webapp.service
[Unit]
Description=Node.js Web App
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/webapp/src/server.js
Restart=always
User=csye6225
Group=csye6225
Environment=PATH=/usr/bin:/usr/local/bin
# EnvironmentFile=/opt/webapp/.env  # Load variables from the .env file
WorkingDirectory=/opt/webapp

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable the webapp service
sudo systemctl daemon-reload
sudo systemctl enable webapp
sudo systemctl start webapp
sudo systemctl restart amazon-cloudwatch-agent
sudo systemctl restart webapp.service
sudo systemctl status webapp

