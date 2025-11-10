import { useState } from "react";

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
      className="flex-1"
      imageStyle={{ opacity: 0.5 }}
    >
      <Center className="flex-1 gap-5">
        <HStack space="md" className="justify-around">
          <Button
            size="lg"
            onPress={() => setActiveRole("resident")}
            className={
              activeRole === "resident" ? "bg-indigoscale-700" : "bg-white"
            }
          >
            <ButtonText
              className={
                activeRole === "resident" ? "" : "text-indigoscale-700"
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
              className={activeRole === "officer" ? "" : "text-indigoscale-700"}
            >
              Officer
            </ButtonText>
          </Button>
        </HStack>
        {activeRole === "officer" ? <AdminLoginForm /> : <ResidentLoginForm />}
      </Center>
    </ImageBackground>
  );
};

export default LoginPage;
