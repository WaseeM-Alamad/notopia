import { saveSubscription } from "@/utils/actions";
import { useEffect, useState } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function subscribe() {
    const registration = await navigator.serviceWorker.register("/sw.js");

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    await saveSubscription(subscription.toJSON());

    return subscription;
  }

  async function unsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await deleteSubscription(subscription.endpoint);
    }
    setPermission("default");
  }

  return { permission, subscribe, unsubscribe };
}
