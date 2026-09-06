-- FR-3: per-category risk breakdown (Cardiovascular, Diabetic Retinopathy, Hypertension, Stroke)
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS cardiovascular_risk_score INT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS cardiovascular_risk_level VARCHAR(32);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS diabetic_retinopathy_risk_score INT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS diabetic_retinopathy_risk_level VARCHAR(32);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS hypertension_risk_score INT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS hypertension_risk_level VARCHAR(32);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS stroke_risk_score INT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS stroke_risk_level VARCHAR(32);

-- FR-3 / FR-4: retinal vascular biomarkers returned by the AI Core
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS av_ratio DOUBLE PRECISION;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS vessel_density_percent DOUBLE PRECISION;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS tortuosity_index DOUBLE PRECISION;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS vertical_cdr DOUBLE PRECISION;

-- FR-4: Grad-CAM heatmap overlay (base64 PNG returned by the AI Core)
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS heatmap_base64 TEXT;

-- FR-5: auto-generated health recommendations/warnings based on the computed risk level
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS recommendations TEXT;
