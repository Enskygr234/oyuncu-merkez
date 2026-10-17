# Oyuncu Merkezi

Steam indirimleri, ucuzlayınca bildirim veren istek listesi ve Minecraft sunucu durumu. Aynı kod hem site hem Android uygulaması olarak çalışır.

- **Site:** https://enskygr234.github.io/oyuncu-merkez/
- **APK:** https://github.com/Enskygr234/oyuncu-merkez/releases/download/son-surum/oyuncu-merkezi.apk

## Neler var

- **Fırsatlar:** Steam'de indirimdeki oyunlar. En iyi fırsat, en yüksek indirim, en ucuz, yeni ve ücretsiz filtreleri.
- **İstek listem:** Oyun ara, ekle, hedef fiyat koy. APK'da yaklaşık 30 dakikada bir fiyat kontrolü yapılır, ucuzlayınca bildirim gelir.
- **Minecraft:** Java ve Bedrock sunucularının açık/kapalı durumu, oyuncu sayısı, sürüm ve açıklama.

## Nasıl çalışır

- React + Vite ile yazılmış tek sayfa uygulama (`src/`).
- APK, Capacitor ile paketlenir. Arka plan fiyat kontrolü `public/runners/background.js` içinde.
- `main` dalına her gönderimde GitHub Actions siteyi `gh-pages` dalına yayınlar ve APK'yı derleyip yukarıdaki linke koyar.
- Veri kaynakları: [CheapShark](https://www.cheapshark.com) (oyun fiyatları) ve [mcsrvstat.us](https://mcsrvstat.us) (sunucu durumu). İkisi de ücretsiz ve herkese açık.

## Yol haritası

1. ✅ Steam indirimleri, istek listesi bildirimleri, Minecraft sunucuları
2. Takım/klan: hesap, davet kodu, duyurular, maç takvimi
3. LoL istatistikleri (Riot onayı gerekiyor)
4. Valorant istatistikleri (Riot onayı gerekiyor)
