import { useEffect, useRef, useState } from "react";
import { fetchGamePrices, searchGames, steamImage, steamUrl } from "./api.js";
import { ErrorBox, Icon, Sticker, agoTr, dateTr, usd } from "./ui.jsx";
import { APK_URL, isNative, notificationStatus, openUrl, requestNotifications } from "./native.js";
import { useStored } from "./storage.js";

export default function Wishlist({ items, setItems, inWishlist, onToggle }) {
  const [checkedAt, setCheckedAt] = useStored("om.wishCheckedAt", 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notif, setNotif] = useState(isNative ? "prompt" : "unsupported");
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    notificationStatus().then(setNotif);
  }, []);

  async function refresh() {
    const list = itemsRef.current;
    if (!list.length) return;
    setRefreshing(true);
    setError(null);
    try {
      const prices = await fetchGamePrices(list.map((i) => i.gameID));
      setItems((cur) =>
        cur.map((i) => {
          const p = prices[i.gameID];
          if (!p) return i;
          return {
            ...i,
            steamAppID: i.steamAppID || p.steamAppID,
            price: p.price,
            normalPrice: p.normalPrice,
            savings: p.savings,
            lowestEver: p.lowestEver,
            lowestEverDate: p.lowestEverDate,
            addedPrice: i.addedPrice ?? p.price,
          };
        }),
      );
      setCheckedAt(Date.now());
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  // Ekran açılınca fiyatlar 10 dakikadan eskiyse yenile
  useEffect(() => {
    if (items.length && Date.now() - checkedAt > 10 * 60 * 1000) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aramadan yeni eklenen oyunun fiyatı henüz yok: hemen çek
  const missing = items.filter((i) => i.price == null && i.addedPrice == null).length;
  useEffect(() => {
    if (missing > 0 && !refreshing) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing]);

  function setTarget(gameID, value) {
    const n = parseFloat(String(value).replace(",", "."));
    setItems((cur) => cur.map((i) => (i.gameID === gameID ? { ...i, target: Number.isFinite(n) && n >= 0 ? n : null } : i)));
  }

  const cheaper = items.filter((i) => i.addedPrice != null && i.price != null && i.price < i.addedPrice - 0.009);

  return (
    <section>
      <header className="screen-head">
        <h1>İstek listem</h1>
        <p className="lede">
          {items.length === 0
            ? "Takip etmek istediğin oyunları ekle."
            : cheaper.length > 0
              ? `${cheaper.length} oyun eklediğinden beri ucuzladı.`
              : `${items.length} oyun takipte.`}
        </p>
      </header>

      <NotifyBanner status={notif} onAsk={async () => setNotif(await requestNotifications())} />

      <AddGame inWishlist={inWishlist} onAdd={onToggle} />

      {error && <ErrorBox message={error} onRetry={refresh} />}

      {items.length > 0 && (
        <div className="list-head">
          <span className="meta">{checkedAt ? `Fiyatlar ${agoTr(checkedAt)} kontrol edildi` : "Fiyatlar henüz kontrol edilmedi"}</span>
          <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={refreshing}>
            <Icon name="refresh" size={16} className={refreshing ? "spin" : ""} />
            {refreshing ? "Kontrol ediliyor" : "Fiyatları yenile"}
          </button>
        </div>
      )}

      <ul className="wish-list">
        {items.map((i) => (
          <WishItem key={i.gameID} item={i} onRemove={() => onToggle(i)} onTarget={(v) => setTarget(i.gameID, v)} />
        ))}
      </ul>

      {items.length > 0 && (
        <p className="fineprint">
          {isNative
            ? "Uygulama yaklaşık 30 dakikada bir fiyatlara bakar. Telefonun pil tasarrufu bu süreyi uzatabilir."
            : "Fiyatlar bu sayfayı açtığında güncellenir."}{" "}
          Fiyatlar ABD Steam mağazasından (USD).
        </p>
      )}
    </section>
  );
}

function NotifyBanner({ status, onAsk }) {
  if (status === "granted") return null;
  if (status === "unsupported") {
    return (
      <div className="banner">
        <Icon name="bell" />
        <p>Ucuzlayınca bildirim almak için telefon uygulamasını kur.</p>
        <a className="btn btn-sm" href={APK_URL}>
          APK indir
        </a>
      </div>
    );
  }
  return (
    <div className="banner">
      <Icon name="bell" />
      <p>{status === "denied" ? "Bildirimler kapalı. Telefon ayarlarından Oyuncu Merkezi için aç." : "Listendeki oyunlar ucuzlayınca bildirim al."}</p>
      {status !== "denied" && (
        <button className="btn btn-sm" onClick={onAsk}>
          Bildirimleri aç
        </button>
      )}
    </div>
  );
}

function AddGame({ inWishlist, onAdd }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run(e) {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await searchGames(term));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-game">
      <form className="searchbar" role="search" onSubmit={run}>
        <Icon name="search" size={20} />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (!e.target.value) setResults(null);
          }}
          placeholder="Oyun ara ve listene ekle"
          aria-label="Oyun ara ve listene ekle"
        />
        <button className="btn btn-sm" type="submit" disabled={loading || q.trim().length < 2}>
          {loading ? "Aranıyor" : "Ara"}
        </button>
      </form>
      {error && <ErrorBox message={error} />}
      {results && (
        <ul className="results">
          {results.length === 0 && <li className="meta pad">Steam'de bu isimle oyun bulunamadı.</li>}
          {results.map((g) => {
            const saved = inWishlist(g.gameID);
            return (
              <li key={g.gameID} className="result">
                <img src={g.thumb} alt="" loading="lazy" />
                <span className="result-title">{g.title}</span>
                <button
                  className={`btn btn-sm ${saved ? "btn-ghost" : ""}`}
                  onClick={() => onAdd({ ...g, price: null })}
                  aria-label={saved ? `${g.title} listeden çıkar` : `${g.title} listeye ekle`}
                >
                  <Icon name={saved ? "close" : "plus"} size={16} />
                  {saved ? "Çıkar" : "Ekle"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function WishItem({ item, onRemove, onTarget }) {
  const [targetText, setTargetText] = useState(item.target != null ? String(item.target) : "");
  const dropped = item.addedPrice != null && item.price != null && item.price < item.addedPrice - 0.009;
  const atTarget = item.target != null && item.price != null && item.price <= item.target;
  const atLowest = item.lowestEver != null && item.price != null && item.price <= item.lowestEver + 0.009 && item.savings > 0;

  return (
    <li className={`wish ${dropped || atTarget ? "is-hot" : ""}`}>
      <button className="wish-art" onClick={() => item.steamAppID && openUrl(steamUrl(item.steamAppID))} aria-label={`${item.title} Steam sayfasını aç`}>
        <img src={steamImage(item.steamAppID, item.thumb)} alt="" loading="lazy" />
        <Sticker value={item.savings} size="sm" />
      </button>
      <div className="wish-body">
        <div className="wish-top">
          <h2 className="deal-title">{item.title}</h2>
          <button className="icon-btn" onClick={onRemove} aria-label={`${item.title} listeden çıkar`}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="price-row">
          <span className="price">{item.price == null ? "Fiyat bekleniyor" : usd(item.price)}</span>
          {item.normalPrice > item.price && <s className="old-price">{usd(item.normalPrice)}</s>}
        </div>
        <p className="meta">
          {atTarget
            ? "Hedef fiyatına indi."
            : atLowest
              ? "Şu an gördüğü en düşük fiyatta."
              : dropped
                ? `Eklediğinde ${usd(item.addedPrice)} idi.`
                : item.lowestEver != null
                  ? `En düşük ${usd(item.lowestEver)}${item.lowestEverDate ? `, ${dateTr(item.lowestEverDate)}` : ""}`
                  : ""}
        </p>
        <label className="target">
          <span>Hedef fiyat $</span>
          <input
            inputMode="decimal"
            value={targetText}
            placeholder="yok"
            onChange={(e) => setTargetText(e.target.value)}
            onBlur={() => onTarget(targetText)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label={`${item.title} için hedef fiyat (dolar)`}
          />
        </label>
      </div>
    </li>
  );
}
