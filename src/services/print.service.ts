import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';
import { usePrinterStore } from '@/stores/printer.store';
import { toast } from 'sonner-native';

export const printService = {
  async fetchReceipt(orderId: string, format: 'html' | 'escpos' = 'html'): Promise<string> {
    const token = useAuthStore.getState().accessToken;
    const url = `${API_BASE_URL}/orders/${orderId}/receipt?format=${format}`;
    console.debug('[PrintService] fetchReceipt', { url, format });
    const response = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: format === 'html' ? 'text/html' : 'text/plain',
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.debug('[PrintService] fetchReceipt failed', { status: response.status, body });
      throw new Error(`Failed to fetch receipt (${response.status}): ${body.slice(0, 200)}`);
    }
    return response.text();
  },

  async printOrderReceipt(orderId: string): Promise<void> {
    const { autoPrint, printers, defaultPrinterId } = usePrinterStore.getState();

    // If auto-print is on and a default printer is set, try direct TCP
    if (autoPrint && defaultPrinterId) {
      const printer = printers.find((p) => p.id === defaultPrinterId);
      if (printer && printer.type === 'tcp') {
        try {
          const escposText = await this.fetchReceipt(orderId, 'escpos');
          await this.sendToTcpPrinter(printer.ip, printer.port, escposText);
          toast.success('Receipt printed');
          return;
        } catch (error) {
          console.debug('[Print] TCP print failed, falling back', error);
        }
      }
    }

    // Fallback: fetch HTML receipt and use system print/share dialog
    try {
      const html = await this.fetchReceipt(orderId, 'html');
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Print Receipt',
          mimeType: 'application/pdf',
        });
      } else {
        toast.success('Receipt saved to files');
      }
    } catch (error) {
      console.debug('[Print] Failed to print receipt', error);
      toast.error('Failed to print receipt');
    }
  },

  async sendToTcpPrinter(ip: string, port: number, text: string): Promise<void> {
    // Uses raw TCP socket to send ESC/POS text to network thermal printers
    // Falls back gracefully if TCP socket is not available
    try {
      const TcpSocket = require('react-native-tcp-socket');
      return new Promise((resolve, reject) => {
        const client = TcpSocket.createConnection(
          { host: ip, port, timeout: 5000 },
          () => {
            client.write(text);
            client.destroy();
            resolve();
          },
        );
        client.on('error', (err: Error) => {
          client.destroy();
          reject(err);
        });
        client.on('timeout', () => {
          client.destroy();
          reject(new Error('Connection timeout'));
        });
      });
    } catch (error) {
      throw new Error('TCP socket not available');
    }
  },
};
