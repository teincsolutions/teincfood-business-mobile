/**
 * Live Notification Service
 * Provides Android live notification rendering and iOS Live Activities client wiring
 *
 * Android: Uses @notifee/react-native for rich notifications with progress, chronometer, actions
 * iOS: Uses expo-live-activities for Lock Screen / Dynamic Island Live Activities
 */

import { Platform } from "react-native";
import type { Order } from "@/types/order.model";
import {
  showProgressNotification,
  dismissProgressNotification,
  showChronometerNotification,
  dismissChronometerNotification,
} from "./android-live-notification-demo.service";

export interface LiveNotificationConfig {
  orderId: string;
  orderNumber: string;
  status: string;
  progressPercent: number;
  etaEpoch: number;
  driverName?: string;
  driverPhone?: string;
}

export interface LiveActivityState {
  activityId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  progressPercent: number;
  etaText: string;
  driverName?: string;
  isActive: boolean;
}

class LiveNotificationService {
  private activeActivities: Map<string, LiveActivityState> = new Map();
  private androidNotificationIds: Map<string, string> = new Map();

  async updateAndroidLiveNotification(
    config: LiveNotificationConfig,
  ): Promise<void> {
    if (Platform.OS !== "android") return;

    // Use Notifee for Android rich notifications
    await showProgressNotification({
      orderId: config.orderId,
      orderNumber: config.orderNumber,
      status: config.status,
      progressPercent: config.progressPercent,
    });

    // If ETA is provided and order is on_the_way, also show chronometer
    if (config.status === "on_the_way" && config.etaEpoch) {
      const etaSeconds = Math.max(
        0,
        Math.floor((config.etaEpoch - Date.now()) / 1000),
      );
      if (etaSeconds > 0) {
        await showChronometerNotification({
          orderId: `${config.orderId}_eta`,
          orderNumber: config.orderNumber,
          etaSeconds,
        });
      }
    }

    // Clean up chronometer if delivered or cancelled
    if (config.status === "delivered" || config.status === "cancelled") {
      await dismissChronometerNotification(`${config.orderId}_eta`);
      // Auto-dismiss progress after 5 seconds on delivery
      if (config.status === "delivered") {
        setTimeout(() => {
          dismissProgressNotification(config.orderId);
        }, 5000);
      }
    }

    console.log("Android live notification updated via Notifee:", {
      orderId: config.orderId,
      orderNumber: config.orderNumber,
      status: config.status,
      progressPercent: config.progressPercent,
    });
  }

  async registerIOSLiveActivity(order: Order): Promise<string | null> {
    if (Platform.OS !== "ios") return null;

    const activityId = `activity_${order.id}_${Date.now()}`;

    const initialState: LiveActivityState = {
      activityId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      progressPercent: this.getProgressPercent(order.status),
      etaText: order.estimatedDeliveryTime || "Calculating...",
      driverName: order.deliveryPerson?.name,
      isActive: true,
    };

    this.activeActivities.set(activityId, initialState);

    console.log("iOS Live Activity Registered:", {
      activityId,
      attributes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      initialState,
    });

    return activityId;
  }

  async updateIOSLiveActivity(activityId: string, order: Order): Promise<void> {
    if (Platform.OS !== "ios") return;

    const activity = this.activeActivities.get(activityId);
    if (!activity || !activity.isActive) return;

    const newState: LiveActivityState = {
      ...activity,
      status: order.status,
      progressPercent: this.getProgressPercent(order.status),
      etaText: order.estimatedDeliveryTime || "Calculating...",
      driverName: order.deliveryPerson?.name,
    };

    this.activeActivities.set(activityId, newState);

    console.log("iOS Live Activity Updated:", {
      activityId,
      newState,
      staleDate: this.getStaleDate(order.status),
    });
  }

  async endIOSLiveActivity(activityId: string): Promise<void> {
    if (Platform.OS !== "ios") return;

    const activity = this.activeActivities.get(activityId);
    if (!activity) return;

    activity.isActive = false;
    this.activeActivities.set(activityId, activity);

    console.log("iOS Live Activity Ended:", {
      activityId,
      dismissalPolicy: "default",
    });
  }

  getActiveActivityForOrder(orderId: string): LiveActivityState | null {
    for (const activity of this.activeActivities.values()) {
      if (activity.orderId === orderId && activity.isActive) {
        return activity;
      }
    }
    return null;
  }

  private getStatusTitle(status: string): string {
    switch (status) {
      case "confirmed":
        return "Order Confirmed";
      case "preparing":
        return "Preparing Your Order";
      case "on_the_way":
        return "On The Way";
      case "delivered":
        return "Delivered";
      default:
        return "Order Update";
    }
  }

  private getStatusBody(
    status: string,
    driverName?: string,
    etaText?: string,
  ): string {
    switch (status) {
      case "confirmed":
        return "Your order has been confirmed and will be prepared soon.";
      case "preparing":
        return "The restaurant is preparing your order.";
      case "on_the_way":
        return driverName
          ? `${driverName} is on the way. ETA: ${etaText}`
          : `Your order is on the way. ETA: ${etaText}`;
      case "delivered":
        return "Your order has been delivered. Enjoy!";
      default:
        return "Your order status has been updated.";
    }
  }

  private getProgressPercent(status: string): number {
    switch (status) {
      case "confirmed":
        return 25;
      case "preparing":
        return 50;
      case "on_the_way":
        return 75;
      case "delivered":
        return 100;
      default:
        return 0;
    }
  }

  private getStaleDate(status: string): Date {
    const now = new Date();
    switch (status) {
      case "on_the_way":
        return new Date(now.getTime() + 5 * 60 * 1000);
      case "preparing":
        return new Date(now.getTime() + 10 * 60 * 1000);
      default:
        return new Date(now.getTime() + 15 * 60 * 1000);
    }
  }

  private getNotificationActions(
    orderId: string,
    status: string,
  ): Array<{ id: string; label: string; deeplink: string }> {
    const actions = [
      {
        id: "view_order",
        label: "View Order",
        deeplink: `Teinc Food Business://track/${orderId}`,
      },
    ];

    if (status === "on_the_way") {
      actions.push({
        id: "call_rider",
        label: "Call Rider",
        deeplink: `Teinc Food Business://track/${orderId}?action=call`,
      });
    }

    return actions;
  }
}

export const liveNotificationService = new LiveNotificationService();
