"""
Training pipeline for the Olist negative review XGBoost model.
Loads data, applies feature engineering, trains and saves the model.
"""

import os

import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

from olist_review_model import TRAINED_MODEL_DIR
from olist_review_model.pipeline import (
    load_config,
    load_raw_data,
    build_maestro,
    prepare_training_data,
    extract_features,
)


def run_training():
    config = load_config()
    data_dir = os.path.join(os.path.dirname(os.path.dirname(TRAINED_MODEL_DIR)), config["data_dir"])

    # --- Load & build maestro ---
    print("Loading raw data...")
    raw_data = load_raw_data(data_dir)

    print("Building maestro dataset...")
    df_maestro = build_maestro(raw_data)

    print("Preparing training data...")
    df_training = prepare_training_data(df_maestro)

    # --- Features & target ---
    X = extract_features(df_training)
    y = df_training[config["target"]]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=config["test_size"],
        random_state=config["random_state"],
        stratify=y,
    )

    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    print(f"Train: {X_train.shape}, Test: {X_test.shape}")
    print(f"scale_pos_weight: {scale_pos_weight:.2f}")

    # --- Train ---
    params = config["hyperparameters"].copy()
    params["scale_pos_weight"] = scale_pos_weight

    print("Training XGBoost model...")
    model = xgb.XGBClassifier(**params)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    # --- Evaluate ---
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("\n" + classification_report(y_test, y_pred))
    print(f"ROC AUC: {roc_auc_score(y_test, y_proba):.4f}")

    # --- Save model ---
    os.makedirs(TRAINED_MODEL_DIR, exist_ok=True)
    save_path = os.path.join(TRAINED_MODEL_DIR, config["trained_model_file"])
    joblib.dump(model, save_path)
    print(f"\nModel saved to: {save_path}")


if __name__ == "__main__":
    run_training()
