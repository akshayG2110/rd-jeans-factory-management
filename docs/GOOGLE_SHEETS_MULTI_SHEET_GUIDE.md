# Akshay RD Jeans - Full Factory Google Sheets Multi-Sheet Sync Guide

This guide documents the **Live Cloud Ledger & Multi-Sheet Sync** integration for the Akshay RD Jeans factory management system. It synchronizes **all 12 Quick Access modules** into their own **separate sheet tabs** within a single Google Spreadsheet.

---

## 📑 12 Modules & Separate Sheet Tabs Mapping

| Module Name | Quick Access Route | Google Sheet Tab Name | What is Stored in This Sheet |
| :--- | :--- | :--- | :--- |
| **Employees** | `/employees` | **`Employees`** | Staff ID, Name, Role, Joining Date, Active/Inactive Status, Created Date |
| **Upad (Advances)** | `/upad` | **`Upad`** | Advance ID, Date, Employee Name, Advance Amount (₹), Payment Method, Handled By, Settled In Salary ID, Settled Date, Notes |
| **Seth (Clients)** | `/seths` | **`Seths`** | Seth ID, Seth Name, Mobile Number, Factory Address, Status, Total Fabric Rolls Received, Total Meters Received, Notes |
| **Hisab Seth** | `/hisab-seth` | **`Seth Hisab`** | Bill No, Date, Seth Client, Cutting Lots Settled, Total Pieces, Total Meters Used, Fabric Avg (m/pc), Stitching Rate (₹), Gross Total, Paid Amount, Balance Due, Payment Status, Method, Handled By |
| **Cutting** | `/cutting` | **`Cutting`** | Cutting ID, Date, Lot No, Worker/Cutter, Seth Client, Roll No, Fabric Type, Meters Used, Pieces Cut, Size, Pana, Average (m/pc), Sort No, Notes |
| **Finished Goods** | `/inventory` | **`Finished Goods`** | Finished Good ID, Lot No, Seth Client, Item Name (Jeans), Size, Color/Shade, Total Pieces, In Stitching, Finished/Ready, Rejected, Dispatched, Unit Price, Status, Dispatch Date |
| **Roll Inventory** | `/rolls` | **`Rolls`** | Roll ID, Entry Date, Seth Client, Roll No, Short No, Fabric Type, Received Meters, Used Meters, Remaining Meters in Stock, Status, Notes |
| **Partners** | `/partners` | **`Partners`** | Partner ID, Name, Mobile, Profit Share %, Opening Capital Balance, Current Equity Balance, Total Invested, Total Drawings, Status |
| **Income** | `/income` | **`Income`** | Income ID, Date, Source Category, Party/Source Name, Amount (₹), Payment Method, Handled By, Ref No, Notes |
| **Expenses** | `/expense` | **`Expenses`** | Expense ID, Date, Expense Category, Party/Payee Name, Amount (₹), Payment Method, Handled By, Ref No, Notes |
| **Cash Book** | `/cashbook` | **`Cash Book`** | Entry ID, Date, Type (Income/Expense), Particulars, Payment Method, Handled By, Inflow (₹), Outflow (₹), Running Cash Balance (₹), Reference Module |
| **Reports Summary** | `/reports` | **`Reports Summary`** | Factory KPIs: Total Staff, Fabric In Warehouse, Cutting Output, Seth Billing, Pending Receivables, Cash Balance, Partner Capital |

---

## ⚡ 2-Minute Setup Instructions

### Step 1: Create a Google Spreadsheet
1. Open [Google Sheets](https://sheets.new) in your web browser.
2. Name the spreadsheet (e.g. `Akshay RD Jeans - Live Factory Ledger`).

### Step 2: Open Google Apps Script
1. In the Google Sheets top menu, click **Extensions** $\rightarrow$ **Apps Script**.
2. Delete any existing template code in the editor.

### Step 3: Paste the Universal Multi-Sheet Script
Copy the script below and paste it into Apps Script:

```javascript
// =========================================================================
// AKSHAY RD JEANS FACTORY - GOOGLE SHEETS LIVE MULTI-SHEET SYNC SCRIPT
// =========================================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = data.action;

    // 1. Connection Ping Test
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Connected! Google Sheet is ready to receive live factory data across all tabs."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Helper: Create or update a specific sheet tab
    function updateSheetTab(sheetName, headers, rows) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      sheet.clearContents();
      
      // Write Header Row with Navy Blue styling
      if (headers && headers.length > 0) {
        sheet.appendRow(headers);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#1E3A8A"); // Navy blue
        headerRange.setFontColor("#FFFFFF");
        headerRange.setHorizontalAlignment("center");
        sheet.setFrozenRows(1);
      }
      
      // Batch write all data rows instantly
      if (rows && rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      // Auto-fit column widths
      if (headers && headers.length > 0) {
        sheet.autoResizeColumns(1, Math.min(headers.length, 20));
      }
      
      return rows ? rows.length : 0;
    }

    // 2. Full Factory Sync: All 12 modules in separate tabs
    if (action === "sync_factory") {
      var results = {};
      var modules = data.modules || {};
      for (var modName in modules) {
        if (modules.hasOwnProperty(modName)) {
          var mod = modules[modName];
          results[modName] = updateSheetTab(modName, mod.headers, mod.rows);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "All factory modules synced to separate sheet tabs successfully!",
        results: results
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Single Module Sync
    if (action === "sync_module" || action === "replace_all") {
      var modName = data.module || "General";
      var count = updateSheetTab(modName, data.headers || [], data.rows || []);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        module: modName,
        rowCount: count
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Real-time Append Row (for live creations)
    if (action === "append_row") {
      var sheetName = data.module || "General";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      if (sheet.getLastRow() === 0 && data.headers && data.headers.length > 0) {
        sheet.appendRow(data.headers);
        var headerRange = sheet.getRange(1, 1, 1, data.headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#1E3A8A");
        headerRange.setFontColor("#FFFFFF");
        headerRange.setHorizontalAlignment("center");
        sheet.setFrozenRows(1);
      }
      if (data.row) {
        sheet.appendRow(data.row);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        module: sheetName,
        rowCount: sheet.getLastRow() - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 4: Deploy as Web App
1. Click **Save** in Apps Script (floppy disk icon).
2. Click **Deploy** (top right) $\rightarrow$ **New deployment**.
3. Under *Select type*, choose **Web app**.
4. Set **Who has access** to **Anyone**. *(Crucial: This enables the app to post sync data without complicated OAuth authentication)*.
5. Click **Deploy**, then copy your **Web app URL** (`https://script.google.com/macros/s/.../exec`).

### Step 5: Save in App & Sync
1. Open the app and click **Sheets Sync** (in the Dashboard header or Quick Access).
2. Or navigate directly to `/google-sheets`.
3. Paste your Web App URL into the box and click **Save URL**.
4. Click **Test Connection** to confirm.
5. Click **`Sync Entire Factory (All 12 Sheets)`** to instantly create and populate all 12 sheet tabs in your spreadsheet!

---

## 🔄 Live Features
1. **Zero Data Loss**: Whenever a new entry or payment is recorded, it is saved in your local database AND automatically synced to your Google Sheet in the background.
2. **Individual Tab Sync**: You can sync any individual tab (e.g. only *Cutting* or only *Cash Book*) anytime.
3. **Multi-device Access**: Check factory stock, cutting lots, and financial balances directly on your smartphone through the Google Sheets app.
