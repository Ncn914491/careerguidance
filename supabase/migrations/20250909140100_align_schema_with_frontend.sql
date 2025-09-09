-- Migration to align schema with frontend requirements
-- This adds missing fields and creates the chats table as required

-- Add missing fields to weeks table
ALTER TABLE weeks 
ADD COLUMN pdf_url TEXT,
ADD COLUMN photos TEXT[] DEFAULT '{}';

-- Create the chats table as required by frontend (alias for group_messages)
-- We'll create a view called 'chats' that maps to group_messages with correct field names
CREATE VIEW chats AS
SELECT 
  id,
  group_id,
  sender_id as user_id,  -- Map sender_id to user_id as required
  message,
  created_at
FROM group_messages;

-- Enable RLS on the view (inherits from group_messages policies)
-- Note: Views inherit RLS from underlying tables

-- Also create an instead-of trigger for the view to handle inserts/updates/deletes
CREATE OR REPLACE FUNCTION chats_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_messages (group_id, sender_id, message)
  VALUES (NEW.group_id, NEW.user_id, NEW.message);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION chats_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_messages 
  SET 
    group_id = NEW.group_id,
    sender_id = NEW.user_id,
    message = NEW.message
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION chats_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM group_messages WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create instead-of triggers for the chats view
CREATE TRIGGER chats_insert_trigger
  INSTEAD OF INSERT ON chats
  FOR EACH ROW
  EXECUTE FUNCTION chats_insert();

CREATE TRIGGER chats_update_trigger
  INSTEAD OF UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION chats_update();

CREATE TRIGGER chats_delete_trigger
  INSTEAD OF DELETE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION chats_delete();

-- Create indexes for the new fields
CREATE INDEX idx_weeks_pdf_url ON weeks(pdf_url) WHERE pdf_url IS NOT NULL;
CREATE INDEX idx_weeks_photos ON weeks USING GIN(photos) WHERE photos IS NOT NULL AND array_length(photos, 1) > 0;

-- Success message
SELECT 'Schema alignment migration completed successfully!' as status;
