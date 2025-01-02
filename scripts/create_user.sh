#!/bin/bash
# Create group `csye6225` if it doesn't exist
if ! getent group csye6225 > /dev/null; then
  sudo groupadd csye6225
fi

# Create non-login user `csye6225`
sudo useradd -m -d /opt/webapp -s /usr/sbin/nologin -g csye6225 csye6225
