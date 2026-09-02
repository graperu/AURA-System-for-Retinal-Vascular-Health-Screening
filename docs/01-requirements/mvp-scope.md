# MVP scope

## Included

- Email and password registration and login
- Short-lived JWT access tokens and revocable refresh tokens
- `USER`, `DOCTOR`, and `ADMIN` roles
- User profile viewing and updating
- Validated single Fundus image upload to private storage
- Analysis jobs and mock AI predictions
- Risk level, confidence, findings, annotated-image reference, model version,
  and threshold version
- User analysis history
- Assigned-patient access for doctors
- Basic doctor reviews

## Excluded

Payment, subscriptions, chat, clinic dashboards, social login, realtime
notifications, batch upload, PDF/CSV export, mobile applications, direct camera
integration, and automated retraining are outside the MVP.

## Clinical boundary

AURA provides screening and decision support only. Mock or model output must not
be presented as a diagnosis or as a substitute for a physician.

