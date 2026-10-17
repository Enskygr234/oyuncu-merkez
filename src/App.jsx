import { useCallback, useEffect, useState } from "react";
import Deals from "./Deals.jsx";
import Wishlist from "./Wishlist.jsx";
import Minecraft from "./Minecraft.jsx";
import { Icon } from "./ui.jsx";
import { useStored } from "./storage.js";
import { syncWishlist } from "./native.js";

const TABS = [
  { id: "deals", label: "Fırsatlar", icon: "tag" },
  { id: "wishlist", label: "İstek listem", icon: "heart" },
  { id: "minecraft", label: "Minecraft", icon: "cube" },
];

export default function App() {
  const [tab, setTab] = useStored("om.tab", "deals");
  const [wishlist, setWishlist] = useStored("om.wishlist", []);
  const [toast, setToast] = useState(null);

  // Liste her değiştiğinde arka plan görevine de bildir (APK'da bildirim için)
  useEffect(() => {
    syncWishlist(wishlist);
  }, [wishlist]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const inWishlist = useCallback((gameID) => wishlist.some((w) => w.gameID === gameID), [wishlist]);

  const toggleWishlist = useCallback(
    (game) => {
      const exists = wishlist.some((w) => w.gameID === game.gameID);
      setToast(exists ? `${game.title} listeden çıkarıldı` : `${game.title} listene eklendi`);
      setWishlist((list) => {
        if (list.some((w) => w.gameID === game.gameID)) {
          return list.filter((w) => w.gameID !== game.gameID);
        }
        return [
          {
            gameID: game.gameID,
            title: game.title,
            steamAppID: game.steamAppID,
            thumb: game.thumb,
            price: game.price ?? null,
            normalPrice: game.normalPrice ?? null,
            savings: game.savings ?? 0,
            addedPrice: game.price ?? null,
            target: null,
            addedAt: Date.now(),
          },
          ...list,
        ];
      });
    },
    [wishlist, setWishlist],
  );

  const current = TABS.find((t) => t.id === tab) ? tab : "deals";

  return (
    <div className="app">
      <main className="screen">
        {current === "deals" && <Deals inWishlist={inWishlist} onToggle={toggleWishlist} />}
        {current === "wishlist" && (
          <Wishlist
            items={wishlist}
            setItems={setWishlist}
            inWishlist={inWishlist}
            onToggle={toggleWishlist}
          />
        )}
        {current === "minecraft" && <Minecraft />}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <nav className="tabbar" aria-label="Bölümler">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${current === t.id ? "is-active" : ""}`}
            aria-current={current === t.id ? "page" : undefined}
            onClick={() => {
              setTab(t.id);
              window.scrollTo({ top: 0 });
            }}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
            {t.id === "wishlist" && wishlist.length > 0 && <b className="tab-count">{wishlist.length}</b>}
          </button>
        ))}
      </nav>
    </div>
  );
}
