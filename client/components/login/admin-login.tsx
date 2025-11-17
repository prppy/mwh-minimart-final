import { useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "@/contexts/auth-context";

import { Button, ButtonIcon, ButtonText } from "../ui/button";
import { FormControl } from "../ui/form-control";
import { HStack } from "../ui/hstack";
import { Icon } from "../ui/icon";
import { Image } from "../ui/image";
import { Input, InputField } from "../ui/input";
import { Pressable } from "../ui/pressable";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import { Fingerprint, UserRound } from "lucide-react-native";

const AdminLoginForm: React.FC = () => {
  const logo = require("@/assets/horizontal_logo_with_words.png");
  const { loginOfficer } = useAuth();
  const router = useRouter();

  const [officerEmail, setOfficerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOfficerLogin = async () => {
    if (!officerEmail.trim()) {
      setIsEmailInvalid(true);
      return;
    }

    if (!password.trim()) {
      setIsPasswordInvalid(true);
      return;
    }

    setLoading(true);
    try {
      await loginOfficer(officerEmail.trim(), password.trim());

      // login successful
      console.log("Officer logged in:", officerEmail);
      setOfficerEmail("");
      setPassword("");

      router.push("/(admin)");
    } catch (error: any) {
      console.error("Resident login failed:", error.message || error);
      // show some error message to user
      alert("Login failed: " + (error.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  // TODO: finish forget password functionality
  const handleForgotPassword = () => {};

  return (
    <VStack space="lg" className="w-1/3 p-5 bg-white rounded-lg">
      <Image source={logo} alt="logo" className="w-full" />

      <FormControl isInvalid={isEmailInvalid}>
        <Text className="text-indigoscale-700">Email</Text>
        <Input>
          <InputField
            placeholder="Email"
            value={officerEmail}
            onChangeText={(text) => setOfficerEmail(text)}
          />
        </Input>
      </FormControl>

      <FormControl isInvalid={isPasswordInvalid}>
        <Text className="text-indigoscale-700">Password</Text>
        <Input>
          <InputField
            placeholder="Password"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
        </Input>
      </FormControl>

      <HStack className="w-full justify-center" space="lg">
        <Pressable
          onPress={handleOfficerLogin}
          disabled={loading}
          className="bg-indigoscale-700 p-2 rounded-full"
        >
          <Icon as={Fingerprint} size="xl" className="text-white" />
        </Pressable>
        <Button
          action="primary"
          onPress={handleOfficerLogin}
          isDisabled={loading}
          className="bg-indigoscale-700"
        >
          <ButtonIcon as={UserRound} size="xl" />
          <ButtonText>Sign In</ButtonText>
        </Button>
      </HStack>
      <Button action="secondary" variant="link" onPress={handleForgotPassword}>
        <ButtonText className="text-redscale-500">Forgot Password?</ButtonText>
      </Button>
    </VStack>
  );
};

export default AdminLoginForm;
