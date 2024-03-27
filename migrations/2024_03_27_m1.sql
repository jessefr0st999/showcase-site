ALTER TABLE matches ADD live BOOLEAN;
UPDATE matches SET live = false;