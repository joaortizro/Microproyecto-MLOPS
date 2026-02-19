"""
Feature engineering pipeline.
Transforms raw Olist data into the 16 features used by the model.
"""

import re
import os

import numpy as np
import pandas as pd
import yaml

from olist_review_model import CONFIG_DIR


def load_config():
    config_path = os.path.join(CONFIG_DIR, "config.yml")
    with open(config_path) as f:
        return yaml.safe_load(f)


def load_raw_data(data_dir: str) -> dict:
    """Load all raw CSV files."""
    config = load_config()
    files = config["data_files"]
    data = {}
    for key, filename in files.items():
        data[key] = pd.read_csv(os.path.join(data_dir, filename))
    return data


def build_maestro(data: dict) -> pd.DataFrame:
    """Merge all datasets into the maestro DataFrame."""

    # Payments aggregation
    payments_agg = data["payments"].groupby("order_id").agg({
        "payment_installments": "max",
        "payment_value": "sum",
    }).reset_index()

    # Geolocation: average lat/lng per zip prefix
    geo_clean = data["geolocation"].groupby("geolocation_zip_code_prefix").agg({
        "geolocation_lat": "mean",
        "geolocation_lng": "mean",
    }).reset_index()

    # Start merging
    df = data["reviews"].merge(data["orders"], on="order_id", how="inner")
    df = df.merge(data["order_items"], on="order_id", how="inner")

    # Parse dates, fill NaT with sentinel
    date_cols = [
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
        "order_delivered_carrier_date",
        "order_purchase_timestamp",
    ]
    for col in date_cols:
        df[col] = pd.to_datetime(df[col]).fillna(pd.Timestamp("1970-01-01"))

    # Temporal features
    df["delivery_delta_days"] = (
        df["order_delivered_customer_date"] - df["order_estimated_delivery_date"]
    ).dt.days
    df["seller_dispatch_days"] = (
        df["order_delivered_carrier_date"] - df["order_purchase_timestamp"]
    ).dt.days
    df["carrier_transit_days"] = (
        df["order_delivered_customer_date"] - df["order_delivered_carrier_date"]
    ).dt.days

    # Full text for text features
    df["full_text"] = (
        df["review_comment_title"].fillna("") + " " + df["review_comment_message"].fillna("")
    )

    # Merge payments, customers, sellers, products
    df = df.merge(payments_agg, on="order_id", how="left")
    df = df.merge(
        data["customers"][["customer_id", "customer_zip_code_prefix"]],
        on="customer_id", how="left",
    )
    df = df.merge(
        data["sellers"][["seller_id", "seller_zip_code_prefix"]],
        on="seller_id", how="left",
    )
    df = df.merge(data["products"], on="product_id", how="left")

    # Merge geolocation (customer)
    df = df.merge(
        geo_clean,
        left_on="customer_zip_code_prefix",
        right_on="geolocation_zip_code_prefix",
        how="left",
    ).rename(columns={
        "geolocation_lat": "geo_lat_customer",
        "geolocation_lng": "geo_lng_customer",
    }).drop(columns=["geolocation_zip_code_prefix"], errors="ignore")

    # Merge geolocation (seller)
    df = df.merge(
        geo_clean,
        left_on="seller_zip_code_prefix",
        right_on="geolocation_zip_code_prefix",
        how="left",
    ).rename(columns={
        "geolocation_lat": "geo_lat_seller",
        "geolocation_lng": "geo_lng_seller",
    }).drop(columns=["geolocation_zip_code_prefix"], errors="ignore")

    # Distance seller-customer
    deg_to_km = 111.1
    df["distance_seller_customer_km"] = (
        np.sqrt(
            (df["geo_lat_customer"] - df["geo_lat_seller"]) ** 2
            + (df["geo_lng_customer"] - df["geo_lng_seller"]) ** 2
        ) * deg_to_km
    )

    # Text statistics
    df = _calculate_text_stats(df, "full_text")

    return df


def _calculate_text_stats(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """Calculate text statistics for a column."""
    df[column] = df[column].fillna("")
    df["char_count"] = df[column].str.len()
    df["word_count"] = df[column].apply(lambda x: len(x.split()))
    df["exclamation_count"] = df[column].str.count("!")
    df["question_count"] = df[column].str.count(r"\?")
    df["avg_word_length"] = df[column].apply(
        lambda x: sum(len(w) for w in x.split()) / len(x.split()) if x.split() else 0
    )
    return df


def prepare_training_data(df: pd.DataFrame) -> pd.DataFrame:
    """Filter sentinel dates and create target variable."""
    config = load_config()

    # Filter rows with sentinel dates
    df_train = df[df["order_delivered_customer_date"] > "2000-01-01"].copy()

    # Create binary target
    threshold = config["negative_threshold"]
    df_train["is_negative"] = (df_train["review_score"] <= threshold).astype(int)

    return df_train


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract only the model features, filling NaN with median."""
    config = load_config()
    features = config["features"]
    X = df[features].fillna(df[features].median())
    return X
