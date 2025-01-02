#!/bin/bash

# echo "Installing PostgreSQL"
# # Install PostgreSQL
# sudo apt-get update
# sudo apt-get install -y postgresql postgresql-contrib

# # Start PostgreSQL service
# sudo systemctl start postgresql
# sudo systemctl enable postgresql

# # Create the PostgreSQL database and user using environment variables passed from Packer
# sudo -i -u postgres psql <<EOF
# CREATE DATABASE ${DB_NAME};
# ALTER USER postgres WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
# GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO postgres;
# EOF
