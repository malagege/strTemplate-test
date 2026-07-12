# strTemplate

純前端的文字範本產生器：左側以 YAML 定義多筆資料，右側撰寫 [Template7](https://idangero.us/template7/) 範本，即可逐筆或一次產生所有結果，並透過 URL hash 分享完整工作內容。所有解析與範本產生皆在瀏覽器內完成，不需要後端服務。

線上版本：<https://malagege.github.io/strTemplate-test/>

## 功能

- YAML 資料編輯（Monaco Editor + monaco-yaml 語法檢查）
- Template7 範本，內建自訂 helper：`pascal`、`camel`、`regex_match`
- 單筆結果預覽與多筆資料切換
- 「總和」模式：所有資料列依原始順序產生結果，以 `\n` 串接
- 一鍵複製結果（含成功／失敗回饋）
- 工作內容自動編碼到 URL hash，可加入書籤或分享（與舊版分享連結格式相容）

> 注意：分享網址內含完整的資料與範本內容，可能被書籤、瀏覽器歷史、通訊軟體或第三方服務留存，請勿放入敏感資料。

## 開發環境需求

- Node.js `>= 20.19`（建議使用 22 LTS）
- npm

## 開發指令

```bash
npm install       # 安裝依賴
npm run dev       # 開發伺服器（https://localhost:5000，由 vite-plugin-mkcert 提供本機憑證）
npm test          # 執行單元測試（Vitest）
npm run build     # production build 到 dist/
npm run preview   # 預覽 production build
```

本機開發使用 HTTPS 是為了讓 Clipboard API 在安全環境下運作；`vite-plugin-mkcert` 只作用於本機伺服器，不影響 production build。

## 專案結構

```text
src/
  domain/               # 純函式，不依賴 Vue、DOM、Monaco
    workspace.js        # 預設值、YAML 解析與資料結構驗證、pointer 邊界
    template-engine.js  # helper 註冊、編譯、單筆／總和運算
  adapters/             # 瀏覽器 API 封裝，測試時可注入替代實作
    share-hash.js       # Base64/JSON/URL hash 相容層
    tutorial-storage.js # 教學已讀狀態（localStorage）
    clipboard.js        # Clipboard API 與錯誤轉換
  composables/
    useWorkspace.js     # Vue reactive 狀態與衍生狀態
    useMonacoEditor.js  # editor 建立、同步、dispose
  monaco/
    environment.js      # Monaco worker 與 monaco-yaml 設定
  components/           # 畫面協調，不承擔 domain 邏輯
```

完整的行為規格與重構決策見 [spec.md](spec.md)。

## 部署

推送到 `master` 分支後，GitHub Actions（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）會自動執行測試、build，並部署到 GitHub Pages。

workflow 會在第一次執行時自動啟用 GitHub Pages（`configure-pages` 的 `enablement: true`）。若自動啟用失敗，再到 repo 的 **Settings → Pages → Build and deployment → Source** 手動選擇 **GitHub Actions**。

## 版本說明（重構相容性變更）

依 spec 已確認的產品決策，以下行為與舊版不同：

1. **反斜線規則**：範本原樣送入 Template7，不再於編譯前自動將 `\` 加倍。範本中要表達 RegExp 的 `\d` 時，請寫 `\\d`。含反斜線的既有範本輸出可能與舊版不同。
2. **helper 型別正規化**：`null`／`undefined` 回傳空字串；字串、數字、布林值轉為字串；物件、陣列等複合型別會回報範本錯誤，而不是輸出 `[object Object]`。
3. **教學已讀 key**：由 `openUseHelper` 遷移至 `strTemplate:tutorialSeen:v1`，舊值存在會在第一次載入時自動遷移。

## 已知事項

- `npm audit` 回報的 dompurify 弱點來自 monaco-editor 內部依賴，需等待 monaco 上游更新。
- monaco-editor 造成主 bundle 較大屬預期現象（編輯器本體），語言支援已透過動態載入拆分。
