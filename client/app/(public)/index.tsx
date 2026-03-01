import { Redirect } from "expo-router";

export default function PublicIndex() {
  return <Redirect href="/(public)/catalogue" />;
}
