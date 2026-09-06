ALTER TABLE screenings DROP CONSTRAINT IF EXISTS screenings_status_check;
ALTER TABLE screenings ADD CONSTRAINT screenings_status_check CHECK (status IN ('PENDING', 'ANALYZED', 'REVIEWED', 'FAILED'));
