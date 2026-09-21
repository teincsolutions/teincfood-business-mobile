// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { ScrollView, Pressable } from "react-native";
import { YStack, XStack, Text, Card, Separator, Switch, Sheet, Spinner, useMedia } from "tamagui";
import {
  Printer,
  Plus,
  Trash2,
  CheckCircle,
  Wifi,
  Search,
  AlertCircle,
  RefreshCw,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button, FormInput } from "@/components/ui";
import { usePrinterStore, type PrinterConfig } from "@/stores/printer.store";
import { SampleReceiptPreview } from "@/components/settings/SampleReceiptPreview";
import { printService } from "@/services/print.service";
import { toast } from "sonner-native";
import Zeroconf from 'react-native-zeroconf';

export default function PrinterSettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const printers = usePrinterStore((s) => s.printers);
  const defaultPrinterId = usePrinterStore((s) => s.defaultPrinterId);
  const autoPrint = usePrinterStore((s) => s.autoPrint);
  const setDefaultPrinter = usePrinterStore((s) => s.setDefaultPrinter);
  const addPrinter = usePrinterStore((s) => s.addPrinter);
  const removePrinter = usePrinterStore((s) => s.removePrinter);
  const setAutoPrint = usePrinterStore((s) => s.setAutoPrint);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("9100");
  const [discovering, setDiscovering] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<{ name: string; ip: string; port: number }[]>([]);
  const zeroconfRef = useRef(null);

  // Cleanup zeroconf on unmount
  useEffect(() => {
    return () => {
      if (zeroconfRef.current) {
        try { zeroconfRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startDiscovery = () => {
    setDiscovering(true);
    setDiscoveredPrinters([]);

    try {
      const zc = new Zeroconf();
      zeroconfRef.current = zc;

      // Listen for services found via mDNS (_printer._tcp, _ipp._tcp, _pdl-datastream._tcp)
      zc.on('found', (name, fullName, info) => {
        const printerIp = info?.addresses?.[0] || info?.host || '';
        const printerPort = info?.port || 9100;
        if (printerIp) {
          setDiscoveredPrinters((prev) => {
            const exists = prev.some((p) => p.ip === printerIp);
            if (exists) return prev;
            return [...prev, { name: name || fullName?.split('.')[0] || 'Printer', ip: printerIp, port: printerPort }];
          });
        }
      });

      zc.on('error', (err) => {
        console.debug('[Zeroconf] Error:', err);
      });

      zc.on('stopped', () => {
        setDiscovering(false);
      });

      // Scan common printer service types
      const types = ['_printer._tcp', '_ipp._tcp', '_pdl-datastream._tcp', '_ipps._tcp'];
      types.forEach((type) => zc.scan(type, 'local', 'tcp'));

      // Timeout after 8 seconds
      setTimeout(() => {
        if (zeroconfRef.current) {
          try { zc.stop(); } catch {}
        }
        setDiscovering(false);
        if (discoveredPrinters.length === 0) {
          toast.info('No printers found. You can add one manually below.');
        }
      }, 8000);
    } catch (err) {
      console.debug('[Zeroconf] Failed to start:', err);
      setDiscovering(false);
      toast.error('Printer discovery not available on this device');
    }
  };

  const addDiscoveredPrinter = (p: { name: string; ip: string; port: number }) => {
    addPrinter({
      id: Date.now().toString(),
      name: p.name,
      ip: p.ip,
      port: p.port,
      type: 'tcp',
    });
    toast.success(`Added ${p.name}`);
    setDiscoveredPrinters((prev) => prev.filter((x) => x.ip !== p.ip));
  };

  const handleAddManual = () => {
    if (!name.trim() || !ip.trim()) return;
    addPrinter({
      id: Date.now().toString(),
      name: name.trim(),
      ip: ip.trim(),
      port: parseInt(port, 10) || 9100,
      type: 'tcp',
    });
    setName("");
    setIp("");
    setPort("9100");
    setAddSheetOpen(false);
    toast.success("Printer added");
  };

  const handleTestPrint = async (printer: PrinterConfig) => {
    toast.info("Sending test print...");
    try {
      await printService.sendToTcpPrinter(printer.ip, printer.port,
        "═══════════════════════════════════\n" +
        "         TEINCFOOD - TEST PRINT        \n" +
        "═══════════════════════════════════\n" +
        "Printer: " + printer.name + "\n" +
        "IP: " + printer.ip + ":" + printer.port + "\n" +
        "───────────────────────────────────\n" +
        "If you can read this, your printer\n" +
        "is configured correctly!\n" +
        "═══════════════════════════════════\n"
      );
      toast.success("Test print sent");
    } catch (err) {
      toast.error("Print failed — check printer is on and on same network");
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top} {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <Text fontSize="$6" fontWeight="bold">Printer Settings</Text>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4">
          {/* Auto-Print Toggle */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold">Auto-Print New Orders</Text>
                <Text fontSize="$3" color="$colorMuted">
                  Automatically print receipts for new and completed orders
                </Text>
              </YStack>
              <Switch checked={autoPrint} onCheckedChange={setAutoPrint}
                backgroundColor={autoPrint ? "$green10" : "$gray800"}>
                <Switch.Thumb backgroundColor="white" />
              </Switch>
            </XStack>
          </Card>

          {/* Discover Printers */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">Find Printers</Text>
                <Button
                  size="$3"
                  variant={discovering ? "primary" : "outline"}
                  icon={discovering ? <Spinner /> : <Search size={16} />}
                  onPress={startDiscovery}
                  disabled={discovering}
                >
                  {discovering ? "Scanning..." : "Scan Network"}
                </Button>
              </XStack>
              <Text fontSize="$3" color="$colorMuted">
                Scans your network for thermal printers. Make sure your printer is on the same WiFi network.
              </Text>

              {discoveredPrinters.length > 0 && (
                <>
                  <Separator />
                  {discoveredPrinters.map((p, i) => (
                    <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical="$2">
                      <YStack flex={1}>
                        <Text fontWeight="600" fontSize="$4">{p.name}</Text>
                        <Text fontSize="$3" color="$colorMuted">{p.ip}:{p.port}</Text>
                      </YStack>
                      <Button size="$3" variant="primary" onPress={() => addDiscoveredPrinter(p)}>
                        Add
                      </Button>
                    </XStack>
                  ))}
                </>
              )}
            </YStack>
          </Card>

          {/* Configured Printers */}
          <Text fontSize="$5" fontWeight="bold">Your Printers</Text>

          {printers.length === 0 && (
            <Card padding="$6" bordered>
              <YStack alignItems="center" gap="$3">
                <Printer size={48} color="$colorMuted" />
                <Text color="$colorMuted" textAlign="center">
                  No printers configured yet. Tap "Scan Network" to find printers or add one manually.
                </Text>
              </YStack>
            </Card>
          )}

          {printers.map((printer) => (
            <Card key={printer.id} padding="$4" bordered>
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Printer size={20} color="$colorMuted" />
                    <Text fontWeight="bold">{printer.name}</Text>
                  </XStack>
                  <Pressable onPress={() => removePrinter(printer.id)}>
                    <Trash2 size={18} color="$red10" />
                  </Pressable>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <Wifi size={14} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">{printer.ip}:{printer.port}</Text>
                </XStack>
                <Separator />
                <XStack gap="$3">
                  <Button flex={1} size="$3" variant="outline" onPress={() => handleTestPrint(printer)}>
                    Test Print
                  </Button>
                  <Button flex={1} size="$3" variant={defaultPrinterId === printer.id ? "primary" : "outline"}
                    onPress={() => setDefaultPrinter(defaultPrinterId === printer.id ? null : printer.id)}>
                    {defaultPrinterId === printer.id ? "Default ✓" : "Set Default"}
                  </Button>
                </XStack>
              </YStack>
            </Card>
          ))}

          {/* Add Manually */}
          <Button variant="outline" icon={<Plus size={18} />} onPress={() => setAddSheetOpen(true)}>
            Add Printer Manually
          </Button>

          {/* Sample Receipt */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <YStack gap="$1">
                <Text fontSize="$5" fontWeight="bold">Sample receipt</Text>
                <Text fontSize="$3" color="$colorMuted">
                  Preview of an 80mm thermal receipt with a sample order.
                </Text>
              </YStack>
              <SampleReceiptPreview />
            </YStack>
          </Card>

          {/* Info */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <AlertCircle size={16} color="$blue10" />
                <Text fontWeight="bold" fontSize="$4" color="$blue10">Tips</Text>
              </XStack>
              <Text fontSize="$3" color="$colorMuted">
                • Use "Scan Network" to find printers automatically
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                • Make sure your POS device and printer are on the same WiFi network
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                • Most thermal printers use port 9100 (ESC/POS)
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      {/* Add Manual Sheet */}
      <Sheet modal open={addSheetOpen} onOpenChange={setAddSheetOpen} snapPoints={[55]} dismissOnSnapToBottom zIndex={200_000}>
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$6"           {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}>
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4">
            <Text fontSize="$6" fontWeight="bold">Add Printer Manually</Text>
            <FormInput label="Printer Name" placeholder="e.g., Kitchen Printer" value={name} onChangeText={setName} />
            <FormInput label="IP Address" placeholder="e.g., 192.168.1.100" value={ip} onChangeText={setIp} autoCapitalize="none" autoCorrect={false} keyboardType="numeric" />
            <FormInput label="Port" placeholder="9100" value={port} onChangeText={setPort} keyboardType="numeric" />
            <Button backgroundColor="$primary" onPress={handleAddManual} disabled={!name.trim() || !ip.trim()}>
              Save Printer
            </Button>
            <Button variant="outline" onPress={() => setAddSheetOpen(false)}>Cancel</Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
