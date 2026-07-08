<div align="center">

# IncomeIQ

### AI-Powered Income Prediction Platform

A production-ready Machine Learning application that predicts annual income using **Scikit-learn**, **Django REST Framework**, and a modern responsive frontend.

<p align="center">
<img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white">
<img src="https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django">
<img src="https://img.shields.io/badge/REST%20API-Django-red?style=flat-square">
<img src="https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=flat-square&logo=scikitlearn">
<img src="https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap">
<img src="https://img.shields.io/badge/License-MIT-black?style=flat-square">

</p>

</div>

---

# Preview

<p align="center">
<img src="screenshots/home.png" width="100%" alt="IncomeIQ Homepage">
</p>

---

## Overview

IncomeIQ is a full-stack Machine Learning web application that predicts whether an individual's annual income exceeds **$50K** based on demographic and employment information.

The application combines a trained **Scikit-learn Pipeline**, **Django REST Framework API**, and a premium frontend to provide real-time predictions, confidence scores, AI-generated insights, and prediction history.

It demonstrates the complete Machine Learning deployment workflow—from preprocessing and model training to REST API integration and frontend deployment.

---

## Features

- Machine Learning inference using Scikit-learn Pipeline
- Django REST Framework API
- Real-time predictions (AJAX)
- Probability estimation
- Prediction history
- AI Prediction Report
- Modern responsive interface
- Dark & Light theme
- Input validation
- Modular Django architecture

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| Machine Learning | Python, Scikit-learn, Pandas, NumPy, Joblib |
| Backend | Django, Django REST Framework |
| Database | SQLite |
| Frontend | HTML5, CSS3, JavaScript, Bootstrap 5 |
| Development | Git, GitHub, VS Code |

---

## Interface

### Home

<p align="center">
<img src="screenshots/home.png" width="95%">
</p>

---

### Prediction Result

<p align="center">
<img src="screenshots/prediction.png" width="95%">
</p>

---

### AI Prediction Report

<p align="center">
<img src="screenshots/report.png" width="95%">
</p>

---

### Prediction History

<p align="center">
<img src="screenshots/history.png" width="95%">
</p>

---

### REST API

<p align="center">
<img src="screenshots/api-post.png" width="95%">
</p>

---

## Architecture

```text
                    User
                      │
                      ▼
        Modern Frontend (HTML/CSS/JS)
                      │
              AJAX / Fetch API
                      │
                      ▼
      Django REST Framework Backend
                      │
                      ▼
               inference.py
                      │
                      ▼
      Trained ML Pipeline (.pkl)
                      │
                      ▼
     Prediction + Probability Score
                      │
                      ▼
        SQLite Prediction History
```

---

## Project Structure

```text
IncomeIQ/
│
├── artifacts/
│   └── income_pipeline.pkl
│
├── config/
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   │
│   └── templates/
│       └── frontend/
│           └── index.html
│
├── predictor/
│
├── inference.py
├── manage.py
├── requirements.txt
├── README.md
├── .env.example
└── screenshots/
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/IncomeIQ.git
```

Navigate into the project

```bash
cd IncomeIQ
```

Create a virtual environment

```bash
python -m venv venv
```

Activate it

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example`

```env
SECRET_KEY=your-secret-key
DEBUG=True
```

Run migrations

```bash
python manage.py migrate
```

Start the server

```bash
python manage.py runserver
```

Open

```
http://127.0.0.1:8000/
```

---

## API

### Predict Income

**POST**

```
/predictor/predict/
```

Example Response

```json
{
    "prediction": 1,
    "label": ">50K",
    "probability": 0.9904
}
```

---

### Prediction History

**GET**

```
/predictor/history/
```

Returns all previously generated predictions.

---

## Machine Learning Workflow

```text
Raw User Input
       │
       ▼
Input Validation
       │
       ▼
Feature Engineering
       │
       ▼
Scikit-learn Pipeline
       │
       ▼
Prediction
       │
       ▼
Probability Estimation
       │
       ▼
Store Prediction History
```

---

## Roadmap

- Docker Deployment
- PostgreSQL Support
- SHAP Explainability
- Batch Prediction
- User Authentication
- Cloud Deployment
- Model Monitoring
- PDF Export

---

## Author

**Kanishk Chahar**

B.Tech Computer Science Engineering

Machine Learning • Artificial Intelligence • Full Stack Development

GitHub: https://github.com/FANGER7

LinkedIn: https://linkedin.com/in/kanishk-chahar

---



<div align="center">

### If you found this project interesting, consider giving it a ⭐ on GitHub.

Built with Python • Django • Scikit-learn

</div>
