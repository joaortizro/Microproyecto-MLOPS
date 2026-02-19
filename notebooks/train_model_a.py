"""
Train Model A: XGBoost
Usage:
    python train_model_a.py                          # defaults
    python train_model_a.py 500 8 0.05               # n_estimators max_depth learning_rate
    python train_model_a.py 1000 4 0.01 my-run-name  # con nombre custom
"""
import sys
import re
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, f1_score, precision_score, recall_score
import xgboost as xgb
import mlflow
import mlflow.xgboost

# --- PARAMETROS (desde CLI o defaults) ---
n_estimators = int(sys.argv[1]) if len(sys.argv) > 1 else 300
max_depth = int(sys.argv[2]) if len(sys.argv) > 2 else 6
learning_rate = float(sys.argv[3]) if len(sys.argv) > 3 else 0.1
run_name = sys.argv[4] if len(sys.argv) > 4 else f"xgb-est{n_estimators}-d{max_depth}-lr{learning_rate}"

print(f"=== Training: {run_name} ===")
print(f"n_estimators={n_estimators}, max_depth={max_depth}, learning_rate={learning_rate}")

# --- CARGA DE DATOS ---
data_reviews = pd.read_csv('../data/olist_order_reviews_dataset.csv')
data_orders = pd.read_csv('../data/olist_orders_dataset.csv')
data_order_items = pd.read_csv('../data/olist_order_items_dataset.csv')
data_sellers = pd.read_csv('../data/olist_sellers_dataset.csv')
data_products = pd.read_csv('../data/olist_products_dataset.csv')
data_geolocation = pd.read_csv('../data/olist_geolocation_dataset.csv')
data_payments = pd.read_csv('../data/olist_order_payments_dataset.csv')
data_customers = pd.read_csv('../data/olist_customers_dataset.csv')

# --- AGREGACIONES ---
payments_agg = data_payments.groupby('order_id').agg({
    'payment_installments': 'max',
    'payment_value': 'sum',
    'payment_type': lambda x: x.mode()[0] if not x.empty else 'unknown'
}).reset_index()

geo_clean = data_geolocation.groupby('geolocation_zip_code_prefix').agg({
    'geolocation_lat': 'mean',
    'geolocation_lng': 'mean'
}).reset_index()

# --- DATASET MAESTRO ---
df = data_reviews.merge(data_orders, on='order_id', how='inner')
df = df.merge(data_order_items, on='order_id', how='inner')

for col in ['order_delivered_customer_date', 'order_estimated_delivery_date',
            'order_delivered_carrier_date', 'order_purchase_timestamp']:
    df[col] = pd.to_datetime(df[col]).fillna(pd.Timestamp('1970-01-01'))

df['delivery_delta_days'] = (df['order_delivered_customer_date'] - df['order_estimated_delivery_date']).dt.days
df['seller_dispatch_days'] = (df['order_delivered_carrier_date'] - df['order_purchase_timestamp']).dt.days
df['carrier_transit_days'] = (df['order_delivered_customer_date'] - df['order_delivered_carrier_date']).dt.days
df['full_text'] = df['review_comment_title'].fillna('') + ' ' + df['review_comment_message'].fillna('')

df = df.merge(payments_agg, on='order_id', how='left')
df = df.merge(data_customers[['customer_id', 'customer_zip_code_prefix']], on='customer_id', how='left')
df = df.merge(data_sellers[['seller_id', 'seller_zip_code_prefix']], on='seller_id', how='left')
df = df.merge(data_products, on='product_id', how='left')
df = df.merge(geo_clean, left_on='customer_zip_code_prefix', right_on='geolocation_zip_code_prefix', how='left') \
      .rename(columns={'geolocation_lat': 'geo_lat_customer', 'geolocation_lng': 'geo_lng_customer'}) \
      .drop(columns=['geolocation_zip_code_prefix'])
df = df.merge(geo_clean, left_on='seller_zip_code_prefix', right_on='geolocation_zip_code_prefix', how='left') \
      .rename(columns={'geolocation_lat': 'geo_lat_seller', 'geolocation_lng': 'geo_lng_seller'}) \
      .drop(columns=['geolocation_zip_code_prefix'])

df['distance_seller_customer_km'] = np.sqrt(
    (df['geo_lat_customer'] - df['geo_lat_seller'])**2 +
    (df['geo_lng_customer'] - df['geo_lng_seller'])**2
) * 111.1

# Text stats
df['full_text'] = df['full_text'].fillna('')
df['char_count'] = df['full_text'].str.len()
df['word_count'] = df['full_text'].apply(lambda x: len(x.split()))
df['exclamation_count'] = df['full_text'].str.count('!')
df['question_count'] = df['full_text'].str.count(r'\?')
df['avg_word_length'] = df['full_text'].apply(
    lambda x: sum(len(w) for w in x.split()) / len(x.split()) if x.split() else 0
)

# --- TRAINING DATA ---
df_training = df[df['order_delivered_customer_date'] > '2000-01-01'].copy()
df_training['is_negative'] = (df_training['review_score'] <= 2).astype(int)

FEATURE_COLUMNS = [
    'delivery_delta_days', 'seller_dispatch_days', 'carrier_transit_days',
    'distance_seller_customer_km',
    'price', 'freight_value', 'payment_value', 'payment_installments',
    'product_weight_g', 'product_description_lenght', 'product_photos_qty',
    'char_count', 'word_count', 'exclamation_count', 'question_count', 'avg_word_length',
]

X = df_training[FEATURE_COLUMNS].fillna(df_training[FEATURE_COLUMNS].median())
y = df_training['is_negative']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()


mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("olist-negative-review-classifier")

with mlflow.start_run(run_name=run_name):
    params = {
        'n_estimators': n_estimators,
        'max_depth': max_depth,
        'learning_rate': learning_rate,
        'scale_pos_weight': scale_pos_weight,
        'eval_metric': 'auc',
        'random_state': 42,
    }

    model = xgb.XGBClassifier(**params)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        'roc_auc': roc_auc_score(y_test, y_proba),
        'f1': f1_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
    }

    mlflow.log_params(params)
    mlflow.log_metrics(metrics)
    mlflow.xgboost.log_model(model, artifact_path="model")

    print("\n" + classification_report(y_test, y_pred))
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"\nRun logged: {run_name}")
