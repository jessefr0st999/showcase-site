ALTER TABLE matches ADD live BOOLEAN;
ALTER TABLE matches ADD quarter VARCHAR(3);
ALTER TABLE matches ADD time VARCHAR(10);
UPDATE matches SET live = false;