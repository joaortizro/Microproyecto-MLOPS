import subprocess

experiments = [
    ["python", "train_model_a.py", "800", "6", "0.1", "xgboost-run"],
    ["python", "train_model_lgbm.py", "800", "6", "0.1", "lightgbm-run"],
    ["python", "train_model_RF.py", "200", "rf-run"],
]

for exp in experiments:
    print(f"\nRunning: {' '.join(exp)}\n")
    subprocess.run(exp, check=True)
