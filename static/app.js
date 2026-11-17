// app.js - Enterprise Frontend Logic for Employee Retention & Performance Predictor

document.addEventListener('DOMContentLoaded', function() {
    // 1. Check API Health on Startup
    checkApiHealth();

    // 2. Setup Simulation Presets
    setupSimulationPresets();

    // 3. Form Submit Handler
    setupFormSubmit();
});

// Check API Health
async function checkApiHealth() {
    const statusPill = document.getElementById('systemStatus');
    const statusText = document.getElementById('statusText');

    try {
        const response = await fetch('/health');
        if (response.ok) {
            const data = await response.json();
            if (data.model_loaded) {
                statusPill.className = 'status-pill status-active';
                statusText.textContent = 'API & Model Online';
            } else {
                statusPill.className = 'status-pill status-error';
                statusText.textContent = 'Model Belum Dimuat';
            }
        } else {
            throw new Error();
        }
    } catch {
        statusPill.className = 'status-pill status-error';
        statusText.textContent = 'Server Offline';
    }
}

// Preset Simulator Buttons
function setupSimulationPresets() {
    const form = document.getElementById('predictionForm');
    const btnStay = document.getElementById('btnPresetStay');
    const btnRisk = document.getElementById('btnPresetRisk');
    const btnReset = document.getElementById('btnPresetReset');

    const defaultValues = {
        Age: 32,
        Gender: 'Male',
        MaritalStatus: 'Single',
        Education: 3,
        EducationField: 'Life Sciences',
        Department: 'Research & Development',
        JobRole: 'Research Scientist',
        JobLevel: 2,
        BusinessTravel: 'Travel_Rarely',
        OverTime: 'No',
        DistanceFromHome: 5,
        MonthlyIncome: 5200,
        DailyRate: 800,
        HourlyRate: 65,
        MonthlyRate: 14000,
        PercentSalaryHike: 14,
        StockOptionLevel: 1,
        TotalWorkingYears: 8,
        NumCompaniesWorked: 1,
        YearsAtCompany: 5,
        YearsInCurrentRole: 3,
        YearsSinceLastPromotion: 1,
        YearsWithCurrManager: 3.0,
        JobSatisfaction: 3,
        JobInvolvement: 3,
        EnvironmentSatisfaction: 3,
        RelationshipSatisfaction: 3,
        WorkLifeBalance: 3,
        TrainingTimesLastYear: 2
    };

    const highRiskValues = {
        Age: 25,
        Gender: 'Male',
        MaritalStatus: 'Single',
        Education: 2,
        EducationField: 'Technical Degree',
        Department: 'Sales',
        JobRole: 'Sales Representative',
        JobLevel: 1,
        BusinessTravel: 'Travel_Frequently',
        OverTime: 'Yes',
        DistanceFromHome: 25,
        MonthlyIncome: 2300,
        DailyRate: 400,
        HourlyRate: 35,
        MonthlyRate: 9000,
        PercentSalaryHike: 11,
        StockOptionLevel: 0,
        TotalWorkingYears: 2,
        NumCompaniesWorked: 4,
        YearsAtCompany: 1,
        YearsInCurrentRole: 0,
        YearsSinceLastPromotion: 0,
        YearsWithCurrManager: 0.5,
        JobSatisfaction: 1,
        JobInvolvement: 1,
        EnvironmentSatisfaction: 1,
        RelationshipSatisfaction: 1,
        WorkLifeBalance: 1,
        TrainingTimesLastYear: 0
    };

    const loyalValues = {
        Age: 42,
        Gender: 'Female',
        MaritalStatus: 'Married',
        Education: 4,
        EducationField: 'Life Sciences',
        Department: 'Research & Development',
        JobRole: 'Research Director',
        JobLevel: 4,
        BusinessTravel: 'Non-Travel',
        OverTime: 'No',
        DistanceFromHome: 2,
        MonthlyIncome: 16500,
        DailyRate: 1200,
        HourlyRate: 85,
        MonthlyRate: 24000,
        PercentSalaryHike: 19,
        StockOptionLevel: 2,
        TotalWorkingYears: 20,
        NumCompaniesWorked: 2,
        YearsAtCompany: 15,
        YearsInCurrentRole: 9,
        YearsSinceLastPromotion: 2,
        YearsWithCurrManager: 8.0,
        JobSatisfaction: 4,
        JobInvolvement: 4,
        EnvironmentSatisfaction: 4,
        RelationshipSatisfaction: 4,
        WorkLifeBalance: 4,
        TrainingTimesLastYear: 4
    };

    function applyValues(preset) {
        for (const [key, val] of Object.entries(preset)) {
            const el = form.elements[key];
            if (el) {
                el.value = val;
            }
        }
    }

    if (btnStay) btnStay.addEventListener('click', () => applyValues(loyalValues));
    if (btnRisk) btnRisk.addEventListener('click', () => applyValues(highRiskValues));
    if (btnReset) btnReset.addEventListener('click', () => applyValues(defaultValues));
}

// Form Submission & Inference
function setupFormSubmit() {
    const form = document.getElementById('predictionForm');
    const submitBtn = document.getElementById('submitBtn');
    const resultCard = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    const predictionBadge = document.getElementById('predictionBadge');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="spinner"></span>
            <span class="btn-text">Menjalankan Inferensi Pipeline ML...</span>
        `;
        resultCard.classList.add('hidden');

        // Extract and cast form values
        const formData = new FormData(this);
        const data = {};

        const floatFields = ['YearsWithCurrManager'];
        const intFields = [
            'Age', 'DailyRate', 'DistanceFromHome', 'Education',
            'EnvironmentSatisfaction', 'HourlyRate', 'JobInvolvement',
            'JobLevel', 'JobSatisfaction', 'MonthlyIncome', 'MonthlyRate',
            'NumCompaniesWorked', 'PercentSalaryHike', 'RelationshipSatisfaction',
            'StockOptionLevel', 'TotalWorkingYears', 'TrainingTimesLastYear',
            'WorkLifeBalance', 'YearsAtCompany', 'YearsInCurrentRole',
            'YearsSinceLastPromotion'
        ];

        for (const [key, value] of formData.entries()) {
            if (floatFields.includes(key)) {
                data[key] = parseFloat(value);
            } else if (intFields.includes(key)) {
                data[key] = parseInt(value, 10);
            } else {
                data[key] = value;
            }
        }

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Terjadi kesalahan pada backend API.');
            }

            const result = await response.json();

            // Interpret result
            const isAttrition = result.prediction === 1 || result.attrition === 'Yes';
            const confidence = result.confidence || result.probability || 0;
            const resignProb = result.attrition_probability !== undefined ? result.attrition_probability : (isAttrition ? confidence : (100 - confidence));
            const stayProb = result.stay_probability !== undefined ? result.stay_probability : (100 - resignProb);

            // Badge in header
            if (isAttrition) {
                predictionBadge.className = 'prediction-pill pill-resign';
                predictionBadge.innerHTML = '⚠️ Risiko Attrition: TINGGI (Resign)';
            } else {
                predictionBadge.className = 'prediction-pill pill-stay';
                predictionBadge.innerHTML = '✅ Status Retensi: LOYAL (Bertahan)';
            }

            // Performance string
            const perfRating = result.performance_prediction || 3;
            const perfLabel = result.performance_label || `Rating ${perfRating}`;
            const perfConf = result.performance_confidence || 80;

            // Render rich executive card
            resultContent.innerHTML = `
                <!-- Metrics Summary Cards -->
                <div class="metrics-grid">
                    <div class="metric-box">
                        <span class="metric-caption">Status Retensi Karyawan</span>
                        <div class="metric-value" style="color: ${isAttrition ? '#dc2626' : '#16a34a'}">
                            ${isAttrition ? 'Potensi Resign' : 'Bertahan (Loyal)'}
                        </div>
                        <span class="metric-sub">${isAttrition ? 'Perlu tindakan intervensi HR' : 'Tingkat kepuasan & stabilitas baik'}</span>
                    </div>

                    <div class="metric-box">
                        <span class="metric-caption">Keyakinan Prediksi Model</span>
                        <div class="metric-value" style="color: #2563eb;">
                            ${confidence}%
                        </div>
                        <span class="metric-sub">Berdasarkan probabilitas logistik ML</span>
                    </div>

                    <div class="metric-box">
                        <span class="metric-caption">Estimasi Rating Kinerja</span>
                        <div class="metric-value" style="color: #4f46e5;">
                            ${perfLabel}
                        </div>
                        <span class="metric-sub">Keyakinan estimasi: ${perfConf}%</span>
                    </div>
                </div>

                <!-- Probability Distribution Bars -->
                <div class="prob-section">
                    <div class="prob-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        Distribusi Probabilitas Model
                    </div>

                    <div class="prob-item">
                        <div class="prob-labels">
                            <span>Probabilitas Bertahan (Stay):</span>
                            <strong style="color: #059669;">${stayProb}%</strong>
                        </div>
                        <div class="bar-bg">
                            <div class="bar-fill bar-fill-stay" style="width: ${stayProb}%;"></div>
                        </div>
                    </div>

                    <div class="prob-item">
                        <div class="prob-labels">
                            <span>Probabilitas Resign (Attrition):</span>
                            <strong style="color: #dc2626;">${resignProb}%</strong>
                        </div>
                        <div class="bar-bg">
                            <div class="bar-fill bar-fill-resign" style="width: ${resignProb}%;"></div>
                        </div>
                    </div>
                </div>

                <!-- Executive Insight Note -->
                <div class="exec-note">
                    <strong>💡 Ringkasan Analisis Sistem:</strong>
                    <p style="margin-top: 4px;">${result.message}</p>
                </div>
            `;

            resultCard.classList.remove('hidden');
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            predictionBadge.className = 'prediction-pill pill-resign';
            predictionBadge.innerHTML = '❌ Terjadi Kesalahan';

            resultContent.innerHTML = `
                <div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b;">
                    <h3 style="margin-bottom: 6px;">Gagal Memproses Prediksi</h3>
                    <p style="font-size: 0.9rem;">${error.message}</p>
                </div>
            `;
            resultCard.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span class="btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <span class="btn-text">Jalankan Analisis & Prediksi Machine Learning</span>
            `;
        }
    });
}
