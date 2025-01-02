# Cloud Native Webapp 🌐

## Prerequisites 📋

Before you begin, ensure you have met the following requirements:

- Node.js installed on your local machine ([Download Node.js](https://nodejs.org/)) 📥
- PostgreSQL installed and running ([Download PostgreSQL](https://www.postgresql.org/)) 🐘

## Build and Deploy 🚀

To build and deploy the web application locally, follow these steps:

1. **Clone the Repository:** Clone the repository to your local machine:

   ```
   git clone https://github.com/ChaityaVohera/webapp.git
   ```

2. **Navigate to the Project Directory:**

   ```
   cd webapp
   ```

3. **Install Dependencies:**

   ```
   npm install
   ```

4. **Set Up Environment Variables:** Create a `.env` file in the root directory and configure it as follows:

   ```
   NODE_ENV=Environment
   DB_HOST=DB_HOSTNAME
   DB_PASSWORD=your_db_password
   PORT=8080
   DB_USER=your_db_user
   DB_NAME=your-db-name
   HOSTNAME=localhost
   ```

   Replace the placeholders with your PostgreSQL credentials.

5. **Run the Application:**

   ```
   npm start
   ```

6. **Access the Web Application:** Open your browser and navigate to `http://localhost:8080`.

# Packer Configuration 📦

Packer is used for creating machine images from a single source configuration. It helps in creating immutable infrastructure, ensuring consistency and reliability in the deployment process.

## Prerequisites 📋

Ensure you have a `.pkrvars` file for Packer variables. For reference, check `example.pkrvars`.

## Useful Packer Commands 🛠️

- **Initialize Packer Configuration:**
  ```shell
  packer init .
  ```
- **Format and Validate the Configuration:**
  ```shell
  packer fmt -var-file=variables.pkrvars.hcl aws-ubuntu.pkr.hcl
  ```
- **Validate the Configuration:**
  ```shell
  packer validate -var-file=variables.pkrvars.hcl aws-ubuntu.pkr.hcl
  ```
- **Build the Image:**
  ```shell
  packer build -var-file=variables.pkrvars.hcl aws-ubuntu.pkr.hcl
  ```

### CI/CD with Custom Image Creation and Rolling Updates 🛠️🔄

The "webapp" repository features highly efficient CI/CD pipelines powered by GitHub Actions. These pipelines go beyond simple code deployment, ensuring exceptional quality and reliability through comprehensive integration testing.

And that's not all! 🚀 We’ve supercharged our deployment strategy by incorporating Packer, delivering consistent and dependable deployments every time.

The CI/CD process is also designed to automatically generate fresh application images for each new version. Updates? No problem! The process effortlessly creates new instance templates for the Managed Instance Group (MIG) and seamlessly integrates them with a load balancer, ensuring uninterrupted and efficient traffic management. 🌐
