# inference.py
# Standalone inference module for the Adult Income classifier.
# Loaded by Assignment 04 Django view.

import joblib
import pandas as pd
import numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "artifacts" / "income_pipeline.pkl"

# Columns from adult.csv (Kaggle version) excluding the target 'income'
RAW_INPUT_COLUMNS = [
    "age", "workclass", "fnlwgt", "education", "education.num",
    "marital.status", "occupation", "relationship", "race", "sex",
    "capital.gain", "capital.loss", "hours.per.week", "native.country"
]

INCOME_LABELS = {0: "<=50K", 1: ">50K"}

_pipeline = None

def _load_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline

def _engineer_features(df):
    df = df.copy()
    df["age_group"] = pd.cut(df["age"],
        bins=[0, 30, 45, 60, 100],
        labels=["Young", "Mid-Career", "Senior", "Pre-Retirement"],
        right=True)
    df["hours_category"] = pd.cut(df["hours.per.week"],
        bins=[0, 34, 45, 60, 100],
        labels=["Part-Time", "Full-Time", "Overtime", "Extreme"],
        right=True)
    df["capital_net"] = df["capital.gain"] - df["capital.loss"]
    df["is_married"] = np.where(df["marital.status"].str.contains("Married"), 1, 0)
    education_map = {
        "Preschool":1,"1st-4th":2,"5th-6th":3,"7th-8th":4,"9th":5,
        "10th":6,"11th":7,"12th":8,"HS-grad":9,"Some-college":10,
        "Assoc-voc":11,"Assoc-acdm":12,"Bachelors":13,"Masters":14,
        "Prof-school":15,"Doctorate":16
    }
    df["education_level"] = df["education"].map(education_map)
    return df

def validate_input(data):
    """Validates input dict and returns DataFrame ready for pipeline. Raises ValueError on bad input."""
    missing = [c for c in RAW_INPUT_COLUMNS if c not in data]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    df = pd.DataFrame([data])
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
    return _engineer_features(df)

def predict(data):
    """
    Args: data (dict) with keys matching RAW_INPUT_COLUMNS
    Returns: dict with prediction (int), label (str), probability (float)
    Raises: ValueError if required fields missing
    """
    pipeline    = _load_pipeline()
    df          = validate_input(data)
    prediction  = int(pipeline.predict(df)[0])
    probability = float(pipeline.predict_proba(df)[0][1])
    return {
        "prediction":  prediction,
        "label":       INCOME_LABELS[prediction],
        "probability": round(probability, 4)
    }

if __name__ == "__main__":
    import time
    sample = {
        "age": 39, "workclass": "State-gov", "fnlwgt": 77516,
        "education": "Bachelors", "education.num": 13,
        "marital.status": "Never-married", "occupation": "Adm-clerical",
        "relationship": "Not-in-family", "race": "White", "sex": "Male",
        "capital.gain": 2174, "capital.loss": 0, "hours.per.week": 40,
        "native.country": "United-States"
    }
    t0 = time.time()
    print(predict(sample))
    print(f"Latency: {(time.time()-t0)*1000:.2f} ms")
