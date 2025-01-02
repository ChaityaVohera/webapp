packer {
  required_plugins {
    amazon = {
      version = "~> 1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# Variable Definitions
variable "region" { type = string }
variable "source_ami" { type = string }
variable "instance_type" { type = string }
variable "ssh_username" { type = string }
variable "ami_name" { type = string }
variable "ami_description" { type = string }
variable "DB_HOST" { type = string }
variable "DB_USER" { type = string }
variable "DB_PASSWORD" { type = string }
variable "DB_NAME" { type = string }
variable "DB_PORT" { type = string }
variable "APP_PORT" { type = string }
variable "NODE_ENV" { type = string }

# Web application source zip path
variable "webapp_zip_path" {
  type    = string
  default = "./webapp.zip"
}

# Option to use a dummy zip file for testing
variable "use_dummy_zip" {
  type    = bool
  default = false
}

# Amazon EBS Builder
source "amazon-ebs" "ubuntu" {
  region          = var.region
  source_ami      = var.source_ami
  instance_type   = var.instance_type
  ssh_username    = var.ssh_username
  ami_name        = "${var.ami_name}-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
  ami_description = var.ami_description
}

# Build and Provisioning Steps
build {
  name    = "build-ami"
  sources = ["source.amazon-ebs.ubuntu"]

  # Step 1: Install Node.js and other dependencies
  provisioner "shell" { script = "scripts/install_node.sh" }

  # Step 2: Install Amazon CloudWatch Agent
  provisioner "shell" { script = "scripts/install_cloudwatch_agent.sh" }

  # Step 3: Create a non-root user for application
  provisioner "shell" { script = "scripts/create_user.sh" }

  # Step 4: Install Unzip utility
  provisioner "shell" { script = "scripts/install_unzip.sh" }

  # Step 5: Set up the application directory
  provisioner "shell" { script = "scripts/create_webapp_dir.sh" }

  # Step 6: Copy webapp package to the instance
  provisioner "file" {
    source      = var.use_dummy_zip ? "dummy.zip" : var.webapp_zip_path
    destination = "/opt/webapp/webapp.zip"
  }

  # Step 7: Copy CloudWatch configuration to /tmp/ first
  provisioner "file" {
    source      = "src/config/cloudwatch-agent-config.json"
    destination = "/tmp/cloudwatch-agent-config.json"
  }

  # Step 8: Move the CloudWatch configuration file to the correct directory with sudo
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/",
      "sudo mv /tmp/cloudwatch-agent-config.json /opt/aws/amazon-cloudwatch-agent/amazon-cloudwatch-agent.json",
      "sudo chown root:root /opt/aws/amazon-cloudwatch-agent/amazon-cloudwatch-agent.json",
      "sudo cat /opt/aws/amazon-cloudwatch-agent/amazon-cloudwatch-agent.json"
    ]
  }

  # Step 9: Deploy the web application (unzip and set up the app)
  provisioner "shell" {
    script = "scripts/deploy_app.sh"
    environment_vars = [
      "DB_HOST=${var.DB_HOST}",
      "DB_USER=${var.DB_USER}",
      "DB_PASSWORD=${var.DB_PASSWORD}",
      "DB_NAME=${var.DB_NAME}",
      "DB_PORT=${var.DB_PORT}",
      "APP_PORT=${var.APP_PORT}",
      "NODE_ENV=${var.NODE_ENV}"
    ]
  }

  # Step 10: Start the web application
  provisioner "shell" {
    script = "scripts/start_app.sh"
    environment_vars = [
      "DB_HOST=${var.DB_HOST}",
      "DB_USER=${var.DB_USER}",
      "DB_PASSWORD=${var.DB_PASSWORD}",
      "DB_NAME=${var.DB_NAME}",
      "DB_PORT=${var.DB_PORT}",
      "APP_PORT=${var.APP_PORT}",
      "NODE_ENV=${var.NODE_ENV}"
    ]
  }

  # Step 11: Configure CloudWatch agent after installation
  provisioner "shell" {
    inline = [
      "sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/amazon-cloudwatch-agent.json -s"
    ]
  }

  # Final Step: Generate a Packer manifest file
  post-processor "manifest" {
    output     = "packer-manifest.json"
    strip_path = true
  }
}
