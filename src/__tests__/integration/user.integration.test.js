const request = require("supertest");
const sequelize = require("../../config/database");
const app = require("../../server");

describe("User API Integration Tests", () => {
  // Pre-setup hooks
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create and verify a test user for testing GET and PUT requests
    await sequelize.models.User.create({
      first_name: "Alex",
      last_name: "Smith",
      email: "alex.smith@example.com",
      password: "password123",
      is_verified: true, // Ensure the user is verified
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("should create a new user with valid data", async () => {
    const response = await request(app).post("/v1/user").send({
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      password: "password123",
    });

    // Verify the created user after creation
    await sequelize.models.User.update(
      { is_verified: true },
      { where: { email: "john.doe@example.com" } }
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email", "john.doe@example.com");
  });

  test("should return 400 for invalid email format", async () => {
    const response = await request(app).post("/v1/user").send({
      first_name: "Invalid",
      last_name: "Email",
      email: "invalid-email",
      password: "password123",
    });

    expect(response.statusCode).toBe(400);
  });

  test("should fetch user info with valid credentials", async () => {
    const auth = Buffer.from("alex.smith@example.com:password123").toString(
      "base64"
    );

    const response = await request(app)
      .get("/v1/user/self")
      .set("Authorization", `Basic ${auth}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("email", "alex.smith@example.com");
  });

  test("should update user info with valid fields", async () => {
    const auth = Buffer.from("alex.smith@example.com:password123").toString(
      "base64"
    );

    const response = await request(app)
      .put("/v1/user/self")
      .set("Authorization", `Basic ${auth}`)
      .send({
        first_name: "Alexander",
      });

    expect(response.statusCode).toBe(204);
  });

  test("should return 401 for invalid credentials", async () => {
    const auth = Buffer.from("wrong.email@example.com:wrongpassword").toString(
      "base64"
    );

    const response = await request(app)
      .get("/v1/user/self")
      .set("Authorization", `Basic ${auth}`);

    expect(response.statusCode).toBe(401);
  });
});
