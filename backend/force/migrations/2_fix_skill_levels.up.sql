-- Ensure all existing skills have target levels between 1 and 5
UPDATE skill_assessments 
SET target_level = LEAST(5, GREATEST(1, target_level));

-- Update the constraint to ensure target levels are always 1-5
ALTER TABLE skill_assessments 
DROP CONSTRAINT IF EXISTS skill_assessments_target_level_check;

ALTER TABLE skill_assessments 
ADD CONSTRAINT skill_assessments_target_level_check 
CHECK (target_level >= 1 AND target_level <= 5);

-- Update the constraint for current levels as well
ALTER TABLE skill_assessments 
DROP CONSTRAINT IF EXISTS skill_assessments_current_level_check;

ALTER TABLE skill_assessments 
ADD CONSTRAINT skill_assessments_current_level_check 
CHECK (current_level >= 1 AND current_level <= 5);
