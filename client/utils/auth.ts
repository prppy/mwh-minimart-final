import api from "./api";

// Types
interface User {
  id: number;
  userName: string;
  userRole: "resident" | "officer" | "developer";
}

interface LoginResponse {
  message: string;
  data: User[];
}

interface ResidentLoginRequest {
  userId: number;
  password: string;
}

interface OfficerLoginRequest {
  officerEmail: string;
  password: string;
}

interface AuthResponse {
  message: string;
  accessToken?: string;
  refreshToken?: any;
  user: User;
  // Add other response properties as needed
}

// API Functions
export const authAPI = {
  /**
   * Fetch users by role
   * @param role - The role to filter users by (e.g., 'resident')
   * @returns Promise containing the users data
   */
  getUsersByRole: async (role: string): Promise<LoginResponse> => {
    try {
      const response = await api.get<LoginResponse>("/users/role", {
        params: { role },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch users with role ${role}:`, error);
      throw error;
    }
  },

  /**
   * Login as a resident
   * @param loginData - User ID and password for resident login
   * @returns Promise containing the authentication response
   */
  loginResident: async (
    loginData: ResidentLoginRequest
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>(
        "/authentication/login/resident",
        {
          userId: loginData.userId,
          password: loginData.password,
        }
      );
      console.log("auth response:", response);
      return response.data;
    } catch (error) {
      console.error("Resident login failed:", error);
      throw error;
    }
  },

  /**
   * Login as an officer
   * @param loginData - Email and password for officer login
   * @returns Promise containing the authentication response
   */
  loginOfficer: async (
    loginData: OfficerLoginRequest
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>(
        "/authentication/login/officer",
        {
          officerEmail: loginData.officerEmail,
          password: loginData.password,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Officer login failed:", error);
      throw error;
    }
  },
};

// Additional API functions can be added here for other features
export const userAPI = {
  /**
   * Get user profile by ID
   * @param userId - The user ID
   * @returns Promise containing user profile data
   */
  getUserProfile: async (userId: number) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user profile for ID ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param userId - The user ID
   * @param profileData - The updated profile data
   * @returns Promise containing the updated profile
   */
  updateUserProfile: async (userId: number, profileData: any) => {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update user profile for ID ${userId}:`, error);
      throw error;
    }
  },
};

export type {
  AuthResponse,
  LoginResponse,
  OfficerLoginRequest,
  ResidentLoginRequest,
  User,
};
