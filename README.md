# 客語桌遊開發案｜四縣腔語音網站

純靜態網站，無建置步驟、無第三方字體、無分析追蹤，不需要 API 金鑰。

## 網址與操作

- 在網站根路徑加上 `?card=H01` 開啟 H01；`?card=T01` 開啟道具；`?card=F01` 開啟咒語。GitHub 專案網站須保留 `/儲存庫名稱/` 路徑，例如 `/儲存庫名稱/?card=H01`。
- 地圖卡先顯示題號、場域與播放操作；「已選好道具，揭曉」後才顯示題名、本題需求、可用道具圖片／名稱／卡號與可計分項數、客字、拼音、華語意思。
- 道具與咒語直接顯示語句；咒語另顯示效果與限制。
- 道具小圖位於 `assets/props/T01.png` 等路徑，與印刷卡面共用；每題支援一或兩項需求。
- 題名與逐字稿不加入地圖卡的搜尋索引，避免孩子從選單先看到答案。
- 預設播放 `audio/H01.wav` 等路徑。也接受資料中的 `audio/…wav`、`audio/…mp3`、`audio/…m4a`、`audio/…ogg`。
- 缺檔會顯示「音檔尚未上架」。沒有自動播放，沒有華語語音替代。
- 提供正常／稍慢播放、重播、原生進度控制；變速保留瀏覽器預設音高處理。

## 資料更新

`data.json` 為卡牌資料；`data.js` 是相同資料的 `window.CARD_DATA = …;` 包裝，讓直接開啟本機 `index.html` 也能使用。更新時必須同步兩檔。應以製作資料夾的 `manifest.json` 為準。

```python
import json
from pathlib import Path

root = Path('production_20260918')
data = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
text = json.dumps(data, ensure_ascii=False, indent=2)
(root / 'site' / 'data.json').write_text(text + '\n', encoding='utf-8')
(root / 'site' / 'data.js').write_text('window.CARD_DATA = ' + text + ';\n', encoding='utf-8')
```

## GitHub Pages（本次新增的部署選項）

網站的程式、圖片、資料與音檔均採相對路徑，可部署在 GitHub 專案網站的 `/儲存庫名稱/` 路徑；網址切換只更新 `card` 查詢參數。`.nojekyll` 讓 GitHub 直接發布靜態檔案，不執行 Jekyll。

1. 執行製作資料夾內的 `python prepare_github_pages.py`。此指令只建立上傳包與完整性報告，不會登入或部署。補齊音檔後可用 `--require-complete`，缺少任何一段即停止。
2. 登入 GitHub，建立本專案的儲存庫；把產生的 `github_pages_upload/` 內容放在 `main` 分支根目錄。根目錄需直接有 `index.html`、`.nojekyll`，並保留 `audio/`、`assets/` 資料夾。
3. **Settings → Pages → Build and deployment → Source：Deploy from a branch → Branch：main → /(root) → Save**。本案無須自行新增 Actions workflow。
4. 等待 Pages 顯示實際部署網址，確認能開啟後再交給下方驗證工具。QR 使用該完整網址與 `?card=卡號`，不能省略儲存庫路徑。

GitHub 網頁上傳每次最多 100 個檔案，單檔最大 25 MiB。完整網站會超過 100 檔，可將網站／圖片與 `audio/` 分成兩次上傳；也可以使用 Git push。**GitHub 不會把上傳的 ZIP 自動展開成網站**，請先解壓縮，保留檔案結構。封包報告另提供兩批檔案清單。

GitHub Free 支援公開儲存庫的 Pages；私有儲存庫是否支援取決於帳號方案。網站資料本來就是供玩家公開讀取的靜態內容，情境答案仍維持按鈕揭曉流程。`_headers` 是 Cloudflare 專用設定；GitHub 封包不含此檔，不能依賴它在 GitHub 設定快取或 HTTP 標頭。404 頁面為獨立內容，不會把不存在的音檔轉成播放器頁面。

官方說明：[發布來源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[網頁上傳限制](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)、[Pages 網址類型](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## Cloudflare Pages Direct Upload（原部署選項）

本次網站尚未部署。Cloudflare 後台在自動操作環境持續要求安全驗證，未繞過驗證，也未使用未提供的 API token。以下是在本人已登入、可正常操作的 Cloudflare 後台完成上傳的步驟。

1. 先把已生成的音檔放入 `audio/`，並同步 `data.json`、`data.js`。執行下方 `package` 指令，確認報告中的音檔數；網站檔案齊全不等於 86 段語音已完成。
2. 進入 [Cloudflare 後台](https://dash.cloudflare.com)，開啟 **Workers & Pages**。
3. 選擇 **Create application → Get started → Drag and drop your files**。
4. 輸入專案名稱，上傳工具產生的 `Cloudflare_Pages_Upload.zip`，或直接拖入 `site` 內的網站檔案。ZIP 根目錄必須直接包含 `index.html`，不能多包一層 `site/`。
5. 依畫面選擇 **Deploy site**／**Save and Deploy**，等待部署成功。從後台複製實際的正式網址，再使用下方驗證指令；勿自行推測尚未取得的網域。日後更新使用該專案的 **Create a new deployment**，選擇正式環境並上傳完整新版。

以上流程依 [Cloudflare 官方 Direct Upload 文件](https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop) 整理。此網站已是靜態成品，無須額外建置。後台拖放支援 ZIP 或資料夾，最多 1,000 檔；每個檔案不可超過 25 MiB。封包工具會檢查這些限制。[上傳限制](https://developers.cloudflare.com/pages/get-started/direct-upload/#limits)、[單檔大小限制](https://developers.cloudflare.com/pages/platform/limits/#file-size)。

`_headers` 提供安全性標頭與快取設定。`404.html` 避免不存在的音檔被單頁網站路由回傳 HTML。

## 封包、驗證與 QR 回填

製作資料夾內的 `prepare_deployment.py` 僅使用 Python 標準函式庫，**不會部署**。在 `production_20260918` 資料夾執行：

```bash
python prepare_deployment.py package
```

輸出 `deliverables/Cloudflare_Pages_Upload.zip` 與 `deployment_package_report.json`。報告逐一列出缺少的音檔／道具圖；音檔未齊也能製作預覽上傳包。正式封包可加入完整性門檻：

```bash
python prepare_deployment.py package --require-complete
```

取得本人已核實、能正常開啟的正式 HTTPS 網址後執行下列命令。將引號內文字**整段替換為後台提供的實際網址**，不保留說明文字：

```bash
python prepare_deployment.py verify --base-url "在此貼上已核實的HTTPS正式網址"
python prepare_deployment.py verify-and-build --base-url "在此貼上已核實的HTTPS正式網址"
```

`verify` 只讀取公開網站，核對已部署的程式／資料與本機完全一致，並檢查 86 個卡號網址與 86 段音檔的 HTTP 回應、檔案格式標頭；報告輸出至 `deliverables/deployment_verification.json`。這項檢查不代表逐段人工確認發音。

`verify-and-build` 在上述檢查**全部通過**後，才呼叫現有 `build_cards.py --base-url`，用真實網址重建卡牌 QR 與 A3 拼版。任何缺音、錯誤頁、登入頁、安全驗證或重新導向均不會觸發重建。製作 PDF 所需套件沿用 `build_cards.py` 的執行環境。

尚未取得並驗證正式網址前，保留印刷校樣的非 QR 佔位；不要將假網址印到卡牌。

## 無障礙與驗證

- 所有操作可使用 Tab／Enter／空白鍵；有清楚焦點外框、跳到主要內容連結、播放狀態通知。
- 輸入框／分類／速度皆有標籤；揭曉按鈕標示展開狀態。
- 換卡停止前一段語音；瀏覽器前進、後退會恢復對應卡號並收起情境答案。
- 使用者必須自行按下播放，符合手機瀏覽器的播放限制。
- 揭曉是遊戲流程上的提示隱藏，資料仍在公開的靜態檔案中，不是存取控制。
