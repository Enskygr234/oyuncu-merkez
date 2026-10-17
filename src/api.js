// Veri kaynakları: ikisi de herkese açık, ücretsiz API.
// CheapShark: oyun fiyatları (storeID 1 = Steam)  https://apidocs.cheapshark.com
// mcsrvstat:  Minecraft sunucu durumu              https://api.mcsrvstat.us

const CS = "https://www.cheapshark.com/api/1.0";
export const STEAM_STORE_ID = "1";

async function getJson(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("İnternete bağlanılamadı. Bağlantını kontrol edip tekrar dene.");
  }
  if (res.status === 429) throw new Error("Çok sık istek gönderildi. Bir dakika bekleyip tekrar dene.");
  if (!res.ok) throw new Error(`Sunucu yanıt vermedi (hata ${res.status}). Biraz sonra tekrar dene.`);
  return res.json();
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export function steamImage(steamAppID, fallback) {
  return steamAppID
    ? `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/header.jpg`
    : fallback || null;
}

export function steamUrl(steamAppID) {
  return `https://store.steampowered.com/app/${steamAppID}/`;
}

const RATING_TR = {
  "Overwhelmingly Positive": "Son derece olumlu",
  "Very Positive": "Çok olumlu",
  Positive: "Olumlu",
  "Mostly Positive": "Çoğunlukla olumlu",
  Mixed: "Karışık",
  "Mostly Negative": "Çoğunlukla olumsuz",
  Negative: "Olumsuz",
  "Very Negative": "Çok olumsuz",
  "Overwhelmingly Negative": "Son derece olumsuz",
};

function mapDeal(d) {
  return {
    dealID: d.dealID,
    gameID: String(d.gameID),
    title: d.title,
    steamAppID: d.steamAppID || null,
    thumb: d.thumb,
    price: num(d.salePrice),
    normalPrice: num(d.normalPrice),
    savings: Math.round(num(d.savings) || 0),
    rating: RATING_TR[d.steamRatingText] || null,
    ratingPercent: num(d.steamRatingPercent),
  };
}

/** Steam'deki indirimler. sort: "Deal Rating" | "Savings" | "Price" | "recent" */
export async function fetchSteamDeals({ sort = "Deal Rating", page = 0, freeOnly = false, title = "" } = {}) {
  const p = new URLSearchParams({
    storeID: STEAM_STORE_ID,
    onSale: "1",
    sortBy: sort,
    pageSize: "30",
    pageNumber: String(page),
  });
  if (freeOnly) p.set("upperPrice", "0");
  if (title) p.set("title", title);
  const data = await getJson(`${CS}/deals?${p}`);
  return (Array.isArray(data) ? data : []).map(mapDeal).filter((d) => d.steamAppID);
}

/** İsimle oyun ara (istek listesine eklemek için). Sadece Steam'de olanlar. */
export async function searchGames(title) {
  const p = new URLSearchParams({ title, limit: "20" });
  const data = await getJson(`${CS}/games?${p}`);
  return (Array.isArray(data) ? data : [])
    .filter((g) => g.steamAppID)
    .map((g) => ({
      gameID: String(g.gameID),
      title: g.external,
      steamAppID: g.steamAppID,
      thumb: g.thumb,
      cheapest: num(g.cheapest),
    }));
}

/** İstek listesindeki oyunların güncel Steam fiyatları. 25'erli gruplar halinde. */
export async function fetchGamePrices(gameIDs) {
  const out = {};
  for (let i = 0; i < gameIDs.length; i += 25) {
    const chunk = gameIDs.slice(i, i + 25);
    const data = await getJson(`${CS}/games?ids=${chunk.join(",")}`);
    for (const id of chunk) {
      const g = data?.[id];
      if (!g) continue;
      const steam = (g.deals || []).find((d) => String(d.storeID) === STEAM_STORE_ID);
      out[id] = {
        title: g.info?.title,
        steamAppID: g.info?.steamAppID || null,
        price: steam ? num(steam.price) : null,
        normalPrice: steam ? num(steam.retailPrice) : null,
        savings: steam ? Math.round(num(steam.savings) || 0) : 0,
        lowestEver: num(g.cheapestPriceEver?.price),
        lowestEverDate: g.cheapestPriceEver?.date ? g.cheapestPriceEver.date * 1000 : null,
      };
    }
  }
  return out;
}

// ---------------------------------------------------------- Minecraft ----

export async function fetchServer(address, edition = "java") {
  const path = edition === "bedrock" ? "bedrock/3" : "3";
  const data = await getJson(`https://api.mcsrvstat.us/${path}/${encodeURIComponent(address)}`);
  return {
    online: !!data.online,
    version: data.version || null,
    players: data.players ? { online: data.players.online ?? 0, max: data.players.max ?? 0, list: data.players.list || [] } : null,
    motd: Array.isArray(data.motd?.clean) ? data.motd.clean.join("\n").trim() : "",
    icon: typeof data.icon === "string" && data.icon.startsWith("data:image/") ? data.icon : null,
    software: data.software || null,
    checkedAt: Date.now(),
  };
}
