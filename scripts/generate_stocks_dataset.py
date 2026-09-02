import json
import sqlite3
import os
import math
import subprocess

STOCKS_MASTER = [
  # Information Technology
  {
    "symbol": "TCS", "nse_symbol": "TCS", "bse_code": "532540", "name": "Tata Consultancy Services Ltd",
    "sector": "Information Technology", "industry": "IT Services & Consulting",
    "about": "Tata Consultancy Services is an Indian multinational information technology services and consulting company headquartered in Mumbai. It is a part of the Tata Group and operates in 150 locations across 46 countries.",
    "website": "https://www.tcs.com",
    "current_price": 3880.0, "change": 24.5, "change_pct": 0.63, "market_cap": 1403500,
    "high_52w": 4585.0, "low_52w": 3610.0, "face_value": 1.0, "volume": 1845000,
    "pe_ratio": 29.8, "industry_pe": 28.5, "pb_ratio": 14.2, "peg_ratio": 2.4, "graham_number": 1150.0,
    "ev_ebitda": 20.4, "price_to_sales": 5.8, "price_to_fcf": 28.2, "dividend_yield": 1.95, "book_value": 273.2,
    "roce": 58.4, "roe": 49.8, "opm": 26.2, "npm": 19.3,
    "sales_growth_3y": 11.8, "sales_growth_5y": 10.9, "sales_growth_10y": 11.2,
    "profit_growth_3y": 10.5, "profit_growth_5y": 9.2, "profit_growth_10y": 9.8,
    "price_cagr_1y": -2.4, "price_cagr_3y": 6.8, "price_cagr_5y": 14.2, "price_cagr_10y": 16.5,
    "roe_3y": 48.6, "roe_5y": 45.2, "roe_10y": 42.0,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 120.0, "current_ratio": 2.6,
    "piotroski_score": 8, "altman_z_score": 14.8,
    "debtor_days": 68, "inventory_days": 0, "days_payable": 22, "working_capital_days": 46, "cash_conversion_cycle": 46,
    "cfo_latest": 44500, "cfo_3y": 125000, "cfo_5y": 195000, "fcf_latest": 41200, "fcf_3y": 116000, "fcf_5y": 182000, "fcf_yield": 2.93,
    "promoter_holding": 71.77, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 12.35, "change_in_fii_holding_quarter": -0.15,
    "dii_holding": 10.42, "change_in_dii_holding_quarter": 0.28, "public_holding": 5.46,
    "dma_50": 3950.0, "dma_200": 4120.0, "rsi_14": 46.2, "distance_52w_high": -15.38, "distance_52w_low": 7.48
  },
  {
    "symbol": "INFY", "nse_symbol": "INFY", "bse_code": "500209", "name": "Infosys Ltd",
    "sector": "Information Technology", "industry": "IT Services & Consulting",
    "about": "Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.",
    "website": "https://www.infosys.com",
    "current_price": 1820.0, "change": -12.4, "change_pct": -0.68, "market_cap": 755400,
    "high_52w": 2006.0, "low_52w": 1358.0, "face_value": 5.0, "volume": 4520000,
    "pe_ratio": 28.5, "industry_pe": 28.5, "pb_ratio": 8.8, "peg_ratio": 2.2, "graham_number": 680.0,
    "ev_ebitda": 19.5, "price_to_sales": 4.9, "price_to_fcf": 26.5, "dividend_yield": 2.25, "book_value": 206.8,
    "roce": 39.2, "roe": 31.8, "opm": 22.8, "npm": 17.2,
    "sales_growth_3y": 12.4, "sales_growth_5y": 12.8, "sales_growth_10y": 11.9,
    "profit_growth_3y": 9.8, "profit_growth_5y": 10.4, "profit_growth_10y": 9.5,
    "price_cagr_1y": 14.5, "price_cagr_3y": 3.8, "price_cagr_5y": 18.2, "price_cagr_10y": 15.8,
    "roe_3y": 31.2, "roe_5y": 29.5, "roe_10y": 26.4,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 85.0, "current_ratio": 2.2,
    "piotroski_score": 7, "altman_z_score": 11.5,
    "debtor_days": 65, "inventory_days": 0, "days_payable": 20, "working_capital_days": 45, "cash_conversion_cycle": 45,
    "cfo_latest": 26500, "cfo_3y": 74000, "cfo_5y": 115000, "fcf_latest": 24200, "fcf_3y": 68000, "fcf_5y": 105000, "fcf_yield": 3.2,
    "promoter_holding": 14.60, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 33.15, "change_in_fii_holding_quarter": 0.45,
    "dii_holding": 36.80, "change_in_dii_holding_quarter": 0.12, "public_holding": 15.45,
    "dma_50": 1880.0, "dma_200": 1760.0, "rsi_14": 49.5, "distance_52w_high": -9.27, "distance_52w_low": 34.02
  },
  {
    "symbol": "HCLTECH", "nse_symbol": "HCLTECH", "bse_code": "532281", "name": "HCL Technologies Ltd",
    "sector": "Information Technology", "industry": "IT Services & Consulting",
    "about": "HCLTech is a global technology company, delivering industry-leading capabilities centered around digital, engineering, cloud, and AI.",
    "website": "https://www.hcltech.com",
    "current_price": 1780.0, "change": 15.2, "change_pct": 0.86, "market_cap": 482500,
    "high_52w": 1905.0, "low_52w": 1302.0, "face_value": 2.0, "volume": 2100000,
    "pe_ratio": 28.2, "industry_pe": 28.5, "pb_ratio": 6.8, "peg_ratio": 2.1, "graham_number": 620.0,
    "ev_ebitda": 17.8, "price_to_sales": 4.2, "price_to_fcf": 24.5, "dividend_yield": 3.05, "book_value": 261.5,
    "roce": 32.5, "roe": 25.8, "opm": 21.5, "npm": 14.8,
    "sales_growth_3y": 14.8, "sales_growth_5y": 12.5, "sales_growth_10y": 12.8,
    "profit_growth_3y": 12.4, "profit_growth_5y": 10.2, "profit_growth_10y": 11.2,
    "price_cagr_1y": 28.5, "price_cagr_3y": 14.2, "price_cagr_5y": 24.5, "price_cagr_10y": 18.2,
    "roe_3y": 25.2, "roe_5y": 24.1, "roe_10y": 25.0,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 72.0, "current_ratio": 2.1,
    "piotroski_score": 8, "altman_z_score": 9.5,
    "debtor_days": 62, "inventory_days": 0, "days_payable": 18, "working_capital_days": 44, "cash_conversion_cycle": 44,
    "cfo_latest": 19800, "cfo_3y": 52000, "cfo_5y": 79000, "fcf_latest": 18200, "fcf_3y": 48000, "fcf_5y": 73000, "fcf_yield": 3.77,
    "promoter_holding": 60.81, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 19.50, "change_in_fii_holding_quarter": 0.25,
    "dii_holding": 15.10, "change_in_dii_holding_quarter": -0.15, "public_holding": 4.59,
    "dma_50": 1795.0, "dma_200": 1640.0, "rsi_14": 52.8, "distance_52w_high": -6.56, "distance_52w_low": 36.71
  },
  {
    "symbol": "WIPRO", "nse_symbol": "WIPRO", "bse_code": "507685", "name": "Wipro Ltd",
    "sector": "Information Technology", "industry": "IT Services & Consulting",
    "about": "Wipro Limited is a leading technology services and consulting company focused on building innovative solutions that address clients' most complex digital transformation needs.",
    "website": "https://www.wipro.com",
    "current_price": 540.0, "change": 2.5, "change_pct": 0.47, "market_cap": 282500,
    "high_52w": 615.0, "low_52w": 440.0, "face_value": 2.0, "volume": 3800000,
    "pe_ratio": 24.2, "industry_pe": 28.5, "pb_ratio": 3.8, "peg_ratio": 3.2, "graham_number": 280.0,
    "ev_ebitda": 14.5, "price_to_sales": 3.1, "price_to_fcf": 21.0, "dividend_yield": 0.19, "book_value": 142.1,
    "roce": 18.5, "roe": 15.2, "opm": 17.8, "npm": 12.8,
    "sales_growth_3y": 8.5, "sales_growth_5y": 8.2, "sales_growth_10y": 6.8,
    "profit_growth_3y": 4.5, "profit_growth_5y": 5.2, "profit_growth_10y": 4.8,
    "price_cagr_1y": 14.2, "price_cagr_3y": -2.5, "price_cagr_5y": 18.5, "price_cagr_10y": 9.2,
    "roe_3y": 16.2, "roe_5y": 17.4, "roe_10y": 18.2,
    "debt": 14500.0, "debt_to_equity": 0.19, "interest_coverage": 18.0, "current_ratio": 2.1,
    "piotroski_score": 6, "altman_z_score": 6.2,
    "debtor_days": 65, "inventory_days": 0, "days_payable": 22, "working_capital_days": 43, "cash_conversion_cycle": 43,
    "cfo_latest": 12500, "cfo_3y": 36000, "cfo_5y": 58000, "fcf_latest": 10500, "fcf_3y": 31000, "fcf_5y": 49000, "fcf_yield": 3.71,
    "promoter_holding": 72.85, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 7.45, "change_in_fii_holding_quarter": -0.15,
    "dii_holding": 10.80, "change_in_dii_holding_quarter": 0.22, "public_holding": 8.90,
    "dma_50": 535.0, "dma_200": 520.0, "rsi_14": 51.5, "distance_52w_high": -12.20, "distance_52w_low": 22.73
  },
  {
    "symbol": "PERSISTENT", "nse_symbol": "PERSISTENT", "bse_code": "533218", "name": "Persistent Systems Ltd",
    "sector": "Information Technology", "industry": "Software & Consulting",
    "about": "Persistent Systems builds software that drives the business of our customers; enterprises and software product companies with software at the core of their digital transformation.",
    "website": "https://www.persistent.com",
    "current_price": 5450.0, "change": 65.0, "change_pct": 1.21, "market_cap": 84100,
    "high_52w": 6120.0, "low_52w": 3480.0, "face_value": 5.0, "volume": 680000,
    "pe_ratio": 64.5, "industry_pe": 28.5, "pb_ratio": 14.5, "peg_ratio": 2.8, "graham_number": 1250.0,
    "ev_ebitda": 39.8, "price_to_sales": 8.1, "price_to_fcf": 55.2, "dividend_yield": 0.85, "book_value": 375.8,
    "roce": 29.5, "roe": 26.2, "opm": 17.5, "npm": 11.8,
    "sales_growth_3y": 28.5, "sales_growth_5y": 23.4, "sales_growth_10y": 18.2,
    "profit_growth_3y": 26.8, "profit_growth_5y": 24.5, "profit_growth_10y": 17.4,
    "price_cagr_1y": 42.0, "price_cagr_3y": 38.5, "price_cagr_5y": 55.2, "price_cagr_10y": 32.5,
    "roe_3y": 25.8, "roe_5y": 21.4, "roe_10y": 18.5,
    "debt": 350.0, "debt_to_equity": 0.06, "interest_coverage": 32.0, "current_ratio": 2.4,
    "piotroski_score": 8, "altman_z_score": 9.8,
    "debtor_days": 58, "inventory_days": 0, "days_payable": 18, "working_capital_days": 40, "cash_conversion_cycle": 40,
    "cfo_latest": 1650, "cfo_3y": 4200, "cfo_5y": 6200, "fcf_latest": 1420, "fcf_3y": 3650, "fcf_5y": 5400, "fcf_yield": 1.69,
    "promoter_holding": 30.82, "change_in_promoter_holding_quarter": -0.10, "pledged_percentage": 0.0,
    "fii_holding": 24.80, "change_in_fii_holding_quarter": 1.15,
    "dii_holding": 27.40, "change_in_dii_holding_quarter": -0.65, "public_holding": 16.98,
    "dma_50": 5520.0, "dma_200": 4980.0, "rsi_14": 56.4, "distance_52w_high": -10.95, "distance_52w_low": 56.61
  },
  {
    "symbol": "KPITTECH", "nse_symbol": "KPITTECH", "bse_code": "542651", "name": "KPIT Technologies Ltd",
    "sector": "Information Technology", "industry": "Automotive Software & ER&D",
    "about": "KPIT Technologies is an Indian multinational corporation that provides software solutions to automotive software companies with focus on Autonomous Driving, Connected Vehicles and EV powertrains.",
    "website": "https://www.kpit.com",
    "current_price": 1480.0, "change": 22.0, "change_pct": 1.51, "market_cap": 40500,
    "high_52w": 1928.0, "low_52w": 1320.0, "face_value": 10.0, "volume": 1250000,
    "pe_ratio": 54.2, "industry_pe": 28.5, "pb_ratio": 15.8, "peg_ratio": 1.5, "graham_number": 320.0,
    "ev_ebitda": 32.8, "price_to_sales": 7.4, "price_to_fcf": 45.0, "dividend_yield": 0.45, "book_value": 93.6,
    "roce": 34.2, "roe": 30.5, "opm": 20.8, "npm": 14.2,
    "sales_growth_3y": 38.5, "sales_growth_5y": 28.4, "sales_growth_10y": 22.5,
    "profit_growth_3y": 45.2, "profit_growth_5y": 34.8, "profit_growth_10y": 26.5,
    "price_cagr_1y": 4.5, "price_cagr_3y": 55.4, "price_cagr_5y": 88.5, "price_cagr_10y": 42.8,
    "roe_3y": 28.5, "roe_5y": 22.8, "roe_10y": 19.5,
    "debt": 180.0, "debt_to_equity": 0.07, "interest_coverage": 38.0, "current_ratio": 2.5,
    "piotroski_score": 8, "altman_z_score": 10.5,
    "debtor_days": 60, "inventory_days": 0, "days_payable": 22, "working_capital_days": 38, "cash_conversion_cycle": 38,
    "cfo_latest": 950, "cfo_3y": 2400, "cfo_5y": 3500, "fcf_latest": 810, "fcf_3y": 2050, "fcf_5y": 2980, "fcf_yield": 2.00,
    "promoter_holding": 39.45, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 24.15, "change_in_fii_holding_quarter": 0.85,
    "dii_holding": 14.50, "change_in_dii_holding_quarter": -0.25, "public_holding": 21.90,
    "dma_50": 1510.0, "dma_200": 1620.0, "rsi_14": 46.8, "distance_52w_high": -23.24, "distance_52w_low": 12.12
  },

  # Banking & Financial Services
  {
    "symbol": "HDFCBANK", "nse_symbol": "HDFCBANK", "bse_code": "500180", "name": "HDFC Bank Ltd",
    "sector": "Financial Services", "industry": "Private Banking",
    "about": "HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai. It is India's largest private sector bank by assets and market capitalization.",
    "website": "https://www.hdfcbank.com",
    "current_price": 1740.0, "change": 8.2, "change_pct": 0.47, "market_cap": 1326000,
    "high_52w": 1880.0, "low_52w": 1363.0, "face_value": 1.0, "volume": 14500000,
    "pe_ratio": 18.9, "industry_pe": 16.5, "pb_ratio": 2.65, "peg_ratio": 1.1, "graham_number": 1480.0,
    "ev_ebitda": 14.2, "price_to_sales": 4.2, "price_to_fcf": 18.5, "dividend_yield": 1.12, "book_value": 656.4,
    "roce": 9.8, "roe": 15.8, "opm": 62.5, "npm": 24.5,
    "sales_growth_3y": 32.5, "sales_growth_5y": 24.2, "sales_growth_10y": 20.8,
    "profit_growth_3y": 22.4, "profit_growth_5y": 20.2, "profit_growth_10y": 19.8,
    "price_cagr_1y": 18.2, "price_cagr_3y": 4.5, "price_cagr_5y": 8.9, "price_cagr_10y": 14.2,
    "roe_3y": 16.4, "roe_5y": 16.8, "roe_10y": 17.5,
    "debt": 380000.0, "debt_to_equity": 0.85, "interest_coverage": 1.8, "current_ratio": 1.1,
    "piotroski_score": 7, "altman_z_score": 2.8,
    "debtor_days": 0, "inventory_days": 0, "days_payable": 0, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 68000, "cfo_3y": 185000, "cfo_5y": 290000, "fcf_latest": 64000, "fcf_3y": 172000, "fcf_5y": 270000, "fcf_yield": 4.82,
    "promoter_holding": 0.0, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 48.20, "change_in_fii_holding_quarter": 1.85,
    "dii_holding": 34.60, "change_in_dii_holding_quarter": -0.80, "public_holding": 17.20,
    "dma_50": 1710.0, "dma_200": 1620.0, "rsi_14": 58.2, "distance_52w_high": -7.45, "distance_52w_low": 27.66
  },
  {
    "symbol": "ICICIBANK", "nse_symbol": "ICICIBANK", "bse_code": "532174", "name": "ICICI Bank Ltd",
    "sector": "Financial Services", "industry": "Private Banking",
    "about": "ICICI Bank Limited is an Indian multinational banking and financial services company headquartered in Mumbai, offering a wide range of banking products and financial services.",
    "website": "https://www.icicibank.com",
    "current_price": 1265.0, "change": 14.5, "change_pct": 1.16, "market_cap": 892000,
    "high_52w": 1340.0, "low_52w": 980.0, "face_value": 2.0, "volume": 12000000,
    "pe_ratio": 17.8, "industry_pe": 16.5, "pb_ratio": 3.1, "peg_ratio": 0.95, "graham_number": 950.0,
    "ev_ebitda": 13.8, "price_to_sales": 3.9, "price_to_fcf": 16.8, "dividend_yield": 0.85, "book_value": 408.2,
    "roce": 11.2, "roe": 18.5, "opm": 64.2, "npm": 26.8,
    "sales_growth_3y": 24.8, "sales_growth_5y": 18.5, "sales_growth_10y": 15.2,
    "profit_growth_3y": 38.5, "profit_growth_5y": 36.2, "profit_growth_10y": 21.5,
    "price_cagr_1y": 24.5, "price_cagr_3y": 18.2, "price_cagr_5y": 21.4, "price_cagr_10y": 18.5,
    "roe_3y": 17.8, "roe_5y": 15.4, "roe_10y": 13.2,
    "debt": 220000.0, "debt_to_equity": 0.88, "interest_coverage": 2.1, "current_ratio": 1.1,
    "piotroski_score": 8, "altman_z_score": 3.1,
    "debtor_days": 0, "inventory_days": 0, "days_payable": 0, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 52000, "cfo_3y": 145000, "cfo_5y": 220000, "fcf_latest": 49500, "fcf_3y": 138000, "fcf_5y": 210000, "fcf_yield": 5.55,
    "promoter_holding": 0.0, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 44.85, "change_in_fii_holding_quarter": 0.95,
    "dii_holding": 44.15, "change_in_dii_holding_quarter": -0.45, "public_holding": 11.00,
    "dma_50": 1245.0, "dma_200": 1180.0, "rsi_14": 62.4, "distance_52w_high": -5.60, "distance_52w_low": 29.08
  },
  {
    "symbol": "KOTAKBANK", "nse_symbol": "KOTAKBANK", "bse_code": "500247", "name": "Kotak Mahindra Bank Ltd",
    "sector": "Financial Services", "industry": "Private Banking",
    "about": "Kotak Mahindra Bank is an Indian banking and financial services company headquartered in Mumbai, offering banking products and financial services for corporate and retail customers.",
    "website": "https://www.kotak.com",
    "current_price": 1820.0, "change": 5.0, "change_pct": 0.28, "market_cap": 362000,
    "high_52w": 1925.0, "low_52w": 1540.0, "face_value": 5.0, "volume": 3200000,
    "pe_ratio": 19.8, "industry_pe": 16.5, "pb_ratio": 2.75, "peg_ratio": 1.2, "graham_number": 1520.0,
    "ev_ebitda": 15.2, "price_to_sales": 5.1, "price_to_fcf": 20.5, "dividend_yield": 0.11, "book_value": 661.8,
    "roce": 10.5, "roe": 14.8, "opm": 61.5, "npm": 28.5,
    "sales_growth_3y": 21.4, "sales_growth_5y": 16.8, "sales_growth_10y": 18.2,
    "profit_growth_3y": 24.2, "profit_growth_5y": 18.5, "profit_growth_10y": 19.5,
    "price_cagr_1y": 4.5, "price_cagr_3y": -1.2, "price_cagr_5y": 4.8, "price_cagr_10y": 13.5,
    "roe_3y": 14.5, "roe_5y": 13.8, "roe_10y": 14.2,
    "debt": 145000.0, "debt_to_equity": 1.10, "interest_coverage": 2.2, "current_ratio": 1.1,
    "piotroski_score": 7, "altman_z_score": 2.9,
    "debtor_days": 0, "inventory_days": 0, "days_payable": 0, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 22000, "cfo_3y": 61000, "cfo_5y": 94000, "fcf_latest": 20500, "fcf_3y": 57000, "fcf_5y": 88000, "fcf_yield": 5.66,
    "promoter_holding": 25.89, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 37.50, "change_in_fii_holding_quarter": -0.85,
    "dii_holding": 23.40, "change_in_dii_holding_quarter": 0.95, "public_holding": 13.21,
    "dma_50": 1780.0, "dma_200": 1765.0, "rsi_14": 54.2, "distance_52w_high": -5.45, "distance_52w_low": 18.18
  },
  {
    "symbol": "SBIN", "nse_symbol": "SBIN", "bse_code": "500112", "name": "State Bank of India",
    "sector": "Financial Services", "industry": "Public Sector Banking",
    "about": "State Bank of India is a Fortune 500 company and India's largest commercial bank with a 200 year heritage and 22,000+ branches.",
    "website": "https://sbi.co.in",
    "current_price": 780.0, "change": 6.5, "change_pct": 0.84, "market_cap": 696000,
    "high_52w": 912.0, "low_52w": 720.0, "face_value": 1.0, "volume": 18500000,
    "pe_ratio": 10.5, "industry_pe": 16.5, "pb_ratio": 1.65, "peg_ratio": 0.55, "graham_number": 840.0,
    "ev_ebitda": 9.2, "price_to_sales": 1.8, "price_to_fcf": 9.8, "dividend_yield": 1.76, "book_value": 472.8,
    "roce": 7.8, "roe": 17.2, "opm": 58.2, "npm": 16.5,
    "sales_growth_3y": 20.5, "sales_growth_5y": 14.5, "sales_growth_10y": 12.8,
    "profit_growth_3y": 42.5, "profit_growth_5y": 48.0, "profit_growth_10y": 24.5,
    "price_cagr_1y": 16.5, "price_cagr_3y": 18.4, "price_cagr_5y": 22.8, "price_cagr_10y": 12.4,
    "roe_3y": 17.5, "roe_5y": 14.2, "roe_10y": 10.8,
    "debt": 450000.0, "debt_to_equity": 1.05, "interest_coverage": 1.9, "current_ratio": 1.1,
    "piotroski_score": 7, "altman_z_score": 2.6,
    "debtor_days": 0, "inventory_days": 0, "days_payable": 0, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 62000, "cfo_3y": 168000, "cfo_5y": 250000, "fcf_latest": 58000, "fcf_3y": 155000, "fcf_5y": 235000, "fcf_yield": 8.33,
    "promoter_holding": 57.49, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 11.20, "change_in_fii_holding_quarter": -0.35,
    "dii_holding": 24.50, "change_in_dii_holding_quarter": 0.65, "public_holding": 6.81,
    "dma_50": 805.0, "dma_200": 825.0, "rsi_14": 44.8, "distance_52w_high": -14.47, "distance_52w_low": 8.33
  },
  {
    "symbol": "BAJFINANCE", "nse_symbol": "BAJFINANCE", "bse_code": "500034", "name": "Bajaj Finance Ltd",
    "sector": "Financial Services", "industry": "Non-Banking Financial Company (NBFC)",
    "about": "Bajaj Finance Limited is an Indian non-banking financial company focused on lending, asset management, wealth management and insurance.",
    "website": "https://www.bajajfinserv.in/finance",
    "current_price": 7180.0, "change": -45.0, "change_pct": -0.62, "market_cap": 444500,
    "high_52w": 8192.0, "low_52w": 6355.0, "face_value": 2.0, "volume": 1200000,
    "pe_ratio": 29.4, "industry_pe": 22.5, "pb_ratio": 5.2, "peg_ratio": 1.25, "graham_number": 4800.0,
    "ev_ebitda": 18.5, "price_to_sales": 7.8, "price_to_fcf": 28.5, "dividend_yield": 0.52, "book_value": 1380.5,
    "roce": 12.8, "roe": 22.4, "opm": 68.5, "npm": 28.5,
    "sales_growth_3y": 30.5, "sales_growth_5y": 24.8, "sales_growth_10y": 28.5,
    "profit_growth_3y": 32.2, "profit_growth_5y": 25.4, "profit_growth_10y": 29.8,
    "price_cagr_1y": 4.8, "price_cagr_3y": 3.2, "price_cagr_5y": 14.5, "price_cagr_10y": 32.4,
    "roe_3y": 22.8, "roe_5y": 20.5, "roe_10y": 21.2,
    "debt": 285000.0, "debt_to_equity": 3.32, "interest_coverage": 2.4, "current_ratio": 1.4,
    "piotroski_score": 7, "altman_z_score": 2.95,
    "debtor_days": 0, "inventory_days": 0, "days_payable": 0, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 18500, "cfo_3y": 48000, "cfo_5y": 72000, "fcf_latest": 16800, "fcf_3y": 44000, "fcf_5y": 66000, "fcf_yield": 3.78,
    "promoter_holding": 54.72, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 20.85, "change_in_fii_holding_quarter": -0.65,
    "dii_holding": 14.25, "change_in_dii_holding_quarter": 0.85, "public_holding": 10.18,
    "dma_50": 7050.0, "dma_200": 7120.0, "rsi_14": 52.1, "distance_52w_high": -12.35, "distance_52w_low": 12.98
  },
  {
    "symbol": "CHOLAFIN", "nse_symbol": "CHOLAFIN", "bse_code": "511243", "name": "Cholamandalam Investment and Finance Company Ltd",
    "sector": "Financial Services", "industry": "Vehicle & Home Loans NBFC",
    "about": "Cholamandalam Investment and Finance Company Limited (Chola), incorporated in 1978 as the financial services arm of the Murugappa Group.",
    "website": "https://www.cholamandalam.com",
    "current_price": 1420.0, "change": 18.5, "change_pct": 1.32, "market_cap": 119800,
    "high_52w": 1635.0, "low_52w": 1120.0, "face_value": 2.0, "volume": 1800000,
    "pe_ratio": 32.5, "industry_pe": 22.5, "pb_ratio": 5.8, "peg_ratio": 1.15, "graham_number": 880.0,
    "ev_ebitda": 21.0, "price_to_sales": 6.8, "price_to_fcf": 30.2, "dividend_yield": 0.18, "book_value": 244.8,
    "roce": 11.5, "roe": 20.2, "opm": 62.8, "npm": 22.4,
    "sales_growth_3y": 34.5, "sales_growth_5y": 28.2, "sales_growth_10y": 24.8,
    "profit_growth_3y": 36.8, "profit_growth_5y": 29.5, "profit_growth_10y": 28.2,
    "price_cagr_1y": 24.5, "price_cagr_3y": 36.8, "price_cagr_5y": 42.5, "price_cagr_10y": 28.4,
    "roe_3y": 19.8, "roe_5y": 18.5, "roe_10y": 17.8,
    "debt": 118000.0, "debt_to_equity": 5.75, "interest_coverage": 2.1, "current_ratio": 1.3,
    "piotroski_score": 7, "altman_z_score": 2.8,
    "debtor_days": 0, "inventory_days": 0, "days_payable": 0, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 6200, "cfo_3y": 15500, "cfo_5y": 22500, "fcf_latest": 5600, "fcf_3y": 14000, "fcf_5y": 20500, "fcf_yield": 4.67,
    "promoter_holding": 50.36, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 26.85, "change_in_fii_holding_quarter": 1.25,
    "dii_holding": 14.80, "change_in_dii_holding_quarter": -0.65, "public_holding": 7.99,
    "dma_50": 1390.0, "dma_200": 1410.0, "rsi_14": 56.8, "distance_52w_high": -13.15, "distance_52w_low": 26.79
  },

  # FMCG & Consumer
  {
    "symbol": "ITC", "nse_symbol": "ITC", "bse_code": "500875", "name": "ITC Ltd",
    "sector": "FMCG", "industry": "Tobacco & Diversified FMCG",
    "about": "ITC Limited is an Indian conglomerate company headquartered in Kolkata. ITC has a presence in FMCG, Hotels, Packaging, Paperboards & Specialty Papers and Agri-Business.",
    "website": "https://www.itcportal.com",
    "current_price": 465.0, "change": 3.5, "change_pct": 0.76, "market_cap": 582000,
    "high_52w": 528.0, "low_52w": 399.0, "face_value": 1.0, "volume": 8500000,
    "pe_ratio": 28.2, "industry_pe": 42.0, "pb_ratio": 7.9, "peg_ratio": 2.6, "graham_number": 235.0,
    "ev_ebitda": 20.1, "price_to_sales": 7.5, "price_to_fcf": 27.5, "dividend_yield": 2.95, "book_value": 58.8,
    "roce": 37.8, "roe": 29.5, "opm": 37.2, "npm": 26.8,
    "sales_growth_3y": 14.2, "sales_growth_5y": 10.5, "sales_growth_10y": 8.5,
    "profit_growth_3y": 15.2, "profit_growth_5y": 11.2, "profit_growth_10y": 9.2,
    "price_cagr_1y": 8.5, "price_cagr_3y": 28.4, "price_cagr_5y": 16.8, "price_cagr_10y": 8.2,
    "roe_3y": 28.5, "roe_5y": 26.2, "roe_10y": 24.8,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 350.0, "current_ratio": 3.1,
    "piotroski_score": 8, "altman_z_score": 12.4,
    "debtor_days": 18, "inventory_days": 65, "days_payable": 28, "working_capital_days": 55, "cash_conversion_cycle": 55,
    "cfo_latest": 19500, "cfo_3y": 52000, "cfo_5y": 82000, "fcf_latest": 17200, "fcf_3y": 46500, "fcf_5y": 74000, "fcf_yield": 2.95,
    "promoter_holding": 0.0, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 42.10, "change_in_fii_holding_quarter": -0.35,
    "dii_holding": 42.80, "change_in_dii_holding_quarter": 0.45, "public_holding": 15.10,
    "dma_50": 472.0, "dma_200": 460.0, "rsi_14": 48.5, "distance_52w_high": -11.93, "distance_52w_low": 16.54
  },
  {
    "symbol": "HINDUNILVR", "nse_symbol": "HINDUNILVR", "bse_code": "500696", "name": "Hindustan Unilever Ltd",
    "sector": "FMCG", "industry": "Personal & Household Products",
    "about": "Hindustan Unilever Limited is India's largest consumer goods company, producing home and personal care products, food and beverages.",
    "website": "https://www.hul.co.in",
    "current_price": 2340.0, "change": -8.5, "change_pct": -0.36, "market_cap": 549800,
    "high_52w": 3035.0, "low_52w": 2170.0, "face_value": 1.0, "volume": 1600000,
    "pe_ratio": 52.8, "industry_pe": 48.0, "pb_ratio": 10.8, "peg_ratio": 5.8, "graham_number": 820.0,
    "ev_ebitda": 36.5, "price_to_sales": 8.8, "price_to_fcf": 48.2, "dividend_yield": 1.80, "book_value": 216.5,
    "roce": 25.8, "roe": 20.4, "opm": 23.5, "npm": 16.8,
    "sales_growth_3y": 10.2, "sales_growth_5y": 9.8, "sales_growth_10y": 8.4,
    "profit_growth_3y": 7.8, "profit_growth_5y": 8.5, "profit_growth_10y": 9.8,
    "price_cagr_1y": -12.5, "price_cagr_3y": -1.8, "price_cagr_5y": 4.5, "price_cagr_10y": 12.8,
    "roe_3y": 20.2, "roe_5y": 22.8, "roe_10y": 32.5,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 80.0, "current_ratio": 1.4,
    "piotroski_score": 6, "altman_z_score": 8.4,
    "debtor_days": 16, "inventory_days": 35, "days_payable": 65, "working_capital_days": -14, "cash_conversion_cycle": -14,
    "cfo_latest": 10800, "cfo_3y": 31000, "cfo_5y": 49000, "fcf_latest": 9600, "fcf_3y": 27500, "fcf_5y": 43500, "fcf_yield": 1.75,
    "promoter_holding": 61.90, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 12.85, "change_in_fii_holding_quarter": -0.80,
    "dii_holding": 13.95, "change_in_dii_holding_quarter": 0.72, "public_holding": 11.30,
    "dma_50": 2420.0, "dma_200": 2580.0, "rsi_14": 41.2, "distance_52w_high": -22.90, "distance_52w_low": 7.83
  },
  {
    "symbol": "VBL", "nse_symbol": "VBL", "bse_code": "540180", "name": "Varun Beverages Ltd",
    "sector": "FMCG", "industry": "Beverages (Pepsi Bottler)",
    "about": "Varun Beverages Limited is an Indian company that manufactures, bottles and distributes beverages. It is the second largest bottling company of PepsiCo in the world outside the United States.",
    "website": "https://www.varunbeverages.com",
    "current_price": 625.0, "change": 14.2, "change_pct": 2.32, "market_cap": 203000,
    "high_52w": 682.0, "low_52w": 420.0, "face_value": 2.0, "volume": 5200000,
    "pe_ratio": 84.5, "industry_pe": 48.0, "pb_ratio": 24.5, "peg_ratio": 2.4, "graham_number": 180.0,
    "ev_ebitda": 44.5, "price_to_sales": 11.5, "price_to_fcf": 78.0, "dividend_yield": 0.35, "book_value": 25.5,
    "roce": 31.5, "roe": 34.8, "opm": 24.5, "npm": 14.8,
    "sales_growth_3y": 36.8, "sales_growth_5y": 29.5, "sales_growth_10y": 24.2,
    "profit_growth_3y": 48.5, "profit_growth_5y": 42.0, "profit_growth_10y": 38.5,
    "price_cagr_1y": 44.5, "price_cagr_3y": 68.5, "price_cagr_5y": 62.4, "price_cagr_10y": 48.2,
    "roe_3y": 32.5, "roe_5y": 26.8, "roe_10y": 21.5,
    "debt": 4800.0, "debt_to_equity": 0.58, "interest_coverage": 14.5, "current_ratio": 1.2,
    "piotroski_score": 8, "altman_z_score": 7.8,
    "debtor_days": 15, "inventory_days": 42, "days_payable": 52, "working_capital_days": 5, "cash_conversion_cycle": 5,
    "cfo_latest": 3600, "cfo_3y": 9200, "cfo_5y": 13800, "fcf_latest": 2100, "fcf_3y": 5400, "fcf_5y": 8200, "fcf_yield": 1.03,
    "promoter_holding": 62.66, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 25.40, "change_in_fii_holding_quarter": 0.95,
    "dii_holding": 5.80, "change_in_dii_holding_quarter": -0.45, "public_holding": 6.14,
    "dma_50": 605.0, "dma_200": 575.0, "rsi_14": 64.5, "distance_52w_high": -8.36, "distance_52w_low": 48.81
  },
  {
    "symbol": "TITAN", "nse_symbol": "TITAN", "bse_code": "500114", "name": "Titan Company Ltd",
    "sector": "Consumer Discretionary", "industry": "Gems, Jewellery & Watches",
    "about": "Titan Company Limited is an Indian luxury goods company that mainly manufactures fashion accessories such as jewellery, watches and eyewear. Part of the Tata Group.",
    "website": "https://www.titancompany.in",
    "current_price": 3450.0, "change": 42.0, "change_pct": 1.23, "market_cap": 306200,
    "high_52w": 3886.0, "low_52w": 3055.0, "face_value": 1.0, "volume": 890000,
    "pe_ratio": 88.5, "industry_pe": 45.0, "pb_ratio": 24.8, "peg_ratio": 3.8, "graham_number": 850.0,
    "ev_ebitda": 52.0, "price_to_sales": 6.2, "price_to_fcf": 85.0, "dividend_yield": 0.32, "book_value": 139.2,
    "roce": 32.5, "roe": 30.8, "opm": 10.2, "npm": 6.9,
    "sales_growth_3y": 32.5, "sales_growth_5y": 24.2, "sales_growth_10y": 18.5,
    "profit_growth_3y": 34.8, "profit_growth_5y": 21.5, "profit_growth_10y": 17.8,
    "price_cagr_1y": 8.5, "price_cagr_3y": 14.8, "price_cagr_5y": 25.2, "price_cagr_10y": 26.5,
    "roe_3y": 30.2, "roe_5y": 26.5, "roe_10y": 24.8,
    "debt": 11500.0, "debt_to_equity": 0.93, "interest_coverage": 8.5, "current_ratio": 1.6,
    "piotroski_score": 7, "altman_z_score": 7.8,
    "debtor_days": 8, "inventory_days": 145, "days_payable": 24, "working_capital_days": 129, "cash_conversion_cycle": 129,
    "cfo_latest": 3400, "cfo_3y": 8500, "cfo_5y": 14200, "fcf_latest": 2600, "fcf_3y": 6800, "fcf_5y": 11500, "fcf_yield": 0.85,
    "promoter_holding": 52.90, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 18.25, "change_in_fii_holding_quarter": -0.45,
    "dii_holding": 11.15, "change_in_dii_holding_quarter": 0.35, "public_holding": 17.70,
    "dma_50": 3380.0, "dma_200": 3440.0, "rsi_14": 54.2, "distance_52w_high": -11.22, "distance_52w_low": 12.93
  },
  {
    "symbol": "TRENT", "nse_symbol": "TRENT", "bse_code": "500251", "name": "Trent Ltd",
    "sector": "Consumer Discretionary", "industry": "Apparel Retail (Westside, Zudio)",
    "about": "Trent Limited is an Indian retail company, which is part of the Tata Group. It operates Westside, Zudio, Star Bazaar, Landmark and Booker Wholesale stores.",
    "website": "https://www.trentlimited.com",
    "current_price": 6850.0, "change": 145.0, "change_pct": 2.16, "market_cap": 243500,
    "high_52w": 8345.0, "low_52w": 3820.0, "face_value": 1.0, "volume": 1450000,
    "pe_ratio": 142.0, "industry_pe": 45.0, "pb_ratio": 48.5, "peg_ratio": 1.8, "graham_number": 1200.0,
    "ev_ebitda": 78.5, "price_to_sales": 18.5, "price_to_fcf": 120.0, "dividend_yield": 0.05, "book_value": 141.2,
    "roce": 35.8, "roe": 38.5, "opm": 15.8, "npm": 11.8,
    "sales_growth_3y": 62.5, "sales_growth_5y": 42.8, "sales_growth_10y": 28.5,
    "profit_growth_3y": 112.5, "profit_growth_5y": 74.2, "profit_growth_10y": 45.0,
    "price_cagr_1y": 76.5, "price_cagr_3y": 82.4, "price_cagr_5y": 68.5, "price_cagr_10y": 44.2,
    "roe_3y": 32.5, "roe_5y": 22.4, "roe_10y": 16.5,
    "debt": 580.0, "debt_to_equity": 0.12, "interest_coverage": 18.5, "current_ratio": 1.5,
    "piotroski_score": 8, "altman_z_score": 9.2,
    "debtor_days": 4, "inventory_days": 48, "days_payable": 36, "working_capital_days": 16, "cash_conversion_cycle": 16,
    "cfo_latest": 2200, "cfo_3y": 4800, "cfo_5y": 6800, "fcf_latest": 1450, "fcf_3y": 3200, "fcf_5y": 4600, "fcf_yield": 0.60,
    "promoter_holding": 37.01, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 28.45, "change_in_fii_holding_quarter": 1.45,
    "dii_holding": 16.20, "change_in_dii_holding_quarter": -0.65, "public_holding": 18.34,
    "dma_50": 6720.0, "dma_200": 6150.0, "rsi_14": 57.8, "distance_52w_high": -17.91, "distance_52w_low": 79.32
  },
  {
    "symbol": "DMART", "nse_symbol": "DMART", "bse_code": "540376", "name": "Avenue Supermarts Ltd (DMart)",
    "sector": "Consumer Discretionary", "industry": "Hypermarkets & Supermarkets",
    "about": "Avenue Supermarts Limited is an Indian retail corporation that operates a chain of hypermarkets in India known as DMart. Founded by Radhakishan Damani.",
    "website": "https://www.dmartindia.com",
    "current_price": 3820.0, "change": 12.0, "change_pct": 0.31, "market_cap": 248500,
    "high_52w": 5484.0, "low_52w": 3650.0, "face_value": 10.0, "volume": 780000,
    "pe_ratio": 92.5, "industry_pe": 45.0, "pb_ratio": 12.8, "peg_ratio": 4.8, "graham_number": 1150.0,
    "ev_ebitda": 56.5, "price_to_sales": 4.8, "price_to_fcf": 85.0, "dividend_yield": 0.0, "book_value": 298.5,
    "roce": 18.2, "roe": 14.8, "opm": 8.4, "npm": 5.2,
    "sales_growth_3y": 28.5, "sales_growth_5y": 20.8, "sales_growth_10y": 24.5,
    "profit_growth_3y": 22.4, "profit_growth_5y": 18.5, "profit_growth_10y": 26.5,
    "price_cagr_1y": -2.5, "price_cagr_3y": -3.2, "price_cagr_5y": 14.5, "price_cagr_10y": 24.8,
    "roe_3y": 15.2, "roe_5y": 14.5, "roe_10y": 16.5,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 45.0, "current_ratio": 3.8,
    "piotroski_score": 7, "altman_z_score": 12.5,
    "debtor_days": 2, "inventory_days": 32, "days_payable": 8, "working_capital_days": 26, "cash_conversion_cycle": 26,
    "cfo_latest": 3100, "cfo_3y": 8200, "cfo_5y": 12400, "fcf_latest": 1200, "fcf_3y": 3100, "fcf_5y": 4800, "fcf_yield": 0.48,
    "promoter_holding": 74.65, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 7.45, "change_in_fii_holding_quarter": -0.35,
    "dii_holding": 8.90, "change_in_dii_holding_quarter": 0.45, "public_holding": 9.00,
    "dma_50": 3950.0, "dma_200": 4480.0, "rsi_14": 42.1, "distance_52w_high": -30.34, "distance_52w_low": 4.66
  },

  # Pharma & Healthcare
  {
    "symbol": "SUNPHARMA", "nse_symbol": "SUNPHARMA", "bse_code": "524715", "name": "Sun Pharmaceutical Industries Ltd",
    "sector": "Healthcare", "industry": "Pharmaceuticals & Biotech",
    "about": "Sun Pharmaceutical Industries Limited is an Indian multinational pharmaceutical company headquartered in Mumbai, Maharashtra, that manufactures and sells pharmaceutical formulations and active pharmaceutical ingredients.",
    "website": "https://www.sunpharma.com",
    "current_price": 1810.0, "change": 18.2, "change_pct": 1.02, "market_cap": 434200,
    "high_52w": 1960.0, "low_52w": 1435.0, "face_value": 1.0, "volume": 1900000,
    "pe_ratio": 38.5, "industry_pe": 34.0, "pb_ratio": 6.4, "peg_ratio": 2.1, "graham_number": 880.0,
    "ev_ebitda": 26.5, "price_to_sales": 8.4, "price_to_fcf": 32.5, "dividend_yield": 0.75, "book_value": 282.8,
    "roce": 21.5, "roe": 17.8, "opm": 28.5, "npm": 20.2,
    "sales_growth_3y": 14.5, "sales_growth_5y": 11.8, "sales_growth_10y": 10.2,
    "profit_growth_3y": 24.2, "profit_growth_5y": 18.5, "profit_growth_10y": 12.8,
    "price_cagr_1y": 28.4, "price_cagr_3y": 24.5, "price_cagr_5y": 29.8, "price_cagr_10y": 8.5,
    "roe_3y": 16.8, "roe_5y": 14.5, "roe_10y": 12.2,
    "debt": 3200.0, "debt_to_equity": 0.05, "interest_coverage": 42.0, "current_ratio": 2.8,
    "piotroski_score": 8, "altman_z_score": 7.4,
    "debtor_days": 82, "inventory_days": 95, "days_payable": 45, "working_capital_days": 132, "cash_conversion_cycle": 132,
    "cfo_latest": 12500, "cfo_3y": 32000, "cfo_5y": 48000, "fcf_latest": 10200, "fcf_3y": 26500, "fcf_5y": 40500, "fcf_yield": 2.35,
    "promoter_holding": 54.48, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 1.2,
    "fii_holding": 18.10, "change_in_fii_holding_quarter": 0.42,
    "dii_holding": 18.90, "change_in_dii_holding_quarter": -0.22, "public_holding": 8.52,
    "dma_50": 1780.0, "dma_200": 1690.0, "rsi_14": 59.4, "distance_52w_high": -7.65, "distance_52w_low": 26.13
  },
  {
    "symbol": "CIPLA", "nse_symbol": "CIPLA", "bse_code": "500087", "name": "Cipla Ltd",
    "sector": "Healthcare", "industry": "Pharmaceuticals",
    "about": "Cipla Limited is an Indian multinational pharmaceutical and biotechnology company, headquartered in Mumbai. It primarily develops medicines to treat respiratory, cardiovascular disease, arthritis, diabetes, and other medical conditions.",
    "website": "https://www.cipla.com",
    "current_price": 1540.0, "change": 12.0, "change_pct": 0.78, "market_cap": 124300,
    "high_52w": 1702.0, "low_52w": 1318.0, "face_value": 2.0, "volume": 1200000,
    "pe_ratio": 26.8, "industry_pe": 34.0, "pb_ratio": 4.1, "peg_ratio": 1.35, "graham_number": 920.0,
    "ev_ebitda": 17.5, "price_to_sales": 4.6, "price_to_fcf": 24.2, "dividend_yield": 0.85, "book_value": 375.5,
    "roce": 24.8, "roe": 17.5, "opm": 25.8, "npm": 16.5,
    "sales_growth_3y": 11.2, "sales_growth_5y": 9.8, "sales_growth_10y": 9.5,
    "profit_growth_3y": 21.8, "profit_growth_5y": 19.4, "profit_growth_10y": 14.2,
    "price_cagr_1y": 14.8, "price_cagr_3y": 18.5, "price_cagr_5y": 22.4, "price_cagr_10y": 9.8,
    "roe_3y": 16.2, "roe_5y": 14.8, "roe_10y": 12.5,
    "debt": 650.0, "debt_to_equity": 0.02, "interest_coverage": 55.0, "current_ratio": 3.4,
    "piotroski_score": 8, "altman_z_score": 8.2,
    "debtor_days": 65, "inventory_days": 85, "days_payable": 35, "working_capital_days": 115, "cash_conversion_cycle": 115,
    "cfo_latest": 4800, "cfo_3y": 12800, "cfo_5y": 19500, "fcf_latest": 3950, "fcf_3y": 10500, "fcf_5y": 16200, "fcf_yield": 3.18,
    "promoter_holding": 33.47, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 27.20, "change_in_fii_holding_quarter": 0.65,
    "dii_holding": 24.15, "change_in_dii_holding_quarter": -0.45, "public_holding": 15.18,
    "dma_50": 1520.0, "dma_200": 1485.0, "rsi_14": 55.6, "distance_52w_high": -9.52, "distance_52w_low": 16.84
  },
  {
    "symbol": "DRREDDY", "nse_symbol": "DRREDDY", "bse_code": "500124", "name": "Dr. Reddy's Laboratories Ltd",
    "sector": "Healthcare", "industry": "Pharmaceuticals",
    "about": "Dr. Reddy's Laboratories is an Indian multinational pharmaceutical company based in Hyderabad, Telangana. It manufactures and markets a wide range of pharmaceuticals in India and overseas.",
    "website": "https://www.drreddys.com",
    "current_price": 1290.0, "change": -8.0, "change_pct": -0.62, "market_cap": 107500,
    "high_52w": 1410.0, "low_52w": 1130.0, "face_value": 5.0, "volume": 1500000,
    "pe_ratio": 19.5, "industry_pe": 34.0, "pb_ratio": 3.4, "peg_ratio": 1.1, "graham_number": 850.0,
    "ev_ebitda": 13.8, "price_to_sales": 3.8, "price_to_fcf": 18.5, "dividend_yield": 0.62, "book_value": 379.4,
    "roce": 25.4, "roe": 20.8, "opm": 29.2, "npm": 19.5,
    "sales_growth_3y": 14.8, "sales_growth_5y": 12.4, "sales_growth_10y": 9.2,
    "profit_growth_3y": 28.5, "profit_growth_5y": 24.2, "profit_growth_10y": 15.8,
    "price_cagr_1y": 12.4, "price_cagr_3y": 16.8, "price_cagr_5y": 18.5, "price_cagr_10y": 12.4,
    "roe_3y": 19.8, "roe_5y": 16.4, "roe_10y": 14.8,
    "debt": 1800.0, "debt_to_equity": 0.05, "interest_coverage": 48.0, "current_ratio": 2.6,
    "piotroski_score": 8, "altman_z_score": 6.8,
    "debtor_days": 74, "inventory_days": 82, "days_payable": 40, "working_capital_days": 116, "cash_conversion_cycle": 116,
    "cfo_latest": 6200, "cfo_3y": 16500, "cfo_5y": 24500, "fcf_latest": 4800, "fcf_3y": 13200, "fcf_5y": 19800, "fcf_yield": 4.47,
    "promoter_holding": 26.65, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 28.90, "change_in_fii_holding_quarter": 0.15,
    "dii_holding": 22.80, "change_in_dii_holding_quarter": -0.20, "public_holding": 21.65,
    "dma_50": 1285.0, "dma_200": 1260.0, "rsi_14": 52.4, "distance_52w_high": -8.51, "distance_52w_low": 14.16
  },
  {
    "symbol": "DIVISLAB", "nse_symbol": "DIVISLAB", "bse_code": "532488", "name": "Divi's Laboratories Ltd",
    "sector": "Healthcare", "industry": "API & Custom Synthesis",
    "about": "Divi's Laboratories Limited is an Indian multinational pharmaceutical company and producer of active pharmaceutical ingredients (APIs) and intermediates headquartered in Hyderabad.",
    "website": "https://www.divislabs.com",
    "current_price": 5850.0, "change": 110.0, "change_pct": 1.92, "market_cap": 155200,
    "high_52w": 6250.0, "low_52w": 3400.0, "face_value": 2.0, "volume": 480000,
    "pe_ratio": 82.5, "industry_pe": 34.0, "pb_ratio": 11.5, "peg_ratio": 3.8, "graham_number": 1450.0,
    "ev_ebitda": 52.5, "price_to_sales": 18.2, "price_to_fcf": 75.0, "dividend_yield": 0.51, "book_value": 508.7,
    "roce": 17.5, "roe": 13.8, "opm": 31.5, "npm": 22.5,
    "sales_growth_3y": 8.5, "sales_growth_5y": 14.2, "sales_growth_10y": 14.8,
    "profit_growth_3y": 6.8, "profit_growth_5y": 15.5, "profit_growth_10y": 14.2,
    "price_cagr_1y": 62.5, "price_cagr_3y": 14.8, "price_cagr_5y": 28.5, "price_cagr_10y": 24.5,
    "roe_3y": 16.5, "roe_5y": 18.2, "roe_10y": 19.8,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 150.0, "current_ratio": 6.5,
    "piotroski_score": 8, "altman_z_score": 14.5,
    "debtor_days": 88, "inventory_days": 165, "days_payable": 35, "working_capital_days": 218, "cash_conversion_cycle": 218,
    "cfo_latest": 2400, "cfo_3y": 6800, "cfo_5y": 10500, "fcf_latest": 1600, "fcf_3y": 4500, "fcf_5y": 7200, "fcf_yield": 1.03,
    "promoter_holding": 51.90, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 16.50, "change_in_fii_holding_quarter": 0.75,
    "dii_holding": 21.80, "change_in_dii_holding_quarter": -0.45, "public_holding": 9.80,
    "dma_50": 5720.0, "dma_200": 5050.0, "rsi_14": 62.1, "distance_52w_high": -6.40, "distance_52w_low": 72.06
  },

  # Energy, Oil & Power
  {
    "symbol": "RELIANCE", "nse_symbol": "RELIANCE", "bse_code": "500325", "name": "Reliance Industries Ltd",
    "sector": "Energy", "industry": "Oil, Gas & Petrochemicals / Telecom & Retail",
    "about": "Reliance Industries Limited is an Indian multinational conglomerate headquartered in Mumbai. Its diverse businesses include energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.",
    "website": "https://www.ril.com",
    "current_price": 1270.0, "change": 15.4, "change_pct": 1.23, "market_cap": 1718000,
    "high_52w": 1608.0, "low_52w": 1215.0, "face_value": 10.0, "volume": 11200000,
    "pe_ratio": 24.5, "industry_pe": 16.0, "pb_ratio": 2.1, "peg_ratio": 2.5, "graham_number": 1180.0,
    "ev_ebitda": 13.8, "price_to_sales": 1.8, "price_to_fcf": 28.0, "dividend_yield": 0.39, "book_value": 605.0,
    "roce": 10.4, "roe": 9.8, "opm": 17.5, "npm": 7.8,
    "sales_growth_3y": 18.5, "sales_growth_5y": 14.2, "sales_growth_10y": 11.5,
    "profit_growth_3y": 10.2, "profit_growth_5y": 11.8, "profit_growth_10y": 11.9,
    "price_cagr_1y": -8.5, "price_cagr_3y": 8.4, "price_cagr_5y": 12.8, "price_cagr_10y": 17.5,
    "roe_3y": 9.5, "roe_5y": 9.2, "roe_10y": 10.5,
    "debt": 315000.0, "debt_to_equity": 0.38, "interest_coverage": 7.5, "current_ratio": 1.2,
    "piotroski_score": 6, "altman_z_score": 2.85,
    "debtor_days": 18, "inventory_days": 42, "days_payable": 68, "working_capital_days": -8, "cash_conversion_cycle": -8,
    "cfo_latest": 145000, "cfo_3y": 395000, "cfo_5y": 580000, "fcf_latest": 48000, "fcf_3y": 120000, "fcf_5y": 180000, "fcf_yield": 2.79,
    "promoter_holding": 50.30, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 21.60, "change_in_fii_holding_quarter": -0.85,
    "dii_holding": 17.40, "change_in_dii_holding_quarter": 0.95, "public_holding": 10.70,
    "dma_50": 1260.0, "dma_200": 1380.0, "rsi_14": 49.8, "distance_52w_high": -21.02, "distance_52w_low": 4.53
  },
  {
    "symbol": "NTPC", "nse_symbol": "NTPC", "bse_code": "532555", "name": "NTPC Ltd",
    "sector": "Utilities", "industry": "Power Generation",
    "about": "NTPC Limited is an Indian central Public Sector Undertaking under the ownership of the Ministry of Power, Government of India, engaged in the generation of electricity and allied activities.",
    "website": "https://www.ntpc.co.in",
    "current_price": 385.0, "change": 4.2, "change_pct": 1.10, "market_cap": 373500,
    "high_52w": 448.0, "low_52w": 305.0, "face_value": 10.0, "volume": 9500000,
    "pe_ratio": 17.5, "industry_pe": 18.0, "pb_ratio": 2.2, "peg_ratio": 1.4, "graham_number": 320.0,
    "ev_ebitda": 9.5, "price_to_sales": 2.1, "price_to_fcf": 14.2, "dividend_yield": 2.15, "book_value": 175.0,
    "roce": 11.5, "roe": 13.2, "opm": 29.5, "npm": 12.5,
    "sales_growth_3y": 18.5, "sales_growth_5y": 14.8, "sales_growth_10y": 9.8,
    "profit_growth_3y": 14.5, "profit_growth_5y": 12.8, "profit_growth_10y": 8.5,
    "price_cagr_1y": 32.5, "price_cagr_3y": 42.8, "price_cagr_5y": 28.5, "price_cagr_10y": 14.2,
    "roe_3y": 12.8, "roe_5y": 12.2, "roe_10y": 11.5,
    "debt": 220000.0, "debt_to_equity": 1.25, "interest_coverage": 4.2, "current_ratio": 1.1,
    "piotroski_score": 7, "altman_z_score": 2.45,
    "debtor_days": 45, "inventory_days": 25, "days_payable": 35, "working_capital_days": 35, "cash_conversion_cycle": 35,
    "cfo_latest": 36000, "cfo_3y": 98000, "cfo_5y": 155000, "fcf_latest": 12500, "fcf_3y": 34000, "fcf_5y": 52000, "fcf_yield": 3.35,
    "promoter_holding": 51.10, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 17.50, "change_in_fii_holding_quarter": 0.45,
    "dii_holding": 27.20, "change_in_dii_holding_quarter": -0.35, "public_holding": 4.20,
    "dma_50": 378.0, "dma_200": 392.0, "rsi_14": 53.2, "distance_52w_high": -14.06, "distance_52w_low": 26.23
  },
  {
    "symbol": "TATAPOWER", "nse_symbol": "TATAPOWER", "bse_code": "500400", "name": "Tata Power Company Ltd",
    "sector": "Utilities", "industry": "Integrated Power & Renewable Energy",
    "about": "Tata Power Company Limited is an Indian electric utility and electricity generation company based in Mumbai, Maharashtra, India and is part of the Tata Group.",
    "website": "https://www.tatapower.com",
    "current_price": 415.0, "change": 8.5, "change_pct": 2.09, "market_cap": 132600,
    "high_52w": 495.0, "low_52w": 348.0, "face_value": 1.0, "volume": 7800000,
    "pe_ratio": 32.8, "industry_pe": 18.0, "pb_ratio": 4.1, "peg_ratio": 1.6, "graham_number": 210.0,
    "ev_ebitda": 14.8, "price_to_sales": 2.1, "price_to_fcf": 28.5, "dividend_yield": 0.48, "book_value": 101.2,
    "roce": 12.8, "roe": 14.5, "opm": 18.5, "npm": 6.8,
    "sales_growth_3y": 22.5, "sales_growth_5y": 18.4, "sales_growth_10y": 10.5,
    "profit_growth_3y": 38.5, "profit_growth_5y": 28.5, "profit_growth_10y": 22.0,
    "price_cagr_1y": 28.5, "price_cagr_3y": 32.5, "price_cagr_5y": 54.2, "price_cagr_10y": 18.5,
    "roe_3y": 13.8, "roe_5y": 11.2, "roe_10y": 8.5,
    "debt": 48000.0, "debt_to_equity": 1.48, "interest_coverage": 2.8, "current_ratio": 0.85,
    "piotroski_score": 7, "altman_z_score": 2.35,
    "debtor_days": 52, "inventory_days": 18, "days_payable": 65, "working_capital_days": 5, "cash_conversion_cycle": 5,
    "cfo_latest": 9200, "cfo_3y": 24000, "cfo_5y": 36000, "fcf_latest": 2800, "fcf_3y": 7400, "fcf_5y": 11500, "fcf_yield": 2.11,
    "promoter_holding": 46.86, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 10.45, "change_in_fii_holding_quarter": 0.45,
    "dii_holding": 16.80, "change_in_dii_holding_quarter": -0.25, "public_holding": 25.89,
    "dma_50": 420.0, "dma_200": 435.0, "rsi_14": 52.8, "distance_52w_high": -16.16, "distance_52w_low": 19.25
  },

  # Capital Goods & Defense
  {
    "symbol": "LT", "nse_symbol": "LT", "bse_code": "500510", "name": "Larsen & Toubro Ltd",
    "sector": "Industrials", "industry": "Engineering & Infrastructure Construction",
    "about": "Larsen & Toubro is an Indian multinational conglomerate engaged in EPC Projects, Hi-Tech Manufacturing and Services with operations across several global geographies.",
    "website": "https://www.larsentoubro.com",
    "current_price": 3520.0, "change": 38.0, "change_pct": 1.09, "market_cap": 484000,
    "high_52w": 3948.0, "low_52w": 3175.0, "face_value": 2.0, "volume": 2100000,
    "pe_ratio": 36.8, "industry_pe": 38.0, "pb_ratio": 5.1, "peg_ratio": 2.2, "graham_number": 1650.0,
    "ev_ebitda": 22.4, "price_to_sales": 2.1, "price_to_fcf": 38.5, "dividend_yield": 0.96, "book_value": 690.2,
    "roce": 15.8, "roe": 14.5, "opm": 11.2, "npm": 5.8,
    "sales_growth_3y": 21.5, "sales_growth_5y": 14.2, "sales_growth_10y": 11.8,
    "profit_growth_3y": 18.4, "profit_growth_5y": 12.8, "profit_growth_10y": 12.2,
    "price_cagr_1y": 8.5, "price_cagr_3y": 24.5, "price_cagr_5y": 21.8, "price_cagr_10y": 15.2,
    "roe_3y": 13.8, "roe_5y": 12.5, "roe_10y": 12.8,
    "debt": 115000.0, "debt_to_equity": 1.20, "interest_coverage": 4.8, "current_ratio": 1.3,
    "piotroski_score": 7, "altman_z_score": 3.25,
    "debtor_days": 110, "inventory_days": 25, "days_payable": 85, "working_capital_days": 50, "cash_conversion_cycle": 50,
    "cfo_latest": 22500, "cfo_3y": 58000, "cfo_5y": 88000, "fcf_latest": 14800, "fcf_3y": 38000, "fcf_5y": 58000, "fcf_yield": 3.06,
    "promoter_holding": 0.0, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 25.10, "change_in_fii_holding_quarter": -0.65,
    "dii_holding": 40.20, "change_in_dii_holding_quarter": 0.85, "public_holding": 34.70,
    "dma_50": 3480.0, "dma_200": 3560.0, "rsi_14": 52.4, "distance_52w_high": -10.84, "distance_52w_low": 10.87
  },
  {
    "symbol": "HAL", "nse_symbol": "HAL", "bse_code": "541154", "name": "Hindustan Aeronautics Ltd",
    "sector": "Industrials", "industry": "Defense & Aerospace",
    "about": "Hindustan Aeronautics Limited is an Indian public sector aerospace and defence company headquartered in Bengaluru, under the management of the Indian Ministry of Defence.",
    "website": "https://hal-india.co.in",
    "current_price": 4280.0, "change": 95.0, "change_pct": 2.27, "market_cap": 286200,
    "high_52w": 5675.0, "low_52w": 2850.0, "face_value": 5.0, "volume": 1800000,
    "pe_ratio": 37.5, "industry_pe": 45.0, "pb_ratio": 9.8, "peg_ratio": 1.45, "graham_number": 1450.0,
    "ev_ebitda": 25.4, "price_to_sales": 9.4, "price_to_fcf": 35.0, "dividend_yield": 0.82, "book_value": 436.7,
    "roce": 32.8, "roe": 28.5, "opm": 31.5, "npm": 25.2,
    "sales_growth_3y": 14.8, "sales_growth_5y": 10.5, "sales_growth_10y": 8.8,
    "profit_growth_3y": 28.5, "profit_growth_5y": 22.8, "profit_growth_10y": 16.5,
    "price_cagr_1y": 48.5, "price_cagr_3y": 74.2, "price_cagr_5y": 58.5, "price_cagr_10y": 36.5,
    "roe_3y": 26.5, "roe_5y": 23.4, "roe_10y": 21.2,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 180.0, "current_ratio": 2.1,
    "piotroski_score": 8, "altman_z_score": 6.8,
    "debtor_days": 85, "inventory_days": 180, "days_payable": 110, "working_capital_days": 155, "cash_conversion_cycle": 155,
    "cfo_latest": 9800, "cfo_3y": 24500, "cfo_5y": 36000, "fcf_latest": 8200, "fcf_3y": 20500, "fcf_5y": 30500, "fcf_yield": 2.87,
    "promoter_holding": 71.64, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 12.80, "change_in_fii_holding_quarter": 0.75,
    "dii_holding": 10.45, "change_in_dii_holding_quarter": -0.35, "public_holding": 5.11,
    "dma_50": 4180.0, "dma_200": 4450.0, "rsi_14": 55.2, "distance_52w_high": -24.58, "distance_52w_low": 50.18
  },
  {
    "symbol": "BEL", "nse_symbol": "BEL", "bse_code": "500049", "name": "Bharat Electronics Ltd",
    "sector": "Industrials", "industry": "Defense Electronics & Radar",
    "about": "Bharat Electronics Limited is an Indian state-owned aerospace and defence electronics company. It primarily manufactures advanced electronic products for ground and aerospace applications.",
    "website": "https://bel-india.in",
    "current_price": 288.0, "change": 5.2, "change_pct": 1.84, "market_cap": 210500,
    "high_52w": 340.0, "low_52w": 182.0, "face_value": 1.0, "volume": 12500000,
    "pe_ratio": 48.5, "industry_pe": 45.0, "pb_ratio": 12.5, "peg_ratio": 1.8, "graham_number": 88.0,
    "ev_ebitda": 34.2, "price_to_sales": 9.8, "price_to_fcf": 46.5, "dividend_yield": 0.85, "book_value": 23.0,
    "roce": 35.8, "roe": 26.5, "opm": 25.8, "npm": 19.8,
    "sales_growth_3y": 16.8, "sales_growth_5y": 14.2, "sales_growth_10y": 12.8,
    "profit_growth_3y": 28.5, "profit_growth_5y": 21.4, "profit_growth_10y": 18.2,
    "price_cagr_1y": 62.5, "price_cagr_3y": 68.5, "price_cagr_5y": 48.2, "price_cagr_10y": 32.5,
    "roe_3y": 24.8, "roe_5y": 22.5, "roe_10y": 20.8,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 220.0, "current_ratio": 1.8,
    "piotroski_score": 8, "altman_z_score": 8.5,
    "debtor_days": 115, "inventory_days": 140, "days_payable": 85, "working_capital_days": 170, "cash_conversion_cycle": 170,
    "cfo_latest": 5200, "cfo_3y": 13500, "cfo_5y": 20500, "fcf_latest": 4400, "fcf_3y": 11500, "fcf_5y": 17500, "fcf_yield": 2.09,
    "promoter_holding": 51.14, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 17.50, "change_in_fii_holding_quarter": 0.95,
    "dii_holding": 19.60, "change_in_dii_holding_quarter": -0.45, "public_holding": 11.76,
    "dma_50": 292.0, "dma_200": 298.0, "rsi_14": 52.4, "distance_52w_high": -15.29, "distance_52w_low": 58.24
  },
  {
    "symbol": "POLYCAB", "nse_symbol": "POLYCAB", "bse_code": "542652", "name": "Polycab India Ltd",
    "sector": "Industrials", "industry": "Cables & Electrical Goods",
    "about": "Polycab India is India's leading manufacturer of cables and wires and fast-growing player in fast moving electrical goods (FMEG).",
    "website": "https://polycab.com",
    "current_price": 6250.0, "change": 85.0, "change_pct": 1.38, "market_cap": 94100,
    "high_52w": 7605.0, "low_52w": 4650.0, "face_value": 10.0, "volume": 420000,
    "pe_ratio": 49.5, "industry_pe": 45.0, "pb_ratio": 10.5, "peg_ratio": 1.6, "graham_number": 1820.0,
    "ev_ebitda": 32.5, "price_to_sales": 5.2, "price_to_fcf": 52.0, "dividend_yield": 0.48, "book_value": 595.2,
    "roce": 28.5, "roe": 23.4, "opm": 13.5, "npm": 9.8,
    "sales_growth_3y": 28.4, "sales_growth_5y": 20.5, "sales_growth_10y": 17.5,
    "profit_growth_3y": 32.5, "profit_growth_5y": 26.8, "profit_growth_10y": 28.5,
    "price_cagr_1y": 22.5, "price_cagr_3y": 44.8, "price_cagr_5y": 52.4, "price_cagr_10y": 38.5,
    "roe_3y": 22.5, "roe_5y": 20.2, "roe_10y": 18.5,
    "debt": 150.0, "debt_to_equity": 0.02, "interest_coverage": 45.0, "current_ratio": 2.8,
    "piotroski_score": 8, "altman_z_score": 9.5,
    "debtor_days": 42, "inventory_days": 68, "days_payable": 40, "working_capital_days": 70, "cash_conversion_cycle": 70,
    "cfo_latest": 2250, "cfo_3y": 5400, "cfo_5y": 8100, "fcf_latest": 1650, "fcf_3y": 3950, "fcf_5y": 5900, "fcf_yield": 1.75,
    "promoter_holding": 63.06, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 14.25, "change_in_fii_holding_quarter": 0.85,
    "dii_holding": 10.95, "change_in_dii_holding_quarter": -0.45, "public_holding": 11.74,
    "dma_50": 6120.0, "dma_200": 6380.0, "rsi_14": 54.8, "distance_52w_high": -17.82, "distance_52w_low": 34.41
  },

  # Chemicals & Materials
  {
    "symbol": "PIDILITIND", "nse_symbol": "PIDILITIND", "bse_code": "500331", "name": "Pidilite Industries Ltd",
    "sector": "Materials", "industry": "Specialty Chemicals & Adhesives (Fevicol)",
    "about": "Pidilite Industries Limited is an Indian adhesives manufacturing company. It also manufactures art materials, construction chemicals, and other industrial specialty chemicals.",
    "website": "https://www.pidilite.com",
    "current_price": 3050.0, "change": 18.0, "change_pct": 0.59, "market_cap": 155200,
    "high_52w": 3345.0, "low_52w": 2680.0, "face_value": 1.0, "volume": 380000,
    "pe_ratio": 78.5, "industry_pe": 40.0, "pb_ratio": 18.2, "peg_ratio": 4.2, "graham_number": 680.0,
    "ev_ebitda": 48.5, "price_to_sales": 12.5, "price_to_fcf": 75.0, "dividend_yield": 0.52, "book_value": 167.5,
    "roce": 28.5, "roe": 23.8, "opm": 22.8, "npm": 16.2,
    "sales_growth_3y": 16.5, "sales_growth_5y": 12.8, "sales_growth_10y": 11.5,
    "profit_growth_3y": 18.2, "profit_growth_5y": 14.5, "profit_growth_10y": 13.8,
    "price_cagr_1y": 14.5, "price_cagr_3y": 8.5, "price_cagr_5y": 16.5, "price_cagr_10y": 21.2,
    "roe_3y": 22.8, "roe_5y": 21.5, "roe_10y": 23.4,
    "debt": 180.0, "debt_to_equity": 0.02, "interest_coverage": 58.0, "current_ratio": 2.2,
    "piotroski_score": 8, "altman_z_score": 14.2,
    "debtor_days": 48, "inventory_days": 65, "days_payable": 45, "working_capital_days": 68, "cash_conversion_cycle": 68,
    "cfo_latest": 2650, "cfo_3y": 6800, "cfo_5y": 10200, "fcf_latest": 2100, "fcf_3y": 5200, "fcf_5y": 7900, "fcf_yield": 1.35,
    "promoter_holding": 69.80, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 11.20, "change_in_fii_holding_quarter": -0.25,
    "dii_holding": 9.45, "change_in_dii_holding_quarter": 0.35, "public_holding": 9.55,
    "dma_50": 3020.0, "dma_200": 3080.0, "rsi_14": 53.4, "distance_52w_high": -8.82, "distance_52w_low": 13.81
  },
  {
    "symbol": "TATASTEEL", "nse_symbol": "TATASTEEL", "bse_code": "500470", "name": "Tata Steel Ltd",
    "sector": "Materials", "industry": "Iron & Steel Products",
    "about": "Tata Steel Limited is an Indian multinational steel-making company based in Mumbai, Maharashtra, and is a subsidiary of the Tata Group. One of the top steel producers in the world.",
    "website": "https://www.tatasteel.com",
    "current_price": 142.0, "change": 1.2, "change_pct": 0.85, "market_cap": 177200,
    "high_52w": 184.0, "low_52w": 132.0, "face_value": 1.0, "volume": 28000000,
    "pe_ratio": 38.5, "industry_pe": 18.0, "pb_ratio": 1.85, "peg_ratio": 2.5, "graham_number": 95.0,
    "ev_ebitda": 9.8, "price_to_sales": 0.8, "price_to_fcf": 18.5, "dividend_yield": 2.53, "book_value": 76.8,
    "roce": 8.5, "roe": 5.2, "opm": 11.8, "npm": 2.8,
    "sales_growth_3y": 8.5, "sales_growth_5y": 7.4, "sales_growth_10y": 6.2,
    "profit_growth_3y": -12.5, "profit_growth_5y": 8.5, "profit_growth_10y": 14.8,
    "price_cagr_1y": 4.5, "price_cagr_3y": 12.8, "price_cagr_5y": 28.5, "price_cagr_10y": 16.5,
    "roe_3y": 9.2, "roe_5y": 10.8, "roe_10y": 8.5,
    "debt": 84000.0, "debt_to_equity": 0.88, "interest_coverage": 4.2, "current_ratio": 1.1,
    "piotroski_score": 6, "altman_z_score": 2.1,
    "debtor_days": 18, "inventory_days": 75, "days_payable": 65, "working_capital_days": 28, "cash_conversion_cycle": 28,
    "cfo_latest": 21000, "cfo_3y": 65000, "cfo_5y": 98000, "fcf_latest": 8500, "fcf_3y": 28000, "fcf_5y": 44000, "fcf_yield": 4.80,
    "promoter_holding": 33.19, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 19.65, "change_in_fii_holding_quarter": -0.45,
    "dii_holding": 23.40, "change_in_dii_holding_quarter": 0.65, "public_holding": 23.76,
    "dma_50": 148.0, "dma_200": 158.0, "rsi_14": 42.8, "distance_52w_high": -22.83, "distance_52w_low": 7.58
  },

  # Auto & Auto Ancillaries
  {
    "symbol": "MARUTI", "nse_symbol": "MARUTI", "bse_code": "532500", "name": "Maruti Suzuki India Ltd",
    "sector": "Consumer Discretionary", "industry": "Automobiles - Passenger Cars",
    "about": "Maruti Suzuki India Limited is an Indian subsidiary of Japanese automotive manufacturer Suzuki Motor Corporation. It is India's largest passenger car maker.",
    "website": "https://www.marutisuzuki.com",
    "current_price": 11850.0, "change": 140.0, "change_pct": 1.20, "market_cap": 372800,
    "high_52w": 13680.0, "low_52w": 10450.0, "face_value": 5.0, "volume": 520000,
    "pe_ratio": 26.2, "industry_pe": 28.0, "pb_ratio": 4.2, "peg_ratio": 0.85, "graham_number": 5800.0,
    "ev_ebitda": 16.8, "price_to_sales": 2.6, "price_to_fcf": 24.5, "dividend_yield": 1.05, "book_value": 2821.5,
    "roce": 21.5, "roe": 17.2, "opm": 12.8, "npm": 9.8,
    "sales_growth_3y": 24.5, "sales_growth_5y": 11.2, "sales_growth_10y": 12.5,
    "profit_growth_3y": 58.5, "profit_growth_5y": 18.5, "profit_growth_10y": 14.8,
    "price_cagr_1y": 12.5, "price_cagr_3y": 14.8, "price_cagr_5y": 12.4, "price_cagr_10y": 13.8,
    "roe_3y": 15.8, "roe_5y": 12.8, "roe_10y": 14.5,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 95.0, "current_ratio": 1.4,
    "piotroski_score": 8, "altman_z_score": 8.5,
    "debtor_days": 12, "inventory_days": 20, "days_payable": 55, "working_capital_days": -23, "cash_conversion_cycle": -23,
    "cfo_latest": 16500, "cfo_3y": 38000, "cfo_5y": 54000, "fcf_latest": 12500, "fcf_3y": 28000, "fcf_5y": 41000, "fcf_yield": 3.35,
    "promoter_holding": 58.19, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 19.80, "change_in_fii_holding_quarter": 0.65,
    "dii_holding": 17.50, "change_in_dii_holding_quarter": -0.35, "public_holding": 4.51,
    "dma_50": 11650.0, "dma_200": 12200.0, "rsi_14": 56.2, "distance_52w_high": -13.38, "distance_52w_low": 13.40
  },
  {
    "symbol": "TATAMOTORS", "nse_symbol": "TATAMOTORS", "bse_code": "500570", "name": "Tata Motors Ltd",
    "sector": "Consumer Discretionary", "industry": "Automobiles - Commercial & Passenger",
    "about": "Tata Motors Group is a leading global automobile manufacturer with a portfolio that covers a wide range of cars, SUVs, buses, trucks, pickups and defence vehicles. Owner of Jaguar Land Rover.",
    "website": "https://www.tatamotors.com",
    "current_price": 725.0, "change": -12.5, "change_pct": -1.69, "market_cap": 266800,
    "high_52w": 1179.0, "low_52w": 690.0, "face_value": 2.0, "volume": 16500000,
    "pe_ratio": 8.5, "industry_pe": 28.0, "pb_ratio": 2.8, "peg_ratio": 0.22, "graham_number": 880.0,
    "ev_ebitda": 4.2, "price_to_sales": 0.6, "price_to_fcf": 8.5, "dividend_yield": 0.83, "book_value": 258.9,
    "roce": 22.8, "roe": 36.5, "opm": 14.5, "npm": 7.2,
    "sales_growth_3y": 28.5, "sales_growth_5y": 10.8, "sales_growth_10y": 6.8,
    "profit_growth_3y": 85.0, "profit_growth_5y": 45.0, "profit_growth_10y": 18.0,
    "price_cagr_1y": -22.5, "price_cagr_3y": 18.5, "price_cagr_5y": 38.5, "price_cagr_10y": 4.8,
    "roe_3y": 24.5, "roe_5y": 12.5, "roe_10y": 8.2,
    "debt": 58000.0, "debt_to_equity": 0.62, "interest_coverage": 6.8, "current_ratio": 0.95,
    "piotroski_score": 7, "altman_z_score": 3.1,
    "debtor_days": 18, "inventory_days": 45, "days_payable": 78, "working_capital_days": -15, "cash_conversion_cycle": -15,
    "cfo_latest": 42000, "cfo_3y": 95000, "cfo_5y": 135000, "fcf_latest": 31500, "fcf_3y": 68000, "fcf_5y": 92000, "fcf_yield": 11.8,
    "promoter_holding": 46.36, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 19.85, "change_in_fii_holding_quarter": -1.45,
    "dii_holding": 15.60, "change_in_dii_holding_quarter": 0.95, "public_holding": 18.19,
    "dma_50": 785.0, "dma_200": 920.0, "rsi_14": 38.5, "distance_52w_high": -38.51, "distance_52w_low": 5.07
  },
  {
    "symbol": "M&M", "nse_symbol": "M&M", "bse_code": "500520", "name": "Mahindra & Mahindra Ltd",
    "sector": "Consumer Discretionary", "industry": "Automobiles - SUVs & Farm Equipment",
    "about": "Mahindra & Mahindra Limited is an Indian multinational automotive manufacturing corporation headquartered in Mumbai. It is one of the largest vehicle manufacturers by production in India.",
    "website": "https://www.mahindra.com",
    "current_price": 2850.0, "change": 38.0, "change_pct": 1.35, "market_cap": 354500,
    "high_52w": 3222.0, "low_52w": 1780.0, "face_value": 5.0, "volume": 2450000,
    "pe_ratio": 29.5, "industry_pe": 28.0, "pb_ratio": 5.2, "peg_ratio": 1.3, "graham_number": 1380.0,
    "ev_ebitda": 18.5, "price_to_sales": 2.5, "price_to_fcf": 28.5, "dividend_yield": 0.74, "book_value": 548.2,
    "roce": 19.5, "roe": 18.4, "opm": 15.8, "npm": 8.5,
    "sales_growth_3y": 28.5, "sales_growth_5y": 16.5, "sales_growth_10y": 12.8,
    "profit_growth_3y": 38.5, "profit_growth_5y": 24.5, "profit_growth_10y": 14.2,
    "price_cagr_1y": 52.5, "price_cagr_3y": 48.5, "price_cagr_5y": 38.2, "price_cagr_10y": 18.5,
    "roe_3y": 17.8, "roe_5y": 14.5, "roe_10y": 13.8,
    "debt": 18500.0, "debt_to_equity": 0.28, "interest_coverage": 14.5, "current_ratio": 1.3,
    "piotroski_score": 8, "altman_z_score": 5.8,
    "debtor_days": 24, "inventory_days": 38, "days_payable": 62, "working_capital_days": 0, "cash_conversion_cycle": 0,
    "cfo_latest": 14800, "cfo_3y": 36000, "cfo_5y": 52000, "fcf_latest": 10500, "fcf_3y": 25500, "fcf_5y": 38000, "fcf_yield": 2.96,
    "promoter_holding": 19.32, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 41.50, "change_in_fii_holding_quarter": 0.85,
    "dii_holding": 27.80, "change_in_dii_holding_quarter": -0.45, "public_holding": 11.38,
    "dma_50": 2810.0, "dma_200": 2880.0, "rsi_14": 55.4, "distance_52w_high": -11.55, "distance_52w_low": 60.11
  },

  # Tech & Internet
  {
    "symbol": "ZOMATO", "nse_symbol": "ZOMATO", "bse_code": "543320", "name": "Zomato Ltd (Eternal)",
    "sector": "Communication Services", "industry": "Food Delivery & Quick Commerce (Blinkit)",
    "about": "Zomato Limited is an Indian multinational restaurant aggregator and food delivery company. It also owns Blinkit, India's leading quick commerce platform, and Hyperpure.",
    "website": "https://www.zomato.com",
    "current_price": 245.0, "change": 6.8, "change_pct": 2.85, "market_cap": 218000,
    "high_52w": 298.0, "low_52w": 146.0, "face_value": 1.0, "volume": 35000000,
    "pe_ratio": 125.0, "industry_pe": 45.0, "pb_ratio": 9.2, "peg_ratio": 0.85, "graham_number": 45.0,
    "ev_ebitda": 68.5, "price_to_sales": 14.5, "price_to_fcf": 85.0, "dividend_yield": 0.0, "book_value": 26.6,
    "roce": 9.5, "roe": 8.2, "opm": 7.8, "npm": 5.4,
    "sales_growth_3y": 68.5, "sales_growth_5y": 48.2, "sales_growth_10y": 45.0,
    "profit_growth_3y": 145.0, "profit_growth_5y": 120.0, "profit_growth_10y": 80.0,
    "price_cagr_1y": 85.0, "price_cagr_3y": 65.0, "price_cagr_5y": 45.0, "price_cagr_10y": 32.0,
    "roe_3y": 4.5, "roe_5y": -8.5, "roe_10y": -15.0,
    "debt": 0.0, "debt_to_equity": 0.0, "interest_coverage": 85.0, "current_ratio": 4.2,
    "piotroski_score": 7, "altman_z_score": 11.2,
    "debtor_days": 8, "inventory_days": 4, "days_payable": 18, "working_capital_days": -6, "cash_conversion_cycle": -6,
    "cfo_latest": 2400, "cfo_3y": 4200, "cfo_5y": 4800, "fcf_latest": 1950, "fcf_3y": 3400, "fcf_5y": 3800, "fcf_yield": 0.89,
    "promoter_holding": 0.0, "change_in_promoter_holding_quarter": 0.0, "pledged_percentage": 0.0,
    "fii_holding": 52.40, "change_in_fii_holding_quarter": 2.15,
    "dii_holding": 22.80, "change_in_dii_holding_quarter": -0.85, "public_holding": 24.80,
    "dma_50": 238.0, "dma_200": 242.0, "rsi_14": 58.6, "distance_52w_high": -17.79, "distance_52w_low": 67.81
  }
]

def generate_financial_statements(stock):
    mcap = stock["market_cap"]
    sales_ttm = round(mcap / stock["price_to_sales"]) if stock.get("price_to_sales") else round(mcap * 0.4)
    opm = stock["opm"]
    bv = stock["book_value"]
    fv = stock["face_value"]
    shares = round((mcap * 10000000) / stock["current_price"])
    equity_cap = round((shares * fv) / 10000000)

    # 1. Quarterly Results (8 quarters: Mar 2023 ... Dec 2024)
    quarters = ["Mar 2023", "Jun 2023", "Sep 2023", "Dec 2023", "Mar 2024", "Jun 2024", "Sep 2024", "Dec 2024"]
    quarterly_results = []
    base_q_sales = sales_ttm / 4.2
    for idx, q in enumerate(quarters):
        growth_factor = (1 + (stock["sales_growth_3y"] / 400)) ** idx
        q_sales = round(base_q_sales * growth_factor)
        q_exp = round(q_sales * (1 - opm/100))
        q_op = q_sales - q_exp
        q_oth = round(q_sales * 0.02)
        q_int = round(stock["debt"] * 0.02 / 4) if stock["debt"] > 0 else 5
        q_dep = round(q_sales * 0.04)
        q_pbt = q_op + q_oth - q_int - q_dep
        q_tax_pct = 25.0
        q_net = round(q_pbt * 0.75)
        q_eps = round((q_net * 10000000) / shares, 2)
        quarterly_results.append({
            "period": q, "sales": q_sales, "expenses": q_exp, "operating_profit": q_op,
            "opm_pct": opm, "other_income": q_oth, "interest": q_int, "depreciation": q_dep,
            "profit_before_tax": q_pbt, "tax_pct": q_tax_pct, "net_profit": q_net, "eps": q_eps
        })

    # 2. Annual P&L (10 years: Mar 2015 ... Mar 2024, TTM)
    years = ["Mar 2015", "Mar 2016", "Mar 2017", "Mar 2018", "Mar 2019", "Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024", "TTM"]
    annual_pnl = []
    for idx, yr in enumerate(years):
        step_back = 10 - idx
        y_factor = (1 / (1 + (stock["sales_growth_10y"]/100))) ** step_back
        y_sales = round(sales_ttm * y_factor)
        y_exp = round(y_sales * (1 - opm/100))
        y_op = y_sales - y_exp
        y_oth = round(y_sales * 0.025)
        y_int = round(stock["debt"] * 0.07 * y_factor) if stock["debt"] > 0 else 15
        y_dep = round(y_sales * 0.045)
        y_pbt = y_op + y_oth - y_int - y_dep
        y_net = round(y_pbt * 0.75)
        y_eps = round((y_net * 10000000) / shares, 2)
        payout = 35 if stock["dividend_yield"] > 1.0 else 15
        annual_pnl.append({
            "year": yr, "sales": y_sales, "expenses": y_exp, "operating_profit": y_op,
            "opm_pct": opm, "other_income": y_oth, "interest": y_int, "depreciation": y_dep,
            "profit_before_tax": y_pbt, "tax_pct": 25.0, "net_profit": y_net, "eps": y_eps,
            "dividend_payout_pct": payout
        })

    # 3. Balance Sheet (10 years: Mar 2015 ... Mar 2024)
    bs_years = ["Mar 2015", "Mar 2016", "Mar 2017", "Mar 2018", "Mar 2019", "Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024"]
    balance_sheet = []
    for idx, yr in enumerate(bs_years):
        step_back = 9 - idx
        factor = (1 / (1 + (stock["roe_10y"]/100))) ** step_back
        reserves = round((bv * shares / 10000000) * factor) - equity_cap
        borrowings = round(stock["debt"] * factor)
        other_liab = round(reserves * 0.3)
        total_liab = equity_cap + reserves + borrowings + other_liab
        fixed_assets = round(total_liab * 0.45)
        cwip = round(fixed_assets * 0.08)
        investments = round(total_liab * 0.25)
        other_assets = total_liab - fixed_assets - cwip - investments
        balance_sheet.append({
            "year": yr, "equity_capital": equity_cap, "reserves": max(10, reserves),
            "borrowings": borrowings, "other_liabilities": other_liab, "total_liabilities": total_liab,
            "fixed_assets": fixed_assets, "cwip": cwip, "investments": investments,
            "other_assets": other_assets, "total_assets": total_liab
        })

    # 4. Cash Flows (10 years)
    cash_flow = []
    for idx, yr in enumerate(bs_years):
        step_back = 9 - idx
        factor = (1 / (1 + (stock["profit_growth_10y"]/100))) ** step_back
        cfo = round(stock["cfo_latest"] * factor)
        capex = round(cfo * 0.35)
        inv_cf = -round(cfo * 0.45)
        fin_cf = -round(cfo * 0.40)
        net_cf = cfo + inv_cf + fin_cf
        fcf = cfo - capex
        cash_flow.append({
            "year": yr, "operating_cf": cfo, "investing_cf": inv_cf,
            "financing_cf": fin_cf, "net_cf": net_cf, "free_cf": fcf
        })

    # 5. Shareholding History (6 quarters)
    sh_periods = ["Sep 2023", "Dec 2023", "Mar 2024", "Jun 2024", "Sep 2024", "Dec 2024"]
    shareholding_history = []
    p_base = stock["promoter_holding"]
    f_base = stock["fii_holding"]
    d_base = stock["dii_holding"]
    pub_base = stock["public_holding"]
    pledge_base = stock["pledged_percentage"]

    for idx, p in enumerate(sh_periods):
        shareholding_history.append({
            "period": p, "promoter": p_base,
            "fii": round(f_base - (5-idx)*0.1, 2),
            "dii": round(d_base + (5-idx)*0.08, 2),
            "public": pub_base, "others": 0.0,
            "pledged": pledge_base
        })

    # 6. Ratios History (10 years)
    ratios_history = []
    for idx, yr in enumerate(bs_years):
        step_back = 9 - idx
        factor = (1 - step_back * 0.02)
        ratios_history.append({
            "year": yr,
            "roce": round(stock["roce"] * factor, 1),
            "roe": round(stock["roe"] * factor, 1),
            "debtor_days": stock["debtor_days"],
            "inventory_days": stock["inventory_days"],
            "days_payable": stock["days_payable"],
            "working_capital_days": stock["working_capital_days"],
            "cash_conversion_cycle": stock["cash_conversion_cycle"]
        })

    # 7. Historical Prices (12 months monthly data)
    dates = [
        "2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30", "2024-05-31", "2024-06-30",
        "2024-07-31", "2024-08-31", "2024-09-30", "2024-10-31", "2024-11-30", "2024-12-31"
    ]
    historical_prices = []
    cmp = stock["current_price"]
    for idx, d in enumerate(dates):
        noise = math.sin(idx * 0.6) * 0.04
        trend = (1 - (11 - idx) * 0.015)
        p_val = round(cmp * trend * (1 + noise), 1)
        historical_prices.append({
            "date": d,
            "price": p_val,
            "dma_50": round(p_val * 0.98, 1),
            "dma_200": round(p_val * 0.94, 1),
            "volume": stock["volume"],
            "pe": round(stock["pe_ratio"] * (p_val / cmp), 1)
        })

    return {
        "quarterly_results": quarterly_results,
        "annual_pnl": annual_pnl,
        "balance_sheet": balance_sheet,
        "cash_flow": cash_flow,
        "shareholding_history": shareholding_history,
        "ratios_history": ratios_history,
        "historical_prices": historical_prices
    }

# Process all stocks
processed_stocks = []
for s in STOCKS_MASTER:
    s_full = dict(s)
    s_full["id"] = s["symbol"].lower()
    details = generate_financial_statements(s)
    s_full.update(details)
    
    # Generate Peers
    peers = []
    for other in STOCKS_MASTER:
        if other["sector"] == s["sector"] and other["symbol"] != s["symbol"]:
            peers.append({
                "symbol": other["symbol"],
                "name": other["name"],
                "current_price": other["current_price"],
                "pe_ratio": other["pe_ratio"],
                "market_cap": other["market_cap"],
                "dividend_yield": other["dividend_yield"],
                "net_profit_qtr": round(other["market_cap"] * 0.012),
                "qtr_profit_var_pct": other["profit_growth_3y"],
                "sales_qtr": round(other["market_cap"] * 0.08),
                "qtr_sales_var_pct": other["sales_growth_3y"],
                "roce": other["roce"]
            })
    s_full["peers"] = peers
    processed_stocks.append(s_full)

# 1. Output TypeScript dataset src/data/stocksData.ts
ts_content = f"""import {{ Stock }} from '../types/stock';

export const STOCKS_DATA: Stock[] = {json.dumps(processed_stocks, indent=2)};
"""
with open("src/data/stocksData.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Generated src/data/stocksData.ts with {len(processed_stocks)} stocks.")

# 2. Populate SQLite database data/screener.db
os.makedirs("data", exist_ok=True)
db_path = "data/screener.db"
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS stocks (
    id TEXT PRIMARY KEY,
    symbol TEXT UNIQUE,
    name TEXT,
    bse_code TEXT,
    nse_symbol TEXT,
    sector TEXT,
    industry TEXT,
    about TEXT,
    website TEXT,
    current_price REAL,
    change REAL,
    change_pct REAL,
    market_cap REAL,
    high_52w REAL,
    low_52w REAL,
    face_value REAL,
    volume REAL,
    pe_ratio REAL,
    industry_pe REAL,
    pb_ratio REAL,
    peg_ratio REAL,
    graham_number REAL,
    ev_ebitda REAL,
    price_to_sales REAL,
    price_to_fcf REAL,
    dividend_yield REAL,
    book_value REAL,
    roce REAL,
    roe REAL,
    opm REAL,
    npm REAL,
    sales_growth_3y REAL,
    sales_growth_5y REAL,
    sales_growth_10y REAL,
    profit_growth_3y REAL,
    profit_growth_5y REAL,
    profit_growth_10y REAL,
    price_cagr_1y REAL,
    price_cagr_3y REAL,
    price_cagr_5y REAL,
    price_cagr_10y REAL,
    roe_3y REAL,
    roe_5y REAL,
    roe_10y REAL,
    debt REAL,
    debt_to_equity REAL,
    interest_coverage REAL,
    current_ratio REAL,
    piotroski_score REAL,
    altman_z_score REAL,
    debtor_days REAL,
    inventory_days REAL,
    days_payable REAL,
    working_capital_days REAL,
    cash_conversion_cycle REAL,
    cfo_latest REAL,
    cfo_3y REAL,
    cfo_5y REAL,
    fcf_latest REAL,
    fcf_3y REAL,
    fcf_5y REAL,
    fcf_yield REAL,
    promoter_holding REAL,
    change_in_promoter_holding_quarter REAL,
    pledged_percentage REAL,
    fii_holding REAL,
    change_in_fii_holding_quarter REAL,
    dii_holding REAL,
    change_in_dii_holding_quarter REAL,
    public_holding REAL,
    dma_50 REAL,
    dma_200 REAL,
    rsi_14 REAL,
    distance_52w_high REAL,
    distance_52w_low REAL,
    quarterly_json TEXT,
    annual_pnl_json TEXT,
    balance_sheet_json TEXT,
    cash_flow_json TEXT,
    shareholding_json TEXT,
    ratios_json TEXT,
    prices_json TEXT,
    peers_json TEXT
)
""")

for s in processed_stocks:
    cur.execute("""
    INSERT INTO stocks (
        id, symbol, name, bse_code, nse_symbol, sector, industry, about, website,
        current_price, change, change_pct, market_cap, high_52w, low_52w, face_value, volume,
        pe_ratio, industry_pe, pb_ratio, peg_ratio, graham_number, ev_ebitda, price_to_sales,
        price_to_fcf, dividend_yield, book_value, roce, roe, opm, npm,
        sales_growth_3y, sales_growth_5y, sales_growth_10y,
        profit_growth_3y, profit_growth_5y, profit_growth_10y,
        price_cagr_1y, price_cagr_3y, price_cagr_5y, price_cagr_10y,
        roe_3y, roe_5y, roe_10y,
        debt, debt_to_equity, interest_coverage, current_ratio, piotroski_score, altman_z_score,
        debtor_days, inventory_days, days_payable, working_capital_days, cash_conversion_cycle,
        cfo_latest, cfo_3y, cfo_5y, fcf_latest, fcf_3y, fcf_5y, fcf_yield,
        promoter_holding, change_in_promoter_holding_quarter, pledged_percentage,
        fii_holding, change_in_fii_holding_quarter, dii_holding, change_in_dii_holding_quarter, public_holding,
        dma_50, dma_200, rsi_14, distance_52w_high, distance_52w_low,
        quarterly_json, annual_pnl_json, balance_sheet_json, cash_flow_json, shareholding_json, ratios_json, prices_json, peers_json
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
    )
    """, (
        s["id"], s["symbol"], s["name"], s.get("bse_code"), s["nse_symbol"], s["sector"], s["industry"], s["about"], s.get("website"),
        s["current_price"], s["change"], s["change_pct"], s["market_cap"], s["high_52w"], s["low_52w"], s["face_value"], s["volume"],
        s["pe_ratio"], s["industry_pe"], s["pb_ratio"], s["peg_ratio"], s["graham_number"], s["ev_ebitda"], s["price_to_sales"],
        s["price_to_fcf"], s["dividend_yield"], s["book_value"], s["roce"], s["roe"], s["opm"], s["npm"],
        s["sales_growth_3y"], s["sales_growth_5y"], s["sales_growth_10y"],
        s["profit_growth_3y"], s["profit_growth_5y"], s["profit_growth_10y"],
        s["price_cagr_1y"], s["price_cagr_3y"], s["price_cagr_5y"], s["price_cagr_10y"],
        s["roe_3y"], s["roe_5y"], s["roe_10y"],
        s["debt"], s["debt_to_equity"], s["interest_coverage"], s["current_ratio"], s["piotroski_score"], s["altman_z_score"],
        s["debtor_days"], s["inventory_days"], s["days_payable"], s["working_capital_days"], s["cash_conversion_cycle"],
        s["cfo_latest"], s["cfo_3y"], s["cfo_5y"], s["fcf_latest"], s["fcf_3y"], s["fcf_5y"], s["fcf_yield"],
        s["promoter_holding"], s["change_in_promoter_holding_quarter"], s["pledged_percentage"],
        s["fii_holding"], s["change_in_fii_holding_quarter"], s["dii_holding"], s["change_in_dii_holding_quarter"], s["public_holding"],
        s["dma_50"], s["dma_200"], s["rsi_14"], s["distance_52w_high"], s["distance_52w_low"],
        json.dumps(s.get("quarterly_results")), json.dumps(s.get("annual_pnl")), json.dumps(s.get("balance_sheet")),
        json.dumps(s.get("cash_flow")), json.dumps(s.get("shareholding_history")), json.dumps(s.get("ratios_history")),
        json.dumps(s.get("historical_prices")), json.dumps(s.get("peers"))
    ))

conn.commit()
conn.close()
print(f"Database populated: {db_path}")

import sys
sys.path.insert(0, os.path.abspath("."))
import db_split_join
db_split_join.split_db()
print("Database split into parts successfully.")
