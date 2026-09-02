"""
Firebase Firestore Uploader for Filterer Data Pipeline.

Uploads stock data and market indices to Firebase Firestore
so the frontend can fetch stock details on demand.

Requires a service account key at:
    data_pipeline/firebase-credentials.json

Usage:
    Called by generate_stocks_dataset.py with --firebase flag.
"""

import os
import json
import logging
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Path to service account credentials
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")


def _get_firestore_client():
    """Initialize and return Firestore client using service account."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        raise ImportError(
            "firebase-admin is not installed. Run: pip install firebase-admin"
        )

    if not os.path.exists(CREDENTIALS_PATH):
        raise FileNotFoundError(
            f"Firebase credentials not found at {CREDENTIALS_PATH}. "
            f"Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key"
        )

    # Initialize only once
    if not firebase_admin._apps:
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)

    return firestore.client()


def _clean_for_firestore(data: Any) -> Any:
    """
    Clean data for Firestore compatibility.
    - Convert NaN/Inf to 0
    - Ensure all values are JSON-serializable
    """
    if isinstance(data, dict):
        return {k: _clean_for_firestore(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_clean_for_firestore(item) for item in data]
    elif isinstance(data, float):
        if data != data or data == float('inf') or data == float('-inf'):
            return 0.0
        return data
    return data


def upload_to_firestore(stocks: list[dict], batch_size: int = 50) -> None:
    """
    Upload stock data to Firestore.

    Each stock is stored as a document in the 'stocks' collection,
    keyed by the stock symbol (e.g., 'RELIANCE', 'TCS').

    Uses batched writes for efficiency (Firestore limit: 500 writes per batch).
    """
    db = _get_firestore_client()
    from firebase_admin import firestore as fs

    total = len(stocks)
    logger.info(f"Uploading {total} stocks to Firestore...")

    # Upload stocks in batches
    for i in range(0, total, batch_size):
        batch = db.batch()
        chunk = stocks[i : i + batch_size]

        for stock in chunk:
            symbol = stock["symbol"]
            doc_ref = db.collection("stocks").document(symbol)
            clean_data = _clean_for_firestore(stock)
            batch.set(doc_ref, clean_data, merge=True)

        batch.commit()
        logger.info(f"  Uploaded batch {i // batch_size + 1}: stocks {i + 1}-{min(i + batch_size, total)}")

    logger.info(f"OK All {total} stocks uploaded to Firestore")


def upload_market_indices(indices_path: str = "data/market_indices.json") -> None:
    """
    Upload market indices data to Firestore.

    Stored as a single document: market/indices
    """
    db = _get_firestore_client()

    if not os.path.exists(indices_path):
        logger.warning(f"Market indices file not found: {indices_path}")
        return

    with open(indices_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    doc_ref = db.collection("market").document("indices")
    doc_ref.set(_clean_for_firestore(data), merge=True)
    logger.info(f"OK Market indices uploaded to Firestore")


def verify_upload(symbol: str = "RELIANCE") -> None:
    """Verify a stock document exists in Firestore."""
    db = _get_firestore_client()
    doc_ref = db.collection("stocks").document(symbol)
    doc = doc_ref.get()

    if doc.exists:
        data = doc.to_dict()
        logger.info(f"OK Verified {symbol}: ₹{data.get('current_price', '?')} | MCap ₹{data.get('market_cap', '?')} Cr")
    else:
        logger.error(f"FAIL Document {symbol} not found in Firestore")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        sym = sys.argv[2] if len(sys.argv) > 2 else "RELIANCE"
        verify_upload(sym)
    elif len(sys.argv) > 1 and sys.argv[1] == "indices":
        upload_market_indices()
    else:
        print("Usage:")
        print("  python -m data_pipeline.firebase_uploader verify [SYMBOL]")
        print("  python -m data_pipeline.firebase_uploader indices")
        print()
        print("For full upload, use: python scripts/generate_stocks_dataset.py --firebase")
