ALTER TABLE cases ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
UPDATE cases SET featured = 1 WHERE id IN ('case-001', 'case-002', 'case-003', 'case-005');
