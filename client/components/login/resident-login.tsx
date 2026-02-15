import { Resident } from "@/utils/types";
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import EmptyAlert from "../custom-empty-alert";
import { Center } from "../ui/center";
import SearchBar from "../custom-searchbar";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import CustomSpinner from "../custom-spinner";
import { HStack } from "../ui/hstack";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";
import { Pressable } from "../ui/pressable";
import { Icon } from "../ui/icon";
import { ChevronRight, X } from "lucide-react-native";
import api from "@/utils/api";
import { Box } from "../ui/box";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "../ui/modal";
import { Heading } from "../ui/heading";
import { Button, ButtonText } from "../ui/button";
import { Input, InputField } from "../ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "expo-router";

const ResidentLoginForm: React.FC = () => {
  const router = useRouter();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState("");
  const [resident, setResident] = useState<Resident>();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginResident } = useAuth();

  const handleResidentSelect = (resident: Resident) => {
    setResident(resident);
    setShowModal(true);
  };

  const handleResidentLogin = async () => {
    if (!resident || !password.trim()) {
      console.log("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await loginResident(resident.id, password.trim());

      // login successful
      console.log("Resident logged in:", resident.userName);
      setShowModal(false);
      setPassword("");

      router.push("/(resident)");
    } catch (error: any) {
      console.error("Resident login failed:", error.message || error);
      // show some error message to user
      alert("Login failed: " + (error.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        const usersResponse = await api.get("users?role=resident");
        let fetchedResidents = usersResponse.data.data.users ?? [];

        const parsedResidents: Resident[] = fetchedResidents
          .filter((u: any) => u.userRole === "resident" && u.resident)
          .map((u: any) => ({
            id: u.id,
            userId: u.resident.userId,
            userName: u.userName,
            userRole: "resident",
            profilePicture: u.profilePicture ?? null,

            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),

            batchNumber: u.resident.batchNumber,
            currentPoints: u.resident.currentPoints,
            totalPoints: u.resident.totalPoints,

            dateOfAdmission: new Date(u.resident.dateOfAdmission),
            dateOfBirth: new Date(u.resident.dateOfBirth),
            lastAbscondence: u.resident.lastAbscondence ?? null,

            backgroundType: u.resident.backgroundType,
            wallpaperType: u.resident.wallpaperType,
          }));

        setResidents(parsedResidents);
      } catch (error) {
        console.error("Failed to fetch residents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  const filteredResidents = useMemo(() => {
    return residents.filter((res) =>
      res.userName.toLowerCase().includes(search.toLowerCase())
    );
  }, [residents, search]);

  return (
    <>
      <Center className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
        {loading ? (
          <CustomSpinner text="Loading residents..." />
        ) : residents.length === 0 ? (
          <EmptyAlert text="No residents found!" />
        ) : (
          <VStack className="w-full" space="lg">
            <Box className="w-full">
              <SearchBar search={search} setSearch={setSearch} />
            </Box>
            <ScrollView className="max-h-96">
              <VStack space="md">
                {filteredResidents.map((res) => (
                  <Pressable
                    key={res.id}
                    onPress={() => handleResidentSelect(res)}
                  >
                    <HStack
                      className={`bg-${res.wallpaperType}scale-300 p-4 justify-between items-center rounded-lg`}
                      space="md"
                    >
                      <Avatar
                        size="md"
                        className={`border-2 border-${res.wallpaperType}scale-500 bg-${res.wallpaperType}scale-700`}
                      >
                        <AvatarFallbackText>{res.userName}</AvatarFallbackText>
                        <AvatarImage source={{ uri: res.profilePicture }} />
                      </Avatar>
                      <HStack className="flex-1 justify-between items-center" space="md">
                        <Text className="text-white text-lg" bold>
                          {res.userName}
                        </Text>

                        <Icon
                          as={ChevronRight}
                          size="xl"
                          className={`text-${res.wallpaperType}scale-700`}
                        />
                      </HStack>
                    </HStack>
                  </Pressable>
                ))}
              </VStack>
            </ScrollView>
          </VStack>
        )}
      </Center>
      {/* resident login modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPassword("");
        }}
        avoidKeyboard
        size="md"
      >
        <ModalBackdrop />
        {resident && (
          <ModalContent>
            <ModalHeader>
              <Heading size="lg">Resident Login</Heading>
              <ModalCloseButton>
                <Icon as={X} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <VStack className="justify-center items-center py-4" space="lg">
                <Avatar
                  size="xl"
                  className={`border-4 border-${resident.wallpaperType}scale-500 bg-${resident.wallpaperType}scale-700`}
                >
                  <AvatarFallbackText>{resident.userName}</AvatarFallbackText>
                  <AvatarImage source={{ uri: resident.profilePicture }} />
                </Avatar>
                <Text
                  size="xl"
                  className={`text-${resident.wallpaperType}scale-500`}
                  bold
                >
                  {resident.userName}
                </Text>
                <Input variant="outline" size="lg" className="w-full">
                  <InputField
                    placeholder="Enter password here..."
                    type="password"
                    value={password}
                    onChangeText={setPassword}
                  />
                </Input>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                action="secondary"
                className="mr-3"
                onPress={() => {
                  setShowModal(false);
                  setPassword("");
                }}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                onPress={handleResidentLogin}
                className={`bg-${resident.wallpaperType}scale-500`}
                isDisabled={loading}
              >
                <ButtonText>{loading ? "Logging in..." : "Login"}</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </>
  );
};

export default ResidentLoginForm;