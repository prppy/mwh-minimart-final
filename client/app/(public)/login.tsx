import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import AdminLoginForm from "@/components/login/admin-login";
import ResidentLoginForm from "@/components/login/resident-login";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { ImageBackground } from "@/components/ui/image-background";

const background = require("@/assets/login.png");

const LoginPage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<"officer" | "resident">(
    "officer"
  );

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      imageStyle={{ opacity: 0.5 }}
      resizeMode="cover"
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, minHeight: '100%' }}
      >
        <Center className="flex-1 p-10">
          <HStack space="md" className="justify-center mb-8">
            <Button
              size="lg"
              onPress={() => setActiveRole("resident")}
              className={
                activeRole === "resident" ? "bg-indigoscale-700" : "bg-white"
              }
            >
              <ButtonText
                className={
                  activeRole === "resident" ? "text-white" : "text-indigoscale-700"
                }
              >
                Resident
              </ButtonText>
            </Button>
            <Button
              size="lg"
              onPress={() => setActiveRole("officer")}
              className={
                activeRole === "officer" ? "bg-indigoscale-700" : "bg-white"
              }
            >
              <ButtonText
                className={activeRole === "officer" ? "text-white" : "text-indigoscale-700"}
              >
                Officer
              </ButtonText>
            </Button>
          </HStack>
          {activeRole === "officer" ? <AdminLoginForm /> : <ResidentLoginForm />}
        </Center>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default LoginPage;