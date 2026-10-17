import { useEffect, useRef, useState } from "react";
import { fetchSteamDeals, steamImage, steamUrl } from "./api.js";
import { ErrorBox, Icon, Sticker, usd } from "./ui.jsx";
import { openUrl } from "./native.js";
import { useStored } from "./storage.js";

const SORTS = [
  { id: "Deal Rating", label: "En iyi fırsatlar" },
  { id: "Savings", label: "En yüksek indirim" },
  { id: "Price", label: "En ucuz" },
  { id: "recent", label: "Yeni indirime girenler" },
  { id: "free", label: "Ücretsiz" },
];

export default function Deals({ inWishlist, onToggle }) {
  const [sort, setSort] = useStored("om.dealSort", "Deal Rating");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [deals, setDeals] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  async function load(nextPage) {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const free = sort === "free";
      const list = await fetchSteamDeals({
        sort: free ? "Deal Rating" : sort,
        freeOnly: free,
        page: nextPage,
        title: search,
      });
      if (id !== reqId.current) return; // eski istek, yok say
      setDeals((prev) => {
        const base = nextPage === 0 ? [] : prev;
        const seen = new Set(base.map((d) => d.dealID));
        return base.concat(list.filter((d) => !seen.has(d.dealID)));
      });
      setPage(nextPage);
      setHasMore(list.length >= 20);
    } catch (e) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  useEffect(() => {
    setDeals([]);
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, search]);

  return (
    <section>
      <header className="screen-head">
        <h1>Steam fırsatları</h1>
        <p className="lede">Şu an indirimde olan oyunlar. Kalbe dokun, ucuzlayınca haber verelim.</p>
      </header>

      <form
        className="searchbar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(query.trim());
        }}
      >
        <Icon name="search" size={20} />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setSearch("");
          }}
          placeholder="İndirimdeki oyunlarda ara"
          aria-label="İndirimdeki oyunlarda ara"
        />
      </form>

      <div className="chips" role="tablist" aria-label="Sıralama">
        {SORTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={sort === s.id}
            className={`chip ${sort === s.id ? "is-on" : ""}`}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} onRetry={() => load(page)} />}

      <div className="deal-grid">
        {deals.map((d) => (
          <DealCard key={d.dealID} deal={d} saved={inWishlist(d.gameID)} onToggle={() => onToggle(d)} />
        ))}
        {loading && deals.length === 0 && Array.from({ length: 6 }, (_, i) => <div key={i} className="deal-card skeleton" />)}
      </div>

      {!loading && !error && deals.length === 0 && (
        <div className="empty">
          <p>{search ? `"${search}" için indirimde oyun bulunamadı.` : "Şu an bu filtrede indirim yok."}</p>
        </div>
      )}

      {deals.length > 0 && hasMore && (
        <button className="btn btn-wide" disabled={loading} onClick={() => load(page + 1)}>
          {loading ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}

      <p className="fineprint">
        Fiyatlar ABD Steam mağazasından (USD). Türkiye'de fiyat farklı olabilir, indirim oranı genelde aynıdır.
        Veri: CheapShark.
      </p>
    </section>
  );
}

function DealCard({ deal, saved, onToggle }) {
  const [imgOk, setImgOk] = useState(true);
  const img = imgOk ? steamImage(deal.steamAppID, deal.thumb) : deal.thumb;
  return (
    <article className="deal-card">
      <button className="deal-hit" onClick={() => openUrl(steamUrl(deal.steamAppID))} aria-label={`${deal.title} Steam sayfasını aç`}>
        <div className="deal-art">
          {img && <img src={img} alt="" loading="lazy" onError={() => setImgOk(false)} />}
          <Sticker value={deal.savings} />
        </div>
        <div className="deal-body">
          <h2 className="deal-title">{deal.title}</h2>
          <div className="price-row">
            <span className="price">{usd(deal.price)}</span>
            {deal.normalPrice > deal.price && <s className="old-price">{usd(deal.normalPrice)}</s>}
          </div>
          {deal.rating && (
            <p className="meta">
              {deal.rating}
              {deal.ratingPercent ? `, %${deal.ratingPercent} beğeni` : ""}
            </p>
          )}
        </div>
      </button>
      <button
        className={`heart ${saved ? "is-on" : ""}`}
        onClick={onToggle}
        aria-pressed={saved}
        aria-label={saved ? "İstek listesinden çıkar" : "İstek listesine ekle"}
      >
        <Icon name="heart" size={20} filled={saved} />
      </button>
    </article>
  );
}
