import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import styles from "./styles";
import { authAPI } from "./api";

// mya's edit
import { User } from "@/constants/types";
import api from "@/components/utility/api";

const ResidentLoginPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState<"resident" | "officer">(
    "resident"
  );
  const [officerEmail, setOfficerEmail] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");

  // Fetch users on component mount (only for resident login)
  useEffect(() => {
    if (loginType === "resident") {
      fetchUsers();
    }
  }, [loginType]);

  // const fetchUsers = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await authAPI.getUsersByRole("resident");

  //     if (Array.isArray(response?.data)) {
  //       setUsers(response.data.data.users);
  //       setFilteredUsers(response.data);
  //     } else {
  //       console.warn("Unexpected response format:", response?.data);
  //       setUsers([]);
  //       setFilteredUsers([]);
  //     }
  //   } catch (error: any) {
  //     console.error("Failed to fetch users:", error);
  //     Alert.alert("Error", "Failed to load users. Please try again.");
  //     setUsers([]);
  //     setFilteredUsers([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // mya's edit
  async function fetchUsers() {
    try {
      setLoading(true);

      const usersResponse = await api.get("users");
      const users = usersResponse.data.data.users ?? [];
      setUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);
  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPassword("");
    setError("");
    setShowPasswordModal(true);
  };

  const handleLogin = async () => {
    if (!selectedUser || !password.trim()) {
      setError("Please enter your password");
      return;
    }

    try {
      setLoginLoading(true);
      setError("");

      const response = await authAPI.loginResident({
        userId: selectedUser.id,
        plainPassword: password.trim(),
      });

      // Login successful
      console.log("Login successful:", response);

      // Close modal
      setShowPasswordModal(false);

      // Redirect to catalogue
      if (typeof window !== "undefined") {
        window.location.href = "http://localhost:8081/catalogue";
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      // Show error message based on status code
      if (error.status === 401 || error.status === 400) {
        setError("Incorrect password. Please try again.");
      } else if (error.status === 404) {
        setError("User not found. Please try again.");
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOfficerLogin = async () => {
    if (!officerEmail.trim() || !officerPassword.trim()) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoginLoading(true);
      setError("");

      const response = await authAPI.loginOfficer({
        officerEmail: officerEmail.trim(),
        plainPassword: officerPassword.trim(),
      });

      // Login successful
      console.log("Officer login successful:", response);

      // Redirect to catalogue
      if (typeof window !== "undefined") {
        window.location.href = "http://localhost:8081/catalogue";
      }
    } catch (error: any) {
      console.error("Officer login failed:", error);

      // Show error message based on status code
      if (error.status === 401 || error.status === 400) {
        setError("Incorrect email or password. Please try again.");
      } else if (error.status === 404) {
        setError("Officer not found. Please try again.");
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setPassword("");
    setError("");
  };

  const renderUserCard = (user: User) => (
    <TouchableOpacity
      key={user.id}
      style={styles.userCard}
      onPress={() => handleUserSelect(user)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.userName}</Text>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && loginType === "resident") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading residents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>👋 Welcome Back</Text>
          </View>

          {/* Login Type Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, loginType === "resident" && styles.activeTab]}
              onPress={() => setLoginType("resident")}
            >
              <Text
                style={[
                  styles.tabText,
                  loginType === "resident" && styles.activeTabText,
                ]}
              >
                Resident
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, loginType === "officer" && styles.activeTab]}
              onPress={() => setLoginType("officer")}
            >
              <Text
                style={[
                  styles.tabText,
                  loginType === "officer" && styles.activeTabText,
                ]}
              >
                Officer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - Only for Resident */}
        {loginType === "resident" && (
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearch}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content based on login type */}
      {loginType === "resident" ? (
        /* Resident Login - Users List */
        <ScrollView
          style={styles.usersList}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.length === 0 && users.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No residents found for "{searchQuery}"
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.retryButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No residents found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {searchQuery.length > 0 && (
                <Text style={styles.searchResults}>
                  {filteredUsers.length} result
                  {filteredUsers.length !== 1 ? "s" : ""} found
                </Text>
              )}
              {filteredUsers.map(renderUserCard)}
            </>
          )}
        </ScrollView>
      ) : (
        /* Officer Login - Login Form */
        <View style={styles.officerLoginContainer}>
          <View style={styles.officerLoginCard}>
            <Text style={styles.officerLoginTitle}>Officer Login</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="Enter your email"
                value={officerEmail}
                onChangeText={setOfficerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loginLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="Enter your password"
                value={officerPassword}
                onChangeText={setOfficerPassword}
                secureTextEntry={true}
                editable={!loginLoading}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.officerLoginButton,
                loginLoading && styles.officerLoginButtonDisabled,
              ]}
              onPress={handleOfficerLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.officerLoginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Password</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Selected User Info */}
            {selectedUser && (
              <View style={styles.selectedUserInfo}>
                <View style={styles.selectedAvatar}>
                  <Text style={styles.selectedAvatarText}>
                    {selectedUser.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.selectedUserName}>
                  {selectedUser.userName}
                </Text>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[styles.passwordInput, error ? styles.inputError : null]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoFocus={true}
                editable={!loginLoading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={loginLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loginLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ResidentLoginPage;
