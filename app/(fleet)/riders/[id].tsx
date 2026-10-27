import { useLocalSearchParams, useRouter } from "expo-router";
import { RiderDetailView } from "@/components/fleet/RiderDetailView";

export default function RiderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return <RiderDetailView riderId={id} onBack={() => router.back()} />;
}
