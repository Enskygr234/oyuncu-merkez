import { useCallback, useEffect, useState } from "react";
import { fetchServer } from "./api.js";
import { Icon, agoTr } from "./ui.jsx";
import { useStored } from "./storage.js";

const SUGGESTED = [
  { address: "mc.hypixel.net", edition: "java", name: "Hypixel" },
  { address: "play.cubecraft.net", edition: "java", name: "CubeCraft" },
  { address: "geo.hivebedrock.network", edition: "bedrock", name: "The Hive" },
];

const keyOf = (s) => `${s.edition}:${s.address.toLowerCase()}`;

export default function Minecraft() {
  const [servers, setServers] = useStored("om.servers", []);
  const [status, setStatus] = useState({});
  const [address, setAddress] = useState("");
  const [edition, setEdition] = useState("java");

  const check = useCallback(async (s) => {
    const k = keyOf(s);
    setStatus((st) => ({ ...st, [k]: { ...st[k], loading: true } }));
    try {
      const data = await fetchServer(s.address, s.edition);
      setStatus((st) => ({ ...st, [k]: { ...data, loading: false } }));
    } catch (e) {
      setStatus((st) => ({ ...st, [k]: { error: e.message, loading: false, checkedAt: Date.now() } }));
    }
  }, []);

  const checkAll = useCallback(() => servers.forEach(check), [servers, check]);

  // Açılışta ve sayfa görünürken dakikada bir kontrol et (API 5 dk önbellekli)
  useEffect(() => {
    checkAll();
    const t = setInterval(() => document.visibilityState === "visible" && checkAll(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers.length]);

  function add(s) {
    const clean = { address: s.address.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""), edition: s.edition, name: s.name || null };
    if (!clean.address) return;
    if (servers.some((x) => keyOf(x) === keyOf(clean))) return;
    setServers([...servers, clean]);
    check(clean);
  }

  function remove(s) {
    setServers(servers.filter((x) => keyOf(x) !== keyOf(s)));
  }

  const suggestions = SUGGESTED.filter((s) => !servers.some((x) => keyOf(x) === keyOf(s)));

  return (
    <section>
      <header className="screen-head">
        <h1>Minecraft sunucuları</h1>
        <p className="lede">Sunucu açık mı, kaç kişi oynuyor, tek bakışta gör.</p>
      </header>

      <form
        className="mc-add"
        onSubmit={(e) => {
          e.preventDefault();
          add({ address, edition });
          setAddress("");
        }}
      >
        <div className="searchbar">
          <Icon name="cube" size={20} />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Sunucu adresi, örn. play.sunucu.com"
            aria-label="Sunucu adresi"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
        <div className="mc-add-row">
          <div className="segmented" role="radiogroup" aria-label="Sürüm">
            {[
              ["java", "Java"],
              ["bedrock", "Bedrock"],
            ].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={edition === id} className={edition === id ? "is-on" : ""} onClick={() => setEdition(id)}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn" type="submit" disabled={!address.trim()}>
            <Icon name="plus" size={18} />
            Sunucu ekle
          </button>
        </div>
      </form>

      {servers.length > 0 && (
        <div className="list-head">
          <span className="meta">{servers.length} sunucu</span>
          <button className="btn btn-ghost btn-sm" onClick={checkAll}>
            <Icon name="refresh" size={16} />
            Hepsini yenile
          </button>
        </div>
      )}

      <ul className="mc-list">
        {servers.map((s) => (
          <ServerCard key={keyOf(s)} server={s} st={status[keyOf(s)]} onRemove={() => remove(s)} onRefresh={() => check(s)} />
        ))}
      </ul>

      {suggestions.length > 0 && (
        <div className="suggest">
          <h2 className="sub">{servers.length ? "Başka popüler sunucular" : "Popüler sunucularla başla"}</h2>
          <div className="chips wrap">
            {suggestions.map((s) => (
              <button key={keyOf(s)} className="chip" onClick={() => add(s)}>
                <Icon name="plus" size={14} />
                {s.name} <span className="chip-note">{s.edition === "java" ? "Java" : "Bedrock"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="fineprint">Durum bilgisi 5 dakikaya kadar gecikebilir. Veri: mcsrvstat.us</p>
    </section>
  );
}

function ServerCard({ server, st, onRemove, onRefresh }) {
  const online = st?.online;
  const state = !st || (st.loading && st.online === undefined) ? "checking" : st.error ? "error" : online ? "online" : "offline";
  const label = { checking: "Kontrol ediliyor", error: "Kontrol edilemedi", online: "Açık", offline: "Kapalı" }[state];
  const players = st?.players;
  const fill = players && players.max ? Math.min(100, Math.round((players.online / players.max) * 100)) : 0;

  return (
    <li className={`mc-card state-${state}`}>
      <div className="mc-top">
        <div className="mc-icon">{st?.icon ? <img src={st.icon} alt="" /> : <Icon name="cube" size={28} />}</div>
        <div className="mc-id">
          <h2 className="mc-name">{server.name || server.address}</h2>
          <p className="meta">
            {server.name ? `${server.address}, ` : ""}
            {server.edition === "java" ? "Java" : "Bedrock"}
            {st?.version ? `, ${st.version}` : ""}
          </p>
        </div>
        <button className="icon-btn" onClick={onRemove} aria-label={`${server.name || server.address} sunucusunu kaldır`}>
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="mc-status">
        <span className="lamp" aria-hidden="true" />
        <strong>{label}</strong>
        {online && players && (
          <span className="mc-players">
            {players.online.toLocaleString("tr-TR")} / {players.max.toLocaleString("tr-TR")} oyuncu
          </span>
        )}
      </div>

      {online && players && players.max > 0 && (
        <div className="bar" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Doluluk">
          <span style={{ width: `${fill}%` }} />
        </div>
      )}

      {online && st.motd && <p className="motd">{st.motd}</p>}

      {online && players?.list?.length > 0 && (
        <p className="meta">
          Oyunda: {players.list.slice(0, 12).map((p) => p.name).join(", ")}
          {players.list.length > 12 ? ` ve ${players.list.length - 12} kişi daha` : ""}
        </p>
      )}

      {st?.error && <p className="meta">{st.error}</p>}

      <div className="mc-foot">
        <span className="meta">{st?.checkedAt ? agoTr(st.checkedAt) : ""}</span>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={st?.loading}>
          <Icon name="refresh" size={14} className={st?.loading ? "spin" : ""} />
          Yenile
        </button>
      </div>
    </li>
  );
}
