# strTemplate 重構規格

## 1. 文件目的

本文件定義 `strTemplate` 的現有產品行為、重構後應保留的相容性、建議的模組邊界與驗收條件，作為後續重構、測試與程式碼審查的共同依據。

本次重構原則是「先維持既有使用情境，再改善可靠性與可維護性」。除本文件明確列為修正的項目外，不應在重構期間改變使用者可觀察到的結果。

## 2. 產品摘要

`strTemplate` 是純前端的文字範本產生器：

1. 使用者在左側輸入 YAML，YAML 的 `data` 欄位包含一至多筆資料。
2. 使用者在右側輸入 Template7 範本。
3. 系統可用目前選取的單筆資料產生結果，或將全部資料的結果合併輸出。
4. 使用者可複製產生結果。
5. YAML 與範本可編碼到 URL hash，供書籤保存或分享。

所有解析與範本產生皆在瀏覽器內完成，不需要後端服務，也不應主動將內容傳送到網路。

## 3. 重構目標

- 保留 YAML、Template7、自訂 helper、逐筆預覽、合併輸出、複製及 URL 分享功能。
- 將解析、驗證、範本運算、分享編碼、編輯器整合與 UI 狀態拆成可獨立測試的模組。
- 移除以 computed property 觸發副作用、檔案層級全域編輯器實例及散落的狀態同步。
- 將 Vue、Vite、Monaco Editor、Template7、Bootstrap 及其他直接／開發依賴升級至實作當下彼此相容的穩定版本。
- 對無效 YAML、資料結構、範本、正規表示式及 URL hash 提供可理解的錯誤，且不讓畫面崩潰。
- 補上自動化測試，鎖定既有輸出與舊分享連結的相容性。
- 在元件卸載時正確釋放 Monaco editor、model、事件監聽器與 Bootstrap modal。

## 4. 非目標

- 不新增帳號、雲端儲存、多人協作或後端 API。
- 不在本次重構中更換 YAML 或範本語法。
- 不把輸出當成 HTML 執行或提供即時 HTML 預覽；輸出仍視為純文字。
- 不保證 URL hash 可容納任意大小的資料；瀏覽器與分享平台仍可能有 URL 長度限制。
- 不重新設計整體視覺品牌；可做必要的可用性與錯誤提示調整。

## 5. 名詞與資料模型

### 5.1 Workspace

可分享及還原的工作內容：

```ts
interface Workspace {
  uData: {
    data: TemplateRecord[]
  }
  templateText: string
}

type TemplateRecord = Record<string, unknown>
```

最低有效條件：

- YAML 根節點必須是物件。
- 根節點必須有 `data`。
- `data` 必須是陣列。
- 每個陣列元素必須是可傳入 Template7 的物件。
- `templateText` 必須是字串。

`{ data: [...] }` 是唯一支援的 YAML 根資料模型，以維持既有分享連結相容性，並明確表達一份 workspace 可包含多筆範本資料。根節點直接為陣列或單一物件皆視為無效；單筆資料仍須放在只有一個元素的 `data` 陣列中。

YAML 可以包含 `data` 以外的根欄位，但目前不參與範本運算，也不保證分享格式以外的業務用途。

### 5.2 模式

| 內部名稱 | 畫面名稱 | 行為 |
| --- | --- | --- |
| `edit` | 編輯 | 顯示範本編輯器。 |
| `result` | 結果 | 用目前資料列產生並顯示單筆結果。 |
| `result2` | 總和 | 依原始陣列順序產生所有結果，並以單一換行字元 `\n` 串接。 |

重構時可將不具語意的 `result2` 改名為 `combined` 或 `allResults`，但若名稱出現在可持久化資料中，必須提供轉換。

## 6. 功能規格

### FR-01 初始化

- 沒有 URL hash 時，系統載入預設 YAML 與預設範本。
- 目前預設範本為 `Hello World {{ test1 }}`。
- 預設 YAML 至少包含兩筆可供切換的示例資料。
- 有有效的分享 hash 時，以 hash 中的 `uData` 與 `templateText` 還原 workspace。
- hash 無法解碼、JSON 無法解析或內容不符合 Workspace 結構時，畫面不得崩潰；應顯示分享連結無效的訊息並載入預設 workspace。

### FR-02 YAML 編輯與驗證

- 左側 Monaco editor 使用 YAML 語言模式。
- 每次內容變更後解析 YAML，並驗證第 5.1 節的最低資料結構。
- 解析與結構驗證成功時，更新最後一份有效資料並重新計算輸出。
- 驗證失敗時：
  - 顯示具體錯誤類型；若可取得行、列資訊則一併顯示。
  - 不執行範本運算。
  - 不覆蓋最後一份有效資料。
  - 不將無效內容寫入可分享 hash。
- 空 YAML、`data` 缺少、`data` 不是陣列、資料列不是物件，皆視為無效資料，而不是未捕捉例外。

### FR-03 範本編輯與運算

- 範本編輯器使用適合 Template7/Handlebars 類語法的 Monaco 語言模式。
- 資料或範本變更後更新衍生輸出；運算本身應是純函式，不直接操作 editor、URL 或 Vue state。
- 單筆模式以 `data[dataPointer]` 作為 Template7 context。
- 總和模式對所有資料列執行相同範本，維持資料原始順序，並以 `\n` 串接。
- 空資料陣列在單筆與總和模式皆輸出空字串，並隱藏逐筆切換控制。
- 範本編譯或執行失敗時，顯示錯誤且不得讓應用程式崩潰。
- 範本必須原樣送入 Template7，不得在編譯前自動將反斜線 `\` 改寫為 `\\`。
- 移除反斜線加倍屬於經確認的行為修正：它讓輸入與輸出規則更可預期，但含反斜線的既有範本可能產生不同結果，必須以遷移測試與版本說明明列差異。

### FR-04 自訂 helper

重構後須支援以下 helper，且由一個明確、可測試的註冊模組統一管理。

#### `pascal`

- 用途：只將輸入文字的第一個字元轉為大寫，其餘內容不變。
- `null` 或 `undefined` 回傳空字串；字串、數字與布林值先以 `String(value)` 轉為字串。
- 範例：`helloWorld` → `HelloWorld`。
- 注意：現況並非完整的 PascalCase 單字切分演算法。

#### `camel`

- 用途：只將輸入文字的第一個字元轉為小寫，其餘內容不變。
- `null` 或 `undefined` 回傳空字串；字串、數字與布林值先以 `String(value)` 轉為字串。
- 範例：`HelloWorld` → `helloWorld`。
- 注意：現況並非完整的 camelCase 單字切分演算法。

#### `regex_match`

- 參數順序：正規表示式字串、待比對文字、結果索引。
- 使用 JavaScript `RegExp(regexString, 'gm')`。
- 只取第一次 `exec` 的結果。
- regex 與待比對值為字串、數字或布林值時，先以 `String(value)` 轉為字串；`null` 或 `undefined` 待比對值回傳空字串。
- 結果索引必須是大於或等於 `0` 的整數；否則回傳空字串。
- 回傳指定索引的完整匹配或捕獲群組；未匹配或索引不存在時回傳空字串。
- 正規表示式無效時，應轉換成可顯示的範本錯誤，不得成為未捕捉例外。

物件、陣列、函式及 Symbol 不做隱性字串轉換，應回報可顯示的 helper 型別錯誤，避免產生 `[object Object]` 等通常非預期的輸出。

### FR-05 資料列導覽

- 僅在單筆結果模式且資料筆數大於 1 時顯示「前一筆／後一筆」。
- `dataPointer` 範圍永遠限制在 `0..data.length - 1`。
- 到達第一筆或最後一筆時，不得超出範圍；按鈕應停用或維持在邊界。
- 資料更新導致陣列縮短時，自動將 pointer 修正到有效範圍；空陣列時回到 `0`。
- 切換資料列後立即更新單筆結果。

### FR-06 結果顯示與複製

- 結果使用唯讀 Monaco editor 顯示。
- 點擊結果內容時可全選的既有便利行為應保留。
- 「複製」應複製目前顯示的結果。
- 複製成功或失敗須提供使用者可見的短暫回饋，不可只寫入 console。
- Clipboard API 不可用或權限被拒絕時應顯示錯誤，不得拋出未處理的 Promise rejection。
- 編輯模式若沒有顯示結果，複製按鈕應隱藏或停用，避免複製過期內容。

### FR-07 分享連結

- 既有格式為 `#${Base64.encode(JSON.stringify(workspace))}`，其中 JSON 物件包含 `uData` 與 `templateText`。
- 新版必須能讀取既有格式，包含 UTF-8／中文字元內容。
- 有效 YAML 或範本變更後，系統自動以 `history.replaceState` 更新目前頁面的 hash，不需要先切換到結果模式，且不新增瀏覽器歷史紀錄。
- 更新 hash 應做 debounce，避免每次按鍵都進行序列化與 history 操作。
- hash 寫入與讀取必須集中在單一 adapter，不得與 Monaco 或範本引擎耦合。
- 空字串範本也必須保存，讓使用者能分享或重新載入真正的空 workspace。
- 分享內容可能含敏感資料，教學中必須說明 URL 可被書籤、瀏覽器歷史、通訊軟體或第三方服務留存。

### FR-08 使用教學偏好

- 第一次造訪時自動顯示使用教學。
- 關閉教學後，在 `localStorage` 記錄已讀狀態；重新整理不再自動顯示。
- 使用者仍可由頁首按鈕再次開啟教學。
- `localStorage` 無法使用時，功能仍可運作；最壞情況只是在下次造訪再次顯示教學。
- 儲存值應使用明確版本化 key，例如 `strTemplate:tutorialSeen:v1`，並解析布林語意，不以任意非空字串當作 true。

### FR-09 響應式與基本可及性

- 桌面寬度維持 YAML 與範本／結果左右雙欄。
- 小螢幕改為上下排列，所有編輯器與操作按鈕仍可使用。
- 分頁與按鈕需可用鍵盤操作，並具有可辨識的 focus 狀態。
- 不使用 `href="javascript:;"`；分頁應採 button 或正確的 tab 語意。
- 錯誤、複製結果與目前模式不能只靠顏色表達。
- 外部教學連結若在新分頁開啟，應加入適當的安全屬性。

## 7. 錯誤模型

建議以結構化錯誤供 UI 顯示：

```ts
type AppErrorKind =
  | 'yaml-parse'
  | 'data-shape'
  | 'template-compile'
  | 'template-render'
  | 'share-decode'
  | 'clipboard'

interface AppError {
  kind: AppErrorKind
  message: string
  line?: number
  column?: number
  cause?: unknown
}
```

- UI 顯示對使用者有幫助的中文訊息。
- 原始例外僅供開發環境診斷，不在正式畫面暴露 stack trace。
- 正式版本不得保留現有的高頻 debug `console.log`；必要的錯誤記錄應經統一 logger 並避免輸出使用者 YAML、範本或產生結果。

## 8. 建議架構與責任邊界

檔名可依專案慣例調整，但責任應維持分離。

```text
src/
  domain/
    workspace.js          # 預設值、資料結構驗證、pointer 邊界
    template-engine.js    # helper 註冊、編譯、單筆／總和運算
  adapters/
    share-hash.js         # Base64/JSON/hash 相容層
    tutorial-storage.js   # localStorage 相容層
    clipboard.js          # Clipboard API 與錯誤轉換
  composables/
    useWorkspace.js       # Vue reactive state 與衍生狀態
    useMonacoEditor.js    # editor 建立、同步、dispose
  components/
    StrTemplateEditor.vue # 畫面協調，不承擔 domain 邏輯
    UseHelper.vue
    Header.vue
    Footer.vue
```

設計限制：

- domain 函式不得依賴 Vue、DOM、Monaco、`window` 或 `navigator`。
- adapter 封裝瀏覽器 API，並允許測試時注入替代實作。
- Vue computed 只能計算值，不執行 `editor.setValue`、寫 URL 或修改其他 reactive state。
- editor 內容同步須避免雙向更新造成重複事件或游標跳動。
- 元件中不得使用跨 instance 共用的檔案層級 `pageEditor` 變數。
- 未使用的 `HelloWorld.vue`、未使用 import、樣板註解與 placeholder footer 應移除或換成實際內容。

## 9. 相容性要求

- 舊 URL hash 必須可以載入。
- 除已確認移除的反斜線加倍行為，以及 helper 的 primitive 型別正規化外，相同有效 YAML、範本與資料列在重構前後輸出必須逐字相同。
- 合併輸出維持原順序及 `\n` 分隔，不額外加入結尾換行。
- 教學已讀的舊 key `openUseHelper` 可在第一次載入時遷移到新 key；舊值存在即代表舊版已讀。
- 所有套件升級前須先用 characterization tests 鎖定核心行為；升級造成的必要差異須明列、測試並記錄於版本說明，不得以套件升級為由默默改變輸出。

## 10. 依賴升級要求

- 本次重構包含所有直接依賴與開發依賴的升級；版本以實作當下彼此相容、仍受維護的穩定版本為準。
- 升級至少涵蓋 Vue、Vite、Vue Vite plugin、Vue SFC compiler、Monaco Editor、Template7、js-yaml、js-base64、Bootstrap、Popper、monaco-yaml 與 mkcert plugin。
- 必須確認新的 Node.js 最低版本並寫入 `package.json` 的 `engines`，同時在專案說明中記錄開發環境需求。
- 不保留只因舊版建置工具而存在的設定或 workaround；若新版已有正式做法，應改用新版 API。
- 每一組高風險升級應可獨立驗證。建議順序為建置工具與 Vue、UI／editor、domain libraries，再進行無用依賴清理。
- 升級完成後重新產生 lockfile，執行 build、測試與主要瀏覽器流程，並檢查 production bundle 是否意外同時包含新舊版本。
- `vite-plugin-mkcert` 只用於本機開發；若新版瀏覽器功能不再要求 HTTPS，仍可保留以支援 Clipboard API 與一致的安全環境，但不得影響 production build。

## 11. 測試策略

### 11.1 單元測試

- YAML：有效資料、空內容、語法錯誤、缺少 `data`、非陣列、空陣列、非物件資料列。
- Template：一般欄位、缺少欄位、空範本、反斜線原樣處理、Unicode、編譯錯誤。
- Helper：正常字串、`null`、`undefined`、數字、布林值、Unicode、不支援型別、無效 regex、無匹配及每個捕獲索引。
- 合併結果：零筆、一筆、多筆、原始順序與換行規則。
- Pointer：前後移動、上下界、資料縮短及空資料。
- Hash：舊格式 round-trip、中文、空範本、損壞 Base64、損壞 JSON、錯誤 schema。
- Storage 與 clipboard adapter：成功、API 不存在、權限／quota 失敗。

### 11.2 元件與整合測試

- 編輯有效 YAML 後結果更新。
- 編輯無效 YAML 後顯示錯誤，且保留上一份有效輸出。
- 模式切換、單筆導覽及合併結果正確。
- URL hash 初始化、輸入後自動且 debounced 更新、空範本保存及無效 hash fallback。
- 教學首次開啟、關閉持久化及手動重開。
- 元件卸載後 editor 與事件監聽器已釋放。

### 11.3 端對端測試

- 從預設頁面完成「編輯 YAML → 編輯範本 → 看單筆 → 切下一筆 → 看總和 → 複製」。
- 開啟包含中文與反斜線的舊分享連結，確認資料可還原，且輸出符合新版「不自動加倍反斜線」規則。
- 在桌面及窄螢幕 viewport 完成主要流程。

## 12. 驗收條件

- `npm run build` 成功，正式 build 無未處理警告或明顯 dead code。
- 所有單元、整合與端對端測試通過。
- 對一組固定 fixtures 執行新舊引擎，輸出逐字相同；經確認要修正的差異除外。
- 無效 YAML、錯誤資料形狀、無效範本、無效 regex、損壞 hash 與 clipboard 失敗皆不會造成白畫面。
- 既有分享連結可還原；新版產生的連結重新載入後內容一致。
- 快速連續輸入時，hash 更新已 debounce，UI 無明顯卡頓或游標跳動。
- 重複進出／卸載相關元件後，不殘留 Monaco model、DOM listener 或 modal instance。
- 正式程式碼不記錄使用者輸入內容到 console。
- `package.json` 中的直接與開發依賴均已完成升級，Node.js 版本需求有明確記錄，且 lockfile 與 manifest 一致。

## 13. 已確認的產品決策

以下事項已確認，不再視為重構阻塞問題：

1. **反斜線規則**：移除編譯前自動加倍，範本原樣交給 Template7；接受這是一項經記錄的相容性變更。
2. **資料模型**：產品核心為多筆資料套用範本，固定使用 `{ data: [...] }`；不接受根陣列或根物件的替代寫法。
3. **helper 型別**：字串、數字與布林值明確轉為字串，`null`／`undefined` 回傳空字串，複合型別回報錯誤。
4. **分享時機**：有效 YAML 或範本每次變更後自動、debounced 保存，包含空範本。
5. **總和分隔符**：固定使用 `\n`，本次不新增自訂分隔符或結尾換行設定。
6. **套件升級範圍**：所有直接與開發依賴均納入本次重構，但以測試鎖定行為並分階段驗證。

## 14. 建議執行順序

1. 以現有程式建立 characterization fixtures，鎖定 helper、反斜線、逐筆、總和及 hash 行為，並為已確認變更另列新版期望值。
2. 先升級建置工具與 Vue，讓既有 UI 在新工具鏈可建置及啟動。
3. 抽出純 domain 函式與 adapter，保持未列為變更的行為不變並跑相容測試。
4. 升級 Template7、js-yaml、js-base64 等 domain libraries，逐項處理有測試依據的差異。
5. 建立 workspace composable，移除 computed side effects 與檔案層級 editor 狀態。
6. 升級 Monaco、monaco-yaml、Bootstrap 與 Popper，拆出 editor／modal lifecycle 與同步邏輯，加入 dispose 與 debounce。
7. 補齊結構驗證、錯誤模型、clipboard 回饋、無效 hash fallback 及自動保存。
8. 清理 dead code、debug log、placeholder UI 與不再使用的依賴，完成響應式與基本可及性調整。
9. 通過單元、整合、端對端、production build 與 bundle 檢查後完成驗收。
