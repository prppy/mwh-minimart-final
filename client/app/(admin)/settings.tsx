import React, { useEffect, useState } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { Clock, Save } from "lucide-react-native";

import api from "@/utils/api";
import { AppSettings } from "@/utils/types";
import { describeExpirySetting } from "@/utils/orders";

import Spinner from "@/components/custom-spinner";
import { Button, ButtonIcon, ButtonText } from "@/components/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const MOBILE_BREAKPOINT = 768;

// Choices for how long a redemption ticket stays valid
const EXPIRY_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: "Same day" },
  { days: 1, label: "Next day" },
  { days: 2, label: "2 days" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
];

const SettingsPage: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [saved, setSaved] = useState<AppSettings | null>(null);
  const [expiryDays, setExpiryDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("settings");
        setSaved(res.data.data);
        setExpiryDays(res.data.data.ticketExpiryDays);
      } catch (err: any) {
        setMessage({ ok: false, text: err?.message || "Could not load settings." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put("settings", { ticketExpiryDays: expiryDays }, { retries: 0 });
      setSaved(res.data.data);
      setMessage({ ok: true, text: "Settings saved." });
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || "Could not save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="Loading settings..." />;

  const dirty = saved?.ticketExpiryDays !== expiryDays;

  return (
    <ScrollView
      className="flex-1 bg-indigoscale-100"
      contentContainerStyle={{ padding: isMobile ? 12 : 24, alignItems: "center" }}
    >
      <VStack space="lg" style={{ width: "100%", maxWidth: 720 }}>
        <Heading size="2xl" style={{ color: "#1f3a93" }}>
          Settings
        </Heading>

        <VStack space="md" className="bg-white rounded-2xl p-5">
          <HStack space="sm" className="items-center">
            <Icon as={Clock} className="text-indigoscale-700" />
            <Heading size="md" className="text-indigoscale-900">
              Redemption ticket expiry
            </Heading>
          </HStack>
          <Text className="text-gray-600">
            How long residents have to collect a redemption ticket. Uncollected tickets
            expire automatically and the points are returned. For pre-orders, the time
            starts when the ticket is marked ready to collect.
          </Text>

          <HStack style={{ flexWrap: "wrap", gap: 8 }}>
            {EXPIRY_OPTIONS.map((option) => {
              const selected = option.days === expiryDays;
              return (
                <Button
                  key={option.days}
                  variant="outline"
                  className={selected ? "bg-indigoscale-700 border-indigoscale-700" : "bg-white border-indigoscale-300"}
                  onPress={() => setExpiryDays(option.days)}
                >
                  <ButtonText className={selected ? "text-white" : "text-indigoscale-700"}>
                    {option.label}
                  </ButtonText>
                </Button>
              );
            })}
          </HStack>

          <Text size="sm" style={{ color: "#1f3a93", fontWeight: "700" }}>
            Tickets will expire at {describeExpirySetting(expiryDays)} (11:59 pm Singapore time).
          </Text>

          {message && (
            <Text size="sm" className={message.ok ? "text-greenscale-700" : "text-redscale-700"}>
              {message.text}
            </Text>
          )}

          <Button
            className="bg-indigoscale-700 self-start"
            disabled={!dirty || saving}
            onPress={save}
          >
            <ButtonIcon as={Save} className="text-white" />
            <ButtonText className="text-white">{saving ? "Saving..." : "Save"}</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export default SettingsPage;
