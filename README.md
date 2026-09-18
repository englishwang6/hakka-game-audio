# 客語桌遊開發案｜四縣腔語音網站

正式網址：https://englishwang6.github.io/hakka-game-audio/

已上線 72／86 段四縣腔 AI 女聲，尚缺 14 段；未經母語顧問逐段聽校。卡牌資料共有 60 個情境、20 款道具、6 款咒語。

## 使用

掃卡牌 QR 或從清單選卡號。地圖先聽情境，選好道具後再按「已選好道具，揭曉」。道具與咒語直接顯示語句。缺音檔時會顯示未上架。

每張卡有固定入口，如 `?card=H01`。補音、換音不改網址。

## 語音來源

客家委員會[臺灣客語語音資料庫](https://speech.hakka.gov.tw/TTS/Synthesis)，四縣腔女聲 hak-xi-TW-vs2-F01。文本由本案編製。

## 尚缺音檔

V10, V11, V12, C01, C02, C03, C04, C05, C06, C08, C09, C10, C11, C12

## 維護

純靜態網站，GitHub Pages 使用 main 分支根目錄，無建置步驟。語音存放 audio/，道具縮圖存放 assets/props/。更新卡牌資料時須同步 data.json 與 data.js（window.CARD_DATA）。保留 .nojekyll。
