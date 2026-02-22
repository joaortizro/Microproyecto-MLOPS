import sys
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, f1_score, precision_score, recall_score
from sklearn.ensemble import RandomForestClassifier
import mlflow
import mlflow.sklearn

n_estimators = int(sys.argv[1]) if len(sys.argv) > 1 else 200
run_name = sys.argv[2] if len(sys.argv) > 2 else "randomforest"

print(f"Training {run_name}")

# ---------- DATA (igual que tus otros scripts) ----------
df = pd.read_csv("../data/training_dataset.csv")

FEATURE_COLUMNS = [
    'delivery_delta_days',
    'seller_dispatch_days',
    'carrier_transit_days',
    'distance_seller_customer_km',
    'price',
    'freight_value',
    'payment_value',
    'payment_installments',
]

X = df[FEATURE_COLUMNS].fillna(df[FEATURE_COLUMNS].median())
y = df["is_negative"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ---------- MLflow ----------
mlflow.set_tracking_uri("http://localhost:8050")
mlflow.set_experiment("olist-negative-review-classif-RF")

with mlflow.start_run(run_name=run_name):

    model = RandomForestClassifier(
        n_estimators=n_estimators,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:,1]

    metrics = {
        "roc_auc": roc_auc_score(y_test, y_proba),
        "f1": f1_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
    }

    mlflow.log_params({"n_estimators": n_estimators})
    mlflow.log_metrics(metrics)
    mlflow.sklearn.log_model(model, "model")

    print(metrics)
