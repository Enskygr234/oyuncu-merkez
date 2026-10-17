// APK'nın arka plan görevi (Capacitor Background Runner).
// Android bunu yaklaşık 30 dakikada bir çalıştırır. DOM yok; sadece fetch,
// CapacitorKV (kalıcı depolama) ve CapacitorNotifications kullanılabilir.

const STEAM = "1";

async function kvGet(key, fallback) {
  try {
    const r = await Promise.resolve(CapacitorKV.get(key));
    const raw = r && typeof r === "object" ? r.value : r;
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function kvSet(key, value) {
  await Promise.resolve(CapacitorKV.set(key, JSON.stringify(value)));
}

function notifId(gameID) {
  // 32 bit pozitif sayı (Android bildirimi kimliği)
  let h = 7;
  const s = String(gameID);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000000000;
}

const usd = (n) => (n === 0 ? "Ücretsiz" : "$" + n.toFixed(2));

// Uygulama istek listesini her değiştiğinde buraya gönderir
addEventListener("syncWishlist", async (resolve, reject, args) => {
  try {
    const items = (args && args.items) || [];
    await kvSet("wishlist", items);
    resolve();
  } catch (e) {
    reject(e);
  }
});

addEventListener("checkPrices", async (resolve, reject) => {
  try {
    const items = await kvGet("wishlist", []);
    if (!items.length) return resolve();
    const seen = await kvGet("seenPrices", {});
    const notes = [];

    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      const res = await fetch(
        "https://www.cheapshark.com/api/1.0/games?ids=" + chunk.map((x) => x.gameID).join(","),
      );
      if (!res.ok) continue;
      const data = await res.json();

      for (const it of chunk) {
        const g = data[it.gameID];
        if (!g || !g.deals) continue;
        const steam = g.deals.find((d) => String(d.storeID) === STEAM);
        if (!steam) continue;
        const price = parseFloat(steam.price);
        const savings = Math.round(parseFloat(steam.savings) || 0);
        if (!isFinite(price)) continue;

        const before = seen[it.gameID] != null ? seen[it.gameID] : it.lastPrice;
        const dropped = before != null && price < before - 0.009;
        const hitTarget = it.target != null && price <= it.target && seen[it.gameID] !== price;

        if (dropped || hitTarget) {
          notes.push({
            id: notifId(it.gameID),
            title: hitTarget ? it.title + " hedef fiyatına indi" : it.title + " ucuzladı",
            body:
              "Steam'de şimdi " +
              usd(price) +
              (savings > 0 ? " (-%" + savings + ")" : "") +
              (before != null ? ", önce " + usd(before) + " idi." : "."),
            scheduleAt: new Date(Date.now() + 1000),
          });
        }
        seen[it.gameID] = price;
      }
    }

    await kvSet("seenPrices", seen);
    if (notes.length) CapacitorNotifications.schedule(notes);
    resolve();
  } catch (e) {
    console.error("checkPrices hata: " + e);
    reject(e);
  }
});
