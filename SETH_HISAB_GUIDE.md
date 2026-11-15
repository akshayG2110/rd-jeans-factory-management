# Akshay RD Jeans - Hisab Seth Step-by-Step User Guide

> **Note:** The full guide with diagrams and quick reference tables is located at [docs/SETH_HISAB_WORKFLOW_GUIDE.md](file:///d:/Akshay%20RD%20jeans/docs/SETH_HISAB_WORKFLOW_GUIDE.md).

---

## 📌 Summary Flow

1. **Step 1: Fabric Arrival**
   * Dashboard $\rightarrow$ **Roll Inventory** $\rightarrow$ Click **`+ Add Roll`**
   * Select Seth, enter Roll #, and meters received (e.g. 500m).

2. **Step 2: Cutting Entry**
   * Dashboard $\rightarrow$ **Cutting** $\rightarrow$ Click **`+ New Cutting Entry`**
   * Select the Roll, enter meters used (e.g. 200m) and pieces cut (e.g. 150 pcs).
   * System deducts fabric from roll and starts stitching in the sewing line.

3. **Step 3: Stitching Work & Mark Complete**
   * Dashboard $\rightarrow$ **Hisab Seth**
   * When stitching workers finish all pieces, click **`✓ Complete Stitching`** on the lot card.
   * Lot status turns to 🟢 **Stitching Complete (Ready for Hisab)**.

4. **Step 4: Make Seth Hisab**
   * In **Hisab Seth**, click **`Make Hisab`** (or **`+ New Hisab`**).
   * Checkmark the completed lots.
   * Enter your **Stitching Rate** (e.g. `₹50`/pc).
   * *(Optional)* Enter extra charges (Washing, Trims) or deductions.
   * Enter advance/cash received now (e.g. `₹3,000`).
   * Click **`Save & Generate Hisab`**.

5. **Step 5: Print Slip & Track Balance**
   * Click **`Print Slip`** to print the clean invoice slip for the Seth.
   * Payment is **automatically synced to Cash Book** and Seth Account.
   * If balance is left, click **`Pay Balance`** anytime later when Seth clears payment.

6. **Step 6: Import & Export Hisab Records**
   * **Export to Excel / CSV**:
     * Click **`Export`** at the top right (or choose **`Excel (.xlsx)`** or **`CSV`** in the *Hisab Bills & Slips* tab).
     * Instantly downloads a formatted Excel spreadsheet with both Summary and Cutting Lot breakdowns.
   * **Import Past Hisab Data**:
     * Click **`Import`** $\rightarrow$ Click **`Template`** to download the sample format.
     * Choose your `.csv` or `.xlsx` file, preview the rows, and click **`Import Now`**.

7. **Step 7: Real-Time Google Sheets Sync (Zero Data Loss)**
   * **One-Time 2-Minute Setup**:
     1. Open [Google Sheets](https://sheets.new) and create a new sheet.
     2. In the top menu, go to **Extensions** $\rightarrow$ **Apps Script**.
     3. In the Hisab Seth screen, click **`Google Sheets`** at top right and click **`Copy Script`**.
     4. Paste the script into Google Apps Script, click **Save**, then click **Deploy** $\rightarrow$ **New deployment**.
     5. Select **Web app**, set *Who has access* to **Anyone**, and click **Deploy**.
     6. Copy the **Web App URL**, paste it into Hisab Seth, and click **Save Settings**.
   * **How it works**:
     * Every time a Hisab bill is generated or a balance payment is made, a new row is instantly appended to your Google Spreadsheet in real time in the background.
     * Click **`Sync All Now`** anytime to push all past existing hisab records to your sheet with 1 click.

