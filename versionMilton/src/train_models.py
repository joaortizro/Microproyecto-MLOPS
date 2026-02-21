"""
Entrenamiento y evaluación de modelos con MLflow para predicción de reseñas negativas.
Los experimentos se registran en un servidor MLflow remoto en EC2.
"""

import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                             f1_score, roc_auc_score, confusion_matrix,
                             classification_report)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
import joblib
import warnings
warnings.filterwarnings('ignore')

# ============================================================
# CONFIGURACIÓN - MODIFICA ESTA IP CON LA IP PUBLICA
# ============================================================
MLFLOW_TRACKING_URI = "http://34.228.142.17:5000"  # <-- OJO IP DEL SERVIDOR Y PUERTO
EXPERIMENT_NAME = "olist-negative-reviews"
# ============================================================

def load_data():
    """Carga el dataset procesado."""
    df = pd.read_csv("data/processed/olist_model_dataset.csv")
    
    feature_cols = [c for c in df.columns if c != 'is_negative']
    X = df[feature_cols]
    y = df['is_negative']
    
    return X, y, feature_cols

def evaluate_model(model, X_test, y_test):
    """Evalúa el modelo y retorna métricas."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1_score': f1_score(y_test, y_pred),
        'roc_auc': roc_auc_score(y_test, y_prob),
    }
    
    print(f"  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1-Score:  {metrics['f1_score']:.4f}")
    print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['No negativa', 'Negativa'])}")
    
    return metrics, y_pred, y_prob

def train_and_log(model_name, model, X_train, X_test, y_train, y_test, 
                  feature_cols, params=None, use_smote=False):
    """Entrena un modelo y registra en MLflow."""
    
    with mlflow.start_run(run_name=model_name):
        # Log parameters
        if params:
            mlflow.log_params(params)
        mlflow.log_param("use_smote", use_smote)
        mlflow.log_param("n_features", len(feature_cols))
        mlflow.log_param("train_size", len(X_train))
        mlflow.log_param("test_size", len(X_test))
        
        # Aplicar SMOTE si se indica
        if use_smote:
            smote = SMOTE(random_state=42)
            X_train_fit, y_train_fit = smote.fit_resample(X_train, y_train)
            mlflow.log_param("train_size_after_smote", len(X_train_fit))
        else:
            X_train_fit, y_train_fit = X_train, y_train
        
        # Entrenar
        model.fit(X_train_fit, y_train_fit)
        
        # Evaluar
        metrics, y_pred, y_prob = evaluate_model(model, X_test, y_test)
        
        # Log metrics
        mlflow.log_metrics(metrics)
        
        # Log model
        mlflow.sklearn.log_model(model, "model")
        
        # Log feature names
        mlflow.log_param("features", str(feature_cols))
        
        print(f"\n✅ Run registrado en MLflow: {model_name}")
        
        return model, metrics


def main():
    # Conectar a MLflow
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    experiment = mlflow.set_experiment(EXPERIMENT_NAME)
    print(f"MLflow Experiment: {experiment.name}")
    
    # Cargar datos
    X, y, feature_cols = load_data()
    print(f"Dataset: {X.shape}, Target balance: {y.value_counts().to_dict()}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Escalar features
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), 
                                   columns=feature_cols, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), 
                                  columns=feature_cols, index=X_test.index)
    
    # ============================================================
    # MODELO 1: Logistic Regression (baseline)
    # ============================================================
    print("\n" + "="*60)
    print("MODELO 1: Logistic Regression (baseline)")
    print("="*60)
    
    lr_params = {'C': 1.0, 'max_iter': 1000, 'solver': 'lbfgs'}
    lr_model = LogisticRegression(**lr_params, random_state=42)
    
    train_and_log(
        "LogisticRegression_baseline", lr_model,
        X_train_scaled, X_test_scaled, y_train, y_test,
        feature_cols, params=lr_params, use_smote=False
    )
    
    # ============================================================
    # MODELO 2: Logistic Regression con SMOTE
    # ============================================================
    print("\n" + "="*60)
    print("MODELO 2: Logistic Regression + SMOTE")
    print("="*60)
    
    lr_model2 = LogisticRegression(**lr_params, random_state=42)
    
    train_and_log(
        "LogisticRegression_SMOTE", lr_model2,
        X_train_scaled, X_test_scaled, y_train, y_test,
        feature_cols, params=lr_params, use_smote=True
    )
    
    # ============================================================
    # MODELO 3: Random Forest
    # ============================================================
    print("\n" + "="*60)
    print("MODELO 3: Random Forest")
    print("="*60)
    
    rf_params = {'n_estimators': 200, 'max_depth': 15, 'min_samples_split': 10,
                 'min_samples_leaf': 5, 'class_weight': 'balanced'}
    rf_model = RandomForestClassifier(**rf_params, random_state=42, n_jobs=-1)
    
    train_and_log(
        "RandomForest_balanced", rf_model,
        X_train, X_test, y_train, y_test,
        feature_cols, params=rf_params, use_smote=False
    )
    
    # ============================================================
    # MODELO 4: Random Forest + SMOTE
    # ============================================================
    print("\n" + "="*60)
    print("MODELO 4: Random Forest + SMOTE")
    print("="*60)
    
    rf_params2 = {'n_estimators': 300, 'max_depth': 20, 'min_samples_split': 5,
                  'min_samples_leaf': 3}
    rf_model2 = RandomForestClassifier(**rf_params2, random_state=42, n_jobs=-1)
    
    train_and_log(
        "RandomForest_SMOTE", rf_model2,
        X_train, X_test, y_train, y_test,
        feature_cols, params=rf_params2, use_smote=True
    )
    
    # ============================================================
    # MODELO 5: Gradient Boosting
    # ============================================================
    print("\n" + "="*60)
    print("MODELO 5: Gradient Boosting")
    print("="*60)
    
    gb_params = {'n_estimators': 200, 'max_depth': 5, 'learning_rate': 0.1,
                 'subsample': 0.8, 'min_samples_leaf': 10}
    gb_model = GradientBoostingClassifier(**gb_params, random_state=42)
    
    train_and_log(
        "GradientBoosting", gb_model,
        X_train, X_test, y_train, y_test,
        feature_cols, params=gb_params, use_smote=False
    )
    
    # ============================================================
    # MODELO 6: Gradient Boosting + SMOTE
    # ============================================================
    print("\n" + "="*60)
    print("MODELO 6: Gradient Boosting + SMOTE")
    print("="*60)
    
    gb_params2 = {'n_estimators': 300, 'max_depth': 6, 'learning_rate': 0.05,
                  'subsample': 0.8, 'min_samples_leaf': 5}
    gb_model2 = GradientBoostingClassifier(**gb_params2, random_state=42)
    
    best_model, best_metrics = train_and_log(
        "GradientBoosting_SMOTE", gb_model2,
        X_train, X_test, y_train, y_test,
        feature_cols, params=gb_params2, use_smote=True
    )
    
    # ============================================================
    # Guardar el mejor modelo localmente (para la API y dashboard)
    # ============================================================
    # Después de ver los resultados en MLflow, selecciona cuál guardar.
    # Por ahora guardamos el Gradient Boosting + SMOTE
    joblib.dump(gb_model2, 'models/best_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(feature_cols, 'models/feature_cols.pkl')
    
    print("\n✅ Modelos guardados en carpeta models/")
    print("\n🔗 Revisa los resultados en MLflow: " + MLFLOW_TRACKING_URI)


if __name__ == "__main__":
    main()
