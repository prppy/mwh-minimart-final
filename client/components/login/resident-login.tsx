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
import { ChevronRight, Eye, EyeOff } from "lucide-react-native";
import api from "@/utils/api";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "../ui/modal";
import { Button, ButtonText } from "../ui/button";
import { Input, InputField, InputIcon, InputSlot } from "../ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "expo-router";

const ResidentLoginForm: React.FC = () => {
  const router = useRouter();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState("");
  const [resident, setResident] = useState<Resident>();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setShowPassword(false);

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
      res.userName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [residents, search]);

  return (
    <>
      <Center className="w-1/2 p-5 bg-white rounded-lg">
        {loading ? (
          <CustomSpinner text="Loading residents..." />
        ) : residents.length === 0 ? (
          <EmptyAlert text="No residents found!" />
        ) : (
          <VStack className="w-full max-h-[60vh]" space="lg">
            <HStack className="w-full h-12">
              <SearchBar search={search} setSearch={setSearch} />
            </HStack>
            <ScrollView>
              <VStack space="lg">
                {filteredResidents.map((res) => (
                  <Pressable
                    key={res.id}
                    onPress={() => handleResidentSelect(res)}
                  >
                    <HStack
                      className={`bg-${res.wallpaperType}scale-300 p-3 justify-between items-center rounded-md`}
                      space="md"
                    >
                      <Avatar
                        className={`border-2 border-${res.wallpaperType}scale-500 bg-${res.wallpaperType}scale-700`}
                      >
                        <AvatarFallbackText>{res.userName}</AvatarFallbackText>
                        <AvatarImage source={{ uri: res.profilePicture }} />
                      </Avatar>
                      <HStack className="flex-1 justify-between" space="md">
                        <Text className="text-white" bold>
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
        }}
        avoidKeyboard
        size="sm"
      >
        <ModalBackdrop />
        {resident && (
          <>
            <ModalContent>
              <ModalBody>
                <VStack className="justify-center items-center" space="md">
                  <Avatar
                    className={`border-2 border-${resident.wallpaperType}scale-500 bg-${resident.wallpaperType}scale-700`}
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
                  <Input variant="outline" size="lg">
                    <InputField
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <InputSlot
                      className="pr-3"
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      <InputIcon as={showPassword ? EyeOff : Eye } />
                    </InputSlot>
                  </Input>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  action="secondary"
                  className="mr-3"
                  onPress={() => {
                    setPassword("");
                    setShowPassword(false);
                    setShowModal(false);
                  }}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  onPress={handleResidentLogin}
                  className={`bg-${resident.wallpaperType}scale-500 data-[hover=true]:bg-${resident.wallpaperType}scale-700`}
                >
                  <ButtonText>Login</ButtonText>
                </Button>
              </ModalFooter>
            </ModalContent>
          </>
        )}
      </Modal>
    </>
  );
};

export default ResidentLoginForm;
