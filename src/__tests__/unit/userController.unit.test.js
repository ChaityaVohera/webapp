const {
  createUser,
  updateUser,
  getUserInfo,
} = require("../../controllers/userController");
const User = require("../../models/user");
const { PublishCommand, SNSClient } = require("@aws-sdk/client-sns");
const EmailsSent = require("../../models/emails_sent");

// Mock the required dependencies using Jest
jest.mock("../../models/user");
jest.mock("../../models/emails_sent");
jest.mock("@aws-sdk/client-sns");

describe("User Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test to avoid interference
  });

  // Test createUser functionality
  describe("createUser", () => {
    it("should return 201 and create a user with valid data", async () => {
      const req = {
        body: {
          email: "unit.test@example.com",
          password: "Test123!",
          first_name: "Unit",
          last_name: "Test",
        },
        headers: {
          "x-forwarded-proto": "https", // Mock the X-Forwarded-Proto header
        },
        get: jest.fn().mockReturnValue("localhost:3000"), // Mock request host
        protocol: "http", // Mock request protocol
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      };

      // Mock user creation and SNS publishing
      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.create.mockResolvedValue({
        id: "1234",
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        account_created: new Date(),
        account_updated: new Date(),
      });

      EmailsSent.create.mockResolvedValue(true); // Mock email record creation
      SNSClient.prototype.send = jest.fn().mockResolvedValue({}); // Mock SNS send success

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "unit.test@example.com",
          first_name: "Unit",
          last_name: "Test",
        })
      );
    });

    it("should return 400 if email already exists", async () => {
      const req = {
        body: {
          email: "unit.test@example.com",
          password: "Test123!",
          first_name: "Unit",
          last_name: "Test",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // Mock user already exists
      User.findOne.mockResolvedValue({
        id: "1234",
        email: "unit.test@example.com",
      });

      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 500 for internal server error", async () => {
      const req = {
        body: {
          email: "unit.test@example.com",
          password: "Test123!",
          first_name: "Unit",
          last_name: "Test",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // Mock user creation failure
      User.findOne.mockRejectedValue(new Error("Database error"));

      await createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalled();
    });
  });

  // Test updateUser functionality
  describe("updateUser", () => {
    it("should return 204 for a successful update", async () => {
      const req = {
        authUser: { email: "unit.test@example.com" },
        body: {
          first_name: "Updated",
          last_name: "Test",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // Mock finding and updating the user
      User.findOne.mockResolvedValue({
        first_name: "Unit",
        last_name: "Test",
        save: jest.fn().mockResolvedValue(true),
      });

      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 404 if the user is not found", async () => {
      const req = {
        authUser: { email: "unit.test@example.com" },
        body: {
          first_name: "Updated",
          last_name: "Test",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // Mock user not found
      User.findOne.mockResolvedValue(null);

      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  // Test getUserInfo functionality
  describe("getUserInfo", () => {
    it("should return 200 and user information for a valid user", async () => {
      const req = {
        authUser: { email: "unit.test@example.com" },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock finding the user
      User.findOne.mockResolvedValue({
        id: "1234",
        email: "unit.test@example.com",
        first_name: "Unit",
        last_name: "Test",
        account_created: new Date(),
        account_updated: new Date(),
      });

      await getUserInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "unit.test@example.com",
          first_name: "Unit",
          last_name: "Test",
        })
      );
    });

    it("should return 404 if the user is not found", async () => {
      const req = {
        authUser: { email: "unit.test@example.com" },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // Mock user not found
      User.findOne.mockResolvedValue(null);

      await getUserInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
