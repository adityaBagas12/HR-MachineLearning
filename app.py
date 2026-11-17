from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import joblib
import pandas as pd
import glob
import os

app = FastAPI(
    title="Employee Performance & Attrition Predictor API",
    description="REST API untuk memprediksi attrition dan performa karyawan menggunakan model Machine Learning",
    version="1.0.0"
)

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Muat model joblib secara dinamis
def load_ml_model():
    candidate_paths = [
        "model/model_kelompok_5.joblib",
        "model/model_kelompok_hr.joblib"
    ] + glob.glob("model/*.joblib")
    
    for path in candidate_paths:
        if os.path.exists(path):
            try:
                loaded = joblib.load(path)
                print(f"[INFO] Model berhasil dimuat dari: {path}")
                return loaded
            except Exception as e:
                print(f"[WARN] Gagal memuat model dari {path}: {e}")
    return None

model = load_ml_model()

# Schema Pydantic untuk validasi input JSON sesuai atribut dataset
class EmployeeData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    Age: int = Field(..., ge=18, le=70, description="Usia karyawan")
    BusinessTravel: str = Field(..., description="Tingkat perjalanan dinas")
    DailyRate: int = Field(..., ge=50, le=2500, description="Rate harian")
    Department: str = Field(..., description="Departemen")
    DistanceFromHome: int = Field(..., ge=1, le=50, description="Jarak kantor ke rumah (km)")
    Education: int = Field(..., ge=1, le=5, description="Tingkat pendidikan (1-5)")
    EducationField: str = Field(..., description="Bidang pendidikan")
    EnvironmentSatisfaction: int = Field(..., ge=1, le=4, description="Kepuasan lingkungan (1-4)")
    Gender: str = Field(..., description="Jenis kelamin")
    HourlyRate: int = Field(..., ge=20, le=150, description="Rate per jam")
    JobInvolvement: int = Field(..., ge=1, le=4, description="Keterlibatan kerja (1-4)")
    JobLevel: int = Field(..., ge=1, le=5, description="Level posisi kerja (1-5)")
    JobRole: str = Field(..., description="Posisi / jabatan")
    JobSatisfaction: int = Field(..., ge=1, le=4, description="Kepuasan kerja (1-4)")
    MaritalStatus: str = Field(..., description="Status pernikahan")
    MonthlyIncome: int = Field(..., ge=500, le=35000, description="Penghasilan bulanan")
    MonthlyRate: int = Field(..., ge=1000, le=40000, description="Rate bulanan")
    NumCompaniesWorked: int = Field(..., ge=0, le=15, description="Jumlah perusahaan terdahulu")
    OverTime: str = Field(..., description="Lembur (Yes/No)")
    PercentSalaryHike: int = Field(..., ge=0, le=50, description="Persentase kenaikan gaji")
    RelationshipSatisfaction: int = Field(..., ge=1, le=4, description="Kepuasan relasi kerja (1-4)")
    StockOptionLevel: int = Field(..., ge=0, le=3, description="Level opsi saham (0-3)")
    TotalWorkingYears: int = Field(..., ge=0, le=50, description="Total masa kerja (tahun)")
    TrainingTimesLastYear: int = Field(..., ge=0, le=15, description="Pelatihan tahun lalu")
    WorkLifeBalance: int = Field(..., ge=1, le=4, description="Work-Life Balance (1-4)")
    YearsAtCompany: int = Field(..., ge=0, le=50, description="Lama di perusahaan ini (tahun)")
    YearsInCurrentRole: int = Field(..., ge=0, le=30, description="Lama di peran saat ini (tahun)")
    YearsSinceLastPromotion: int = Field(..., ge=0, le=30, description="Tahun sejak promosi terakhir")
    YearsWithCurrManager: float = Field(..., ge=0.0, le=30.0, description="Tahun bersama manajer saat ini")


@app.get("/")
def serve_home():
    return FileResponse("static/index.html")


@app.get("/health")
def health_check():
    return {
        "status": "active",
        "model_loaded": model is not None,
        "model_type": str(type(model)) if model is not None else None
    }


@app.post("/predict")
def predict_attrition(data: EmployeeData):
    global model
    if model is None:
        model = load_ml_model()
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Model belum dimuat. Pastikan file joblib tersedia di folder model/."
            )

    try:
        # Konversi data input ke DataFrame
        input_dict = data.model_dump()
        input_df = pd.DataFrame([input_dict])

        # Prediksi menggunakan model pipeline
        raw_pred = model.predict(input_df)
        raw_proba = model.predict_proba(input_df)

        # Penanganan fleksibel untuk MultiOutputClassifier maupun Single-Output
        if isinstance(raw_proba, list) and len(raw_proba) >= 2:
            # MultiOutput: Target 0 = Attrition, Target 1 = PerformanceRating
            attrition_pred = int(raw_pred[0][0])
            prob_stay = round(float(raw_proba[0][0][0]) * 100, 2)
            prob_resign = round(float(raw_proba[0][0][1]) * 100, 2)
            attrition_confidence = prob_resign if attrition_pred == 1 else prob_stay

            perf_pred = int(raw_pred[0][1])
            perf_prob_3 = round(float(raw_proba[1][0][0]) * 100, 2)
            perf_prob_4 = round(float(raw_proba[1][0][1]) * 100, 2)
            perf_confidence = perf_prob_4 if perf_pred == 4 else perf_prob_3
        elif isinstance(raw_proba, list) and len(raw_proba) == 1:
            attrition_pred = int(raw_pred[0] if not hasattr(raw_pred[0], "__len__") else raw_pred[0][0])
            prob_stay = round(float(raw_proba[0][0][0]) * 100, 2)
            prob_resign = round(float(raw_proba[0][0][1]) * 100, 2)
            attrition_confidence = prob_resign if attrition_pred == 1 else prob_stay
            perf_pred = None
            perf_confidence = None
        else:
            attrition_pred = int(raw_pred[0])
            prob_stay = round(float(raw_proba[0][0]) * 100, 2)
            prob_resign = round(float(raw_proba[0][1]) * 100, 2)
            attrition_confidence = prob_resign if attrition_pred == 1 else prob_stay
            perf_pred = None
            perf_confidence = None

        result_label = "Yes (Potensi Resign)" if attrition_pred == 1 else "No (Bertahan)"
        message = (
            f"Karyawan diprediksi BERPOTENSI RESIGN dengan keyakinan {attrition_confidence}%."
            if attrition_pred == 1 else
            f"Karyawan diprediksi AKAN BERTAHAN dengan keyakinan {attrition_confidence}%."
        )

        response = {
            "prediction": attrition_pred,
            "result_label": result_label,
            "probability": attrition_confidence,
            "attrition_probability": prob_resign,
            "stay_probability": prob_stay,
            "attrition": "Yes" if attrition_pred == 1 else "No",
            "confidence": attrition_confidence,
            "message": message
        }

        if perf_pred is not None:
            response["performance_prediction"] = perf_pred
            response["performance_label"] = f"Rating {perf_pred} ({'Outstanding' if perf_pred == 4 else 'Excellent'})"
            response["performance_confidence"] = perf_confidence

        return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses prediksi: {str(e)}")
