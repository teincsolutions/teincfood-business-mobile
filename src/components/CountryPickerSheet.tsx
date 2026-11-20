// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Input as TamaguiInput,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
  useTheme,
} from "tamagui";
import { Check, Search, X } from "@tamagui/lucide-icons";
import { PHONE_COUNTRIES } from "@teincfood/core";

interface CountryPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (iso: string) => void;
  title?: string;
  description?: string;
}

/**
 * Shared country / dial-code picker used by location, login, and signup.
 *
 * The list lives inside Sheet.ScrollView (not a plain ScrollView) so the
 * sheet's drag gesture and the list's scroll gesture cooperate on Android.
 */
export function CountryPickerSheet({
  open,
  onOpenChange,
  value,
  onSelect,
  title = "Select Your Country",
  description = "Choose your country for location and phone services.",
}: CountryPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const selectedIso = value?.trim().toUpperCase();

  useEffect(() => {
    if (open) {
      // The login phone field usually has the keyboard open when the selector
      // is tapped. Dismiss it first so the sheet is not hidden behind it.
      Keyboard.dismiss();
    } else {
      setQuery("");
    }
  }, [open]);

  const countries = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((country) =>
      `${country.name} ${country.iso} ${country.dialCode}`
        .toLowerCase()
        .includes(search),
    );
  }, [query]);

  const closeSheet = () => {
    Keyboard.dismiss();
    onOpenChange(false);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) Keyboard.dismiss();
        onOpenChange(nextOpen);
      }}
      snapPoints={[85]}
      snapPointsMode="percent"
      position={0}
      dismissOnSnapToBottom
      dismissOnOverlayPress
      zIndex={100_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.6)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <YStack flex={1} px="$5" pt="$3">
          <XStack items="flex-start" justifyContent="space-between" gap="$3">
            <YStack flex={1}>
              <Text
                fontSize="$6"
                fontWeight="800"
                color="$color"
                fontFamily="$heading"
              >
                {title}
              </Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                mt="$1"
              >
                {description}
              </Text>
            </YStack>
            <XStack
              width={36}
              height={36}
              borderRadius="$10"
              backgroundColor="$backgroundSoft"
              alignItems="center"
              justifyContent="center"
              pressStyle={{ opacity: 0.7 }}
              onPress={closeSheet}
              accessibilityRole="button"
              accessibilityLabel="Close country picker"
            >
              <X size={18} color="$colorSecondary" />
            </XStack>
          </XStack>

          <XStack
            height={50}
            br="$3"
            bg="$backgroundSoft"
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            px="$3"
            gap="$2"
            mt="$4"
            mb="$1"
          >
            <Search size={18} color="$colorSecondary" />
            <TamaguiInput
              flex={1}
              height={48}
              borderWidth={0}
              bg="transparent"
              color="$color"
              fontFamily="$body"
              fontSize="$4"
              placeholder="Search country or code"
              placeholderTextColor={theme.colorPlaceholder?.val as string}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query ? (
              <XStack
                width={30}
                height={30}
                borderRadius="$10"
                alignItems="center"
                justifyContent="center"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => setQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <X size={16} color="$colorSecondary" />
              </XStack>
            ) : null}
          </XStack>

          <Sheet.ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingTop: 4,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
          >
            {countries.length === 0 ? (
              <YStack items="center" py="$8" gap="$2">
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  color="$color"
                  fontFamily="$body"
                >
                  No countries found
                </Text>
                <Text
                  fontSize="$3"
                  color="$colorSecondary"
                  fontFamily="$body"
                  textAlign="center"
                >
                  Try a country name, ISO code, or dial code.
                </Text>
              </YStack>
            ) : (
              countries.map((country, index) => {
                const selected = selectedIso === country.iso;
                return (
                  <YStack key={country.iso}>
                    <XStack
                      items="center"
                      justifyContent="space-between"
                      py="$3"
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => {
                        Keyboard.dismiss();
                        onSelect(country.iso);
                        onOpenChange(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${country.name}, ${country.dialCode}`}
                    >
                      <YStack flex={1}>
                        <Text
                          fontSize="$4"
                          fontWeight="700"
                          color="$color"
                          fontFamily="$body"
                        >
                          {country.name}
                        </Text>
                        <Text
                          fontSize="$3"
                          color="$colorSecondary"
                          fontFamily="$body"
                        >
                          {country.iso}
                        </Text>
                      </YStack>
                      <XStack items="center" gap="$2">
                        <Text fontSize="$4" color="$color" fontFamily="$body">
                          {country.dialCode}
                        </Text>
                        {selected ? (
                          <Check size={16} color="$primary" />
                        ) : null}
                      </XStack>
                    </XStack>
                    {index < countries.length - 1 ? (
                      <Separator borderColor="$borderColor" />
                    ) : null}
                  </YStack>
                );
              })
            )}
          </Sheet.ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
