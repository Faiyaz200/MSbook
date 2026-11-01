# MSbook — Android Accounting Application

MSbook is a native Android accounting application built with **Kotlin**, **Jetpack Compose**, **Material 3**, **Room Database**, and **Navigation Compose** following strict **MVVM architecture**.

---

## Stage Progression

- **Step 1 — Foundation & Business Management**:
  - Full-screen business selection (Kirana / General Store vs Clothing / Men's Wear).
  - Business details with mandatory name validation.
  - Room database persistence with DataStore active business ID retention across restarts.
  - Multi-business creation, switching, and isolation without cross-contamination.
  - Zero fake accounting balances or mock vouchers on the Dashboard.

- **Step 2 — Complete Voucher System + Sales + Split Payment + Accounting Engine** *(Completed)*:
  - **Full-Screen Voucher Page**:
    - 5 Main Vouchers: Sales Voucher, Purchase Voucher, Receipt Voucher, Payment Voucher, and Split Payment.
    - Expandable "More Vouchers": Contra Voucher, Journal Voucher, Debit Note, Credit Note.
  - **Sales Voucher & Split Payment**:
    - Automatic invoice numbering (`INV-2026-XXXX`).
    - Customer selection & instant customer creation.
    - Barcode scanning simulator and manual product entry.
    - Fractional quantity support for Kirana businesses (e.g. 1.75 kg, 0.5 litre).
    - Size (S/M/L/XL) & color variants for Clothing businesses.
    - Flexible payment allocation: **Cash + UPI + Bank + Udhar = Grand Total** (total allocation must equal invoice total before saving; supports full cash, split payment, and full Udhar credit).
  - **Automatic Double-Entry Postings**:
    - Debits: Cash Account, UPI Account, Bank Account, Customer Receivable.
    - Credits: Sales Account.
    - Cost of Goods Sold snapshot: Debit COGS, Credit Inventory Asset.
    - Stock Register auto-deduction.
  - **Customer Ledger**:
    - Dedicated full-screen ledger statement with customer contact particulars.
    - Complete transaction history with separated payment breakdown (Cash, UPI, Bank, Udhar) and running balances.
    - Summary Cards: Total Sales, Cash Received, UPI Received, Total Received, Total Outstanding.
    - **Exact Verification**: Rahul sample with 4 invoices (Sales ₹6,000, Cash ₹700, UPI ₹3,300, Received ₹4,000, Outstanding ₹2,000).
  - **Receipt Voucher**:
    - Records debt settlement payments (Cash/UPI/Bank) from customers, immediately reducing outstanding balance without creating new sales.
  - **Purchase Voucher**:
    - Records supplier purchases, increments inventory stock, and posts double-entry liability/cash entries.
  - **Dashboard Protection**:
    - Permanent visual reference preserved: dark green header (`#0F4D32`), white cards, bottom navigation, typography, and spacing.

---

## Project Structure

```
android/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradle/
│   └── libs.versions.toml
└── app/
    ├── build.gradle.kts
    └── src/
        └── main/
            ├── AndroidManifest.xml
            ├── res/
            │   ├── values/
            │   │   ├── strings.xml
            │   │   ├── colors.xml     # Dark Green (#0F4D32), White, Soft Green (#F2F8F4)
            │   │   └── themes.xml
            └── java/com/msbook/app/
                ├── MSBookApplication.kt
                ├── MainActivity.kt
                ├── domain/
                │   └── model/
                │       ├── BusinessType.kt
                │       ├── Business.kt
                │       └── VoucherType.kt         # 8 Voucher definitions & prefixes
                ├── data/
                │   ├── local/
                │   │   ├── entity/BusinessEntity.kt
                │   │   ├── dao/BusinessDao.kt
                │   │   └── database/MSBookDatabase.kt
                │   ├── preferences/
                │   │   └── UserPreferencesManager.kt
                │   └── repository/
                │       └── BusinessRepository.kt
                └── ui/
                    ├── theme/
                    │   ├── Color.kt
                    │   ├── Type.kt
                    │   └── Theme.kt
                    ├── components/
                    │   └── BottomNavigationBar.kt # 5-item Bottom Navigation Bar
                    ├── navigation/
                    │   ├── Screen.kt
                    │   └── NavGraph.kt
                    └── screens/
                        ├── business_select/
                        ├── business_details/
                        ├── dashboard/
                        │   ├── DashboardViewModel.kt
                        │   └── DashboardScreen.kt # Preserved design reference
                        ├── vouchers/
                        │   ├── VoucherScreen.kt   # 2-col grid + expandable More Vouchers
                        │   └── VoucherDetailScreen.kt # Full-screen voucher placeholder
                        ├── placeholders/
                        │   └── SimplePlaceholderScreen.kt # Ledgers, Inventory, Reports
                        └── business_switcher/
```

---

## Build Instructions (Android Studio)

1. Open Android Studio (Ladybug 2024.2.1 or newer).
2. Choose **File > Open...** and select `/android`.
3. Build the project via Gradle:
   ```bash
   ./gradlew assembleDebug
   ```
4. Output APK location:
   `app/build/outputs/apk/debug/app-debug.apk`
