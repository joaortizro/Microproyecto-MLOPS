"""
Build Training Dataset

Genera el dataset consolidado para entrenamiento
y lo guarda en data/processed/training_dataset.csv
"""

import pandas as pd
import numpy as np

print("Building training dataset...")

# ==============================
# LOAD RAW DATA
# ==============================

data_reviews = pd.read_csv("../data/olist_order_reviews_dataset.csv")
data_orders = pd.read_csv("../data/olist_orders_dataset.csv")
data_order_items = pd.read_csv("../data/olist_order_items_dataset.csv")
data_sellers = pd.read_csv("../data/olist_sellers_dataset.csv")
data_products = pd.read_csv("../data/olist_products_dataset.csv")
data_geolocation = pd.read_csv("../data/olist_geolocation_dataset.csv")
data_payments = pd.read_csv("../data/olist_order_payments_dataset.csv")
data_customers = pd.read_csv("../data/olist_customers_dataset.csv")

# ==============================
# FEATURE ENGINEERING
# ==============================

payments_agg = data_payments.groupby("order_id").agg({
    "payment_installments": "max",
    "payment_value": "sum",
    "payment_type": lambda x: x.mode()[0] if not x.empty else "unknown",
}).reset_index()

geo_clean = data_geolocation.groupby(
    "geolocation_zip_code_prefix"
).agg({
    "geolocation_lat": "mean",
    "geolocation_lng": "mean",
}).reset_index()

df = data_reviews.merge(data_orders, on="order_id")
df = df.merge(data_order_items, on="order_id")

# ---- dates ----
for col in [
    "order_delivered_customer_date",
    "order_estimated_delivery_date",
    "order_delivered_carrier_date",
    "order_purchase_timestamp",
]:
    df[col] = pd.to_datetime(df[col]).fillna(pd.Timestamp("1970-01-01"))

df["delivery_delta_days"] = (
    df["order_delivered_customer_date"]
    - df["order_estimated_delivery_date"]
).dt.days

df["seller_dispatch_days"] = (
    df["order_delivered_carrier_date"]
    - df["order_purchase_timestamp"]
).dt.days

df["carrier_transit_days"] = (
    df["order_delivered_customer_date"]
    - df["order_delivered_carrier_date"]
).dt.days

# ---- text ----
df["full_text"] = (
    df["review_comment_title"].fillna("")
    + " "
    + df["review_comment_message"].fillna("")
)

# ---- joins ----
df = df.merge(payments_agg, on="order_id", how="left")

df = df.merge(
    data_customers[["customer_id", "customer_zip_code_prefix"]],
    on="customer_id",
)

df = df.merge(
    data_sellers[["seller_id", "seller_zip_code_prefix"]],
    on="seller_id",
)

df = df.merge(data_products, on="product_id", how="left")

df = df.merge(
    geo_clean,
    left_on="customer_zip_code_prefix",
    right_on="geolocation_zip_code_prefix",
    how="left",
).rename(columns={
    "geolocation_lat": "geo_lat_customer",
    "geolocation_lng": "geo_lng_customer",
})

df = df.merge(
    geo_clean,
    left_on="seller_zip_code_prefix",
    right_on="geolocation_zip_code_prefix",
    how="left",
).rename(columns={
    "geolocation_lat": "geo_lat_seller",
    "geolocation_lng": "geo_lng_seller",
})

# ---- distance ----
df["distance_seller_customer_km"] = np.sqrt(
    (df["geo_lat_customer"] - df["geo_lat_seller"]) ** 2 +
    (df["geo_lng_customer"] - df["geo_lng_seller"]) ** 2
) * 111.1

# ==============================
# TEXT FEATURES
# ==============================

df["full_text"] = df["full_text"].fillna("")

df["char_count"] = df["full_text"].str.len()
df["word_count"] = df["full_text"].apply(lambda x: len(x.split()))
df["exclamation_count"] = df["full_text"].str.count("!")
df["question_count"] = df["full_text"].str.count(r"\?")
df["avg_word_length"] = df["full_text"].apply(
    lambda x: sum(len(w) for w in x.split()) / len(x.split())
    if x.split()
    else 0
)

# ==============================
# TRAIN DATASET
# ==============================

df_training = df[
    df["order_delivered_customer_date"] > "2000-01-01"
].copy()

df_training["is_negative"] = (
    df_training["review_score"] <= 2
).astype(int)

FEATURE_COLUMNS = [
    "delivery_delta_days",
    "seller_dispatch_days",
    "carrier_transit_days",
    "distance_seller_customer_km",
    "price",
    "freight_value",
    "payment_value",
    "payment_installments",
    "product_weight_g",
    "product_description_lenght",
    "product_photos_qty",
    "char_count",
    "word_count",
    "exclamation_count",
    "question_count",
    "avg_word_length",
]

training_dataset = df_training[
    FEATURE_COLUMNS + ["is_negative"]
].fillna(df_training[FEATURE_COLUMNS].median())

# ==============================
# SAVE DATASET
# ==============================

training_dataset.to_csv(
    "../data/training_dataset.csv",
    index=False,
)

print("✅ training_dataset.csv created")
print(training_dataset.shape)