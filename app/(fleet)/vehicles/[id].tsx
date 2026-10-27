import { useLocalSearchParams, useRouter } from "expo-router";
import { VehicleDetailView } from "@/components/fleet/VehicleDetailView";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return <VehicleDetailView vehicleId={id} onBack={() => router.back()} />;
}
