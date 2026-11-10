// @ts-nocheck
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Menu } from "@tamagui/lucide-icons";
import { Button } from "./Button";

/**
 * Menu button for shared screens rendered inside the seller drawer.
 * Keeps the drawer as the navigation shell instead of pushing a separate
 * stack screen over it.
 */
export function DrawerToggleButton() {
  const navigation = useNavigation();

  return (
    <Button
      width={40}
      height={40}
      circular
      backgroundColor="$backgroundSoft"
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      icon={<Menu size={20} color="$color" />}
    />
  );
}
