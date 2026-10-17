// Telefona özel işler (APK). Sitede bu fonksiyonlar sessizce hiçbir şey yapmaz.
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const RUNNER_LABEL = "com.oyuncumerkezi.app.fiyat";
export const APK_URL = "https://github.com/Enskygr234/oyuncu-merkez/releases/download/son-surum/oyuncu-merkezi.apk";

export async function openUrl(url) {
  if (isNative) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener");
  }
}

async function runner() {
  const { BackgroundRunner } = await import("@capacitor/background-runner");
  return BackgroundRunner;
}

/** İstek listesini arka plan görevine bildir (fiyatı o kontrol eder). */
export async function syncWishlist(items) {
  if (!isNative) return;
  try {
    const r = await runner();
    await r.dispatchEvent({
      label: RUNNER_LABEL,
      event: "syncWishlist",
      details: {
        items: items.map((i) => ({
          gameID: i.gameID,
          title: i.title,
          lastPrice: i.price ?? null,
          target: i.target ?? null,
        })),
      },
    });
  } catch (e) {
    console.warn("Arka plan görevine liste gönderilemedi", e);
  }
}

/** "granted" | "denied" | "prompt" | "unsupported" */
export async function notificationStatus() {
  if (!isNative) return "unsupported";
  try {
    const r = await runner();
    const s = await r.checkPermissions();
    return s.notifications || "prompt";
  } catch {
    return "prompt";
  }
}

export async function requestNotifications() {
  if (!isNative) return "unsupported";
  try {
    const r = await runner();
    const s = await r.requestPermissions({ apis: ["notifications"] });
    return s.notifications || "denied";
  } catch {
    return "denied";
  }
}
