// `npx cap add android` sonrası Android projesini ayarlar.
// Kullanım: node native/patch-android.mjs <derleme-numarası>
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const app = path.join(root, "android", "app");
const build = Number(process.argv[2] || 1);

function edit(file, fn) {
  const before = fs.readFileSync(file, "utf8");
  const after = fn(before);
  if (after === before) throw new Error(`Değişiklik uygulanamadı: ${file}`);
  fs.writeFileSync(file, after);
  console.log("düzenlendi:", path.relative(root, file));
}

// 1) Sürüm numarası + background runner'ın JS motoru (.aar) klasörü
edit(path.join(app, "build.gradle"), (s) => {
  s = s.replace(/versionCode\s+\d+/, `versionCode ${build}`);
  s = s.replace(/versionName\s+"[^"]*"/, `versionName "0.1.${build}"`);
  const libs = "'../../node_modules/@capacitor/background-runner/android/src/main/libs'";
  if (!s.includes("background-runner")) {
    if (/flatDir\s*\{[^}]*dirs\s+/.test(s)) {
      s = s.replace(/(flatDir\s*\{[^}]*?dirs\s+)/, `$1${libs}, `);
    } else {
      s += `\nrepositories {\n    flatDir {\n        dirs ${libs}, 'libs'\n    }\n}\n`;
    }
  }
  return s;
});

// 2) Bildirim izni (Android 13+)
edit(path.join(app, "src", "main", "AndroidManifest.xml"), (s) =>
  s.includes("POST_NOTIFICATIONS")
    ? s + " "
    : s.replace(
        /<uses-permission android:name="android.permission.INTERNET"\s*\/>/,
        '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
      ),
);

// 3) İkon ve açılış ekranı: varsayılan Capacitor görsellerini kaldır, kendi kaynaklarımızı koy
const res = path.join(app, "src", "main", "res");
for (const dir of fs.readdirSync(res)) {
  const splash = path.join(res, dir, "splash.png");
  if (fs.existsSync(splash)) fs.rmSync(splash);
}
fs.cpSync(path.join(root, "native", "res"), res, { recursive: true });
console.log("ikon ve açılış ekranı kopyalandı");
