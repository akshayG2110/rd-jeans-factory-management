# RD Jeans Edge Case & Boundary Value Testing
**Document ID:** `QA-DOC-008-EDGE-CASES`  
**System:** RD Jeans Factory Management System  

---

## 1. Objective & Scope

Edge cases in garment manufacturing software occur at the extremes of financial amounts, fabric meter boundaries, decimal precision limits, and date transitions. This document specifies boundary conditions that must be tested across all services.

---

## 2. Systematic Edge Case Catalog by Domain

### 2.1 Cashbook & Financial Transactions
- **Zero Inflow/Outflow**: Logging entries where `income_amount = 0` and `out_amount = 0`.
- **Negative Balance Handling**: Cashbook balance dropping below zero (e.g., expenses exceeding cash on hand). The system must compute negative balances correctly without integer underflow or formatting corruption.
- **Large Integer Values**: Handling factory payouts exceeding ₹1,00,00,000 (1 Crore INR) without overflow.
- **Micro-Decimals**: Currency fractions (e.g., ₹12,345.50) maintaining two-decimal precision without JavaScript binary floating-point drift (`0.1 + 0.2 !== 0.3`).

### 2.2 Fabric Rolls & Cutting Operations
- **Exact Consumption Boundary**: Cutting lot consuming exactly $100.00\%$ of remaining meters on a roll (e.g., remaining meter = 45.50m, lot uses 45.50m $\rightarrow$ remaining meter = 0.00m, status = `Completed`).
- **Near-Zero Remainder**: Fabric roll left with tiny fractions (e.g., 0.15 meters). Roll status must remain `Partially Used` until explicitly marked completed.
- **Excess Layer Count**: High piece yield with small pana (e.g., 100 layers producing 200 pieces on 40m). Average meter per piece calculation must handle division accurately.

### 2.3 Salary & Upad Settlements
- **Upad Greater Than Base Salary**: Worker has ₹15,000 salary but took ₹18,000 in advances. Net payable becomes negative or remaining advance carries forward.
- **Zero Paid Amount**: Worker's salary calculated and settled, but no cash handed out (`paid_amount = 0`). Net payable remains as `remaining_amount`.
- **Multiple Upad Settlements in Single Payout**: Settling 5 distinct weekly advances simultaneously in one month-end payout. All 5 IDs must be atomically marked `Settled`.
- **Leap Year & Month Boundary**: Processing payroll for February in leap years vs. non-leap years.

### 2.4 Partner Capital & Drawings
- **Zero Investment Partner**: Managing partner with profit share percentage but zero initial capital.
- **Drawings Exceeding Capital Equity**: Partner withdrawing more cash than current equity balance.
