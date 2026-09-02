# Backend Architecture & Cloud Storage Guide

This document outlines the data synchronization architecture for **Filterer** and provides step-by-step configuration for automated pipelines (GitHub Actions) and optional Firebase integration without triggering security alert emails.

---

## Recommended Architecture: GitHub Actions + Git Edge CDN

Filterer is configured by default to use **GitHub Actions + Vercel Edge CDN**. 

### Why This Is Ideal:
1. **100% Free and Zero Server Maintenance**: Uses GitHub's free public runners and Vercel's Edge CDN.
2. **Zero Security Warnings**: No open database endpoints, no API key exposure, and zero risk of automated security email warnings from cloud providers.
3. **Continuous Automation**: GitHub Actions runs automatically every weekday at 3:45 PM IST (post market close) to fetch official Bhav Copy and fundamental metrics, rebuild the SQLite database, chunk files into 40MB parts, and update the application.

### Workflow Configuration:
The workflow is located in [`.github/workflows/update_market_data.yml`](../.github/workflows/update_market_data.yml).

- **Schedule**: `15 10 * * 1-5` (10:15 UTC / 3:45 PM IST, Mon–Fri).
- **Manual Trigger**: Can be dispatched on-demand from the GitHub Actions tab.

---

## Optional: Firebase Firestore Integration

If you prefer using Firebase Firestore to store real-time quotes or user watchlists, follow the steps below to ensure **strict security rules** that prevent Google Cloud from sending "Unsecured Database" warning emails.

### 1. Firestore Security Rules (Zero Warning Guarantee)

Google Cloud sends warning emails when Firestore rules contain `allow read, write: if true;` or open timestamp conditions. 

To allow public read-only access for stocks while restricting all write operations exclusively to your backend service account, configure your `firestore.rules` as follows:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read-only access to stock market data
    match /stocks/{stockId} {
      allow read: if true;
      allow write: if false; // Denies all client writes. Writes must use Firebase Admin SDK
    }
    
    // Market indices and status
    match /market_status/{docId} {
      allow read: if true;
      allow write: if false;
    }

    // Default deny for all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Updating Firestore from Python (Admin SDK)

When `allow write: if false;` is set in client rules, the Firebase Admin SDK bypasses security rules safely using a server private key.

1. Generate a private key from **Firebase Console > Project Settings > Service Accounts > Generate New Private Key**.
2. Save the JSON key securely (e.g., in GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT_KEY`).
3. Use the following script to publish updates:

```python
import json
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin with Service Account
cred_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
if cred_json:
    cred = credentials.Certificate(json.loads(cred_json))
else:
    cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred)
db = firestore.client()

def upload_stocks_to_firestore(stocks_data):
    batch = db.batch()
    for stock in stocks_data:
        doc_ref = db.collection("stocks").document(stock["symbol"])
        batch.set(doc_ref, stock)
    batch.commit()
    print("Successfully published stocks data to Firestore.")
```

---

## Live Data Strategy Summary

| Strategy | Frequency | Cost | Security Exposure |
|---|---|---|---|
| **GitHub Actions (Default)** | Daily Post-Close (3:45 PM IST) | $0 / month | Zero external DB exposure |
| **Client Live Ticker Hook** | 12s interval (Active tab) | $0 / month | Public read proxy `/api/market_indices` |
| **Firebase Firestore** | Real-time | Free Spark Plan | Public read-only, Private Admin write |
