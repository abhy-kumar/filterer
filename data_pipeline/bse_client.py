"""
bse_client.py
-------------
BSE India exchange integration client for Filterer.
Provides:
  1. Resolution of NSE ticker symbols to official 6-digit BSE scrip codes.
  2. Official quarterly Shareholding Pattern data (Promoter, FII, DII, Public, Pledged %)
     directly from BSE India regulatory API endpoints.
  3. Direct links to BSE Annual Reports, Corporate Announcements, and Financials.

Zero API keys, zero paid subscriptions. Uses standard public BSE India endpoints
with session cookie initialization.
"""

import time
import logging
from typing import Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
import requests

logger = logging.getLogger("bse_client")

_BSE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Referer": "https://www.bseindia.com/",
    "Connection": "keep-alive",
}

# Known verified BSE scrip codes for top constituents (fast static fallback)
STATIC_BSE_MAP: Dict[str, str] = {
    "RELIANCE": "500325",
    "TCS": "532540",
    "HDFCBANK": "500180",
    "BHARTIARTL": "532454",
    "ICICIBANK": "532174",
    "INFY": "500209",
    "SBIN": "500112",
    "ITC": "500875",
    "LT": "500510",
    "HINDUNILVR": "500696",
    "BAJFINANCE": "500034",
    "MARUTI": "532500",
    "SUNPHARMA": "524715",
    "KOTAKBANK": "500247",
    "AXISBANK": "532215",
    "NTPC": "532555",
    "ONGC": "500312",
    "POWERGRID": "532898",
    "M&M": "500520",
    "TITAN": "500114",
    "ADANIENT": "512599",
    "ADANIPORTS": "532921",
    "TATASTEEL": "500470",
    "HCLTECH": "532281",
    "WIPRO": "507685",
    "COALINDIA": "533278",
    "NESTLEIND": "500790",
    "ULTRACEMCO": "532538",
    "JSWSTEEL": "500228",
    "TATAMOTORS": "500570",
    "TMCV": "500570",
    "ASIANPAINT": "500820",
    "BAJAJFINSV": "532978",
    "DMART": "540376",
    "LTIM": "540005",
    "GRASIM": "500300",
    "TECHM": "532755",
    "VEDL": "500295",
    "HINDALCO": "500440",
    "INDUSINDBK": "532187",
    "DIVISLAB": "532488",
    "CIPLA": "500087",
    "EICHERMOT": "505200",
    "BPCL": "500547",
    "BRITANNIA": "500825",
    "APOLLOHOSP": "508869",
    "HEROMOTOCO": "500182",
    "BEL": "500049",
    "HAL": "541154",
    "VBL": "540180",
    "ZOMATO": "543320",
    "JIOFIN": "543940",
    "TRENT": "500251",
    "CHOLAFIN": "511243",
    "BAJAJ-AUTO": "532977",
    "SHRIRAMFIN": "511218",
    "PFC": "532810",
    "RECLTD": "532955",
    "GAIL": "532155",
    "DLF": "532868",
    "SIEMENS": "500550",
    "ABB": "500002",
    "HDFCLIFE": "540777",
    "SBILIFE": "540719",
    "ICICIPRULI": "540133",
    "TATACONSUM": "500800",
    "BANKBARODA": "532134",
    "PNB": "532461",
    "CANBK": "532483",
    "UNIONBANK": "532477",
    "IDFCFIRSTB": "539437",
    "FEDERALBNK": "500469",
    "POLYCAB": "542652",
    "HAVELLS": "517354",
    "PIDILITIND": "500331",
    "GODREJCP": "532424",
    "DABUR": "500096",
    "COLPAL": "500830",
    "MARICO": "531642",
    "BERGEPAINT": "509480",
    "TVSMOTOR": "532343",
    "BALKRISIND": "502355",
    "BHARATFORG": "500493",
    "MOTHERSON": "517334",
    "BOSCHLTD": "500530",
    "LUPIN": "500257",
    "DRREDDY": "500124",
    "AUROPHARMA": "524804",
    "ALKEM": "539523",
    "TORNTPHARM": "500420",
    "MANAPPURAM": "531213",
    "MUTHOOTFIN": "533398",
    "LICHSGFIN": "500253",
    "INDIACEM": "530005",
    "ACC": "500410",
    "AMBUJACEM": "500425",
    "DALBHARAT": "542216",
    "SHREECEM": "500387",
    "JINDALSTEL": "532286",
    "SAIL": "500113",
    "NMDC": "526371",
    "IOC": "530965",
    "HINDPETRO": "500104",
    "PETRONET": "532522",
    "IGL": "532514",
    "MGL": "539957",
    "GUJGASLTD": "539336",
    "CONCOR": "531349",
    "IRCTC": "542830",
    "IRFC": "543257",
    "RVNL": "542649",
    "BHEL": "500103",
    "NHPC": "533098",
    "SJVN": "533206",
    "TORNTPOWER": "532779",
    "TATAPOWER": "500400",
    "ADANIGREEN": "541450",
    "ADANIPOWER": "533096",
    "ATGL": "542066",
}

class BSEClient:
    """Session-managed BSE India API client with automated cookie renewal."""

    def __init__(self):
        self._session: Optional[requests.Session] = None
        self._session_expiry: Optional[datetime] = None
        self._nse_to_bse_map: Optional[Dict[str, str]] = None

    def _get_session(self) -> requests.Session:
        now = datetime.now()
        if self._session is not None and self._session_expiry and now < self._session_expiry:
            return self._session

        session = requests.Session()
        session.headers.update(_BSE_HEADERS)

        # Seed cookies by visiting home
        try:
            resp = session.get("https://www.bseindia.com", timeout=10)
            if resp.status_code == 200:
                self._session = session
                self._session_expiry = now + timedelta(minutes=25)
                return session
        except Exception as e:
            logger.warning(f"BSE home cookie seeding failed: {e}")

        self._session = session
        self._session_expiry = now + timedelta(minutes=5)
        return session

    def get_bse_code(self, nse_symbol: str) -> str:
        """Resolve NSE symbol to official 6-digit BSE scrip code."""
        clean = nse_symbol.upper().replace(".NS", "").replace(".BO", "")

        # Check static high-priority map first
        if clean in STATIC_BSE_MAP:
            return STATIC_BSE_MAP[clean]

        # Lazy-load full BSE equity stock master if not cached
        if self._nse_to_bse_map is None:
            self._load_bse_master_list()

        if self._nse_to_bse_map and clean in self._nse_to_bse_map:
            return self._nse_to_bse_map[clean]

        return ""

    def _load_bse_master_list(self) -> None:
        """Fetch all equity mappings from BSE GetStkLstDt API."""
        session = self._get_session()
        url = "https://www.bseindia.com/BSEIndiaAPI/api/GetStkLstDt/w?Indx=EQ&Industry=ALL&Flag=0"
        try:
            resp = session.get(url, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                mapping: Dict[str, str] = {}
                for row in data.get("Table", []):
                    code = str(row.get("Code", "")).strip()
                    short_name = (row.get("ShortName") or "").strip().upper()
                    isin = (row.get("ISIN") or "").strip()
                    if short_name and code:
                        mapping[short_name] = code
                    if isin and code:
                        mapping[isin] = code
                self._nse_to_bse_map = mapping
                logger.info(f"Loaded {len(mapping)} BSE scrip code mappings from API.")
                return
        except Exception as e:
            logger.warning(f"Failed to fetch live BSE stock list: {e}")

        self._nse_to_bse_map = dict(STATIC_BSE_MAP)

    def get_shareholding_pattern(self, nse_symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch verified shareholding data from BSE ShareholdingPattern API.
        Returns dict with promoter %, fii %, dii %, public %, and pledged %.
        """
        bse_code = self.get_bse_code(nse_symbol)
        if not bse_code:
            return None

        session = self._get_session()
        url = f"https://www.bseindia.com/BSEIndiaAPI/api/ShareholdingPattern/w?CompCode={bse_code}"
        try:
            resp = session.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                rows = data.get("Table", [])
                if rows:
                    latest = rows[-1]
                    promoter = float(latest.get("Promoters") or 0.0)
                    pledged = float(latest.get("PromoterPledge") or latest.get("Pledge") or 0.0)
                    fii = float(latest.get("FII") or latest.get("FPI") or 0.0)
                    dii = float(latest.get("DII") or latest.get("MutualFunds") or 0.0)
                    pub = round(max(0.0, 100.0 - promoter - fii - dii), 2)

                    return {
                        "promoter_holding": round(promoter, 2),
                        "pledged_percentage": round(pledged, 2),
                        "fii_holding": round(fii, 2),
                        "dii_holding": round(dii, 2),
                        "public_holding": pub,
                    }
        except Exception as e:
            logger.debug(f"BSE shareholding lookup failed for {nse_symbol}: {e}")

        return None

# Singleton instance
bse_client = BSEClient()
