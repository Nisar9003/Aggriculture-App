/*
  # Smart Agriculture Management System Schema

  1. New Tables
    - `farms` - User farm information (6 acres total)
    - `crops` - Crop records with allocation, dates, and growth stages
    - `expenses` - Expense tracking (seeds, fertilizer, labor, irrigation, machinery)
    - `tasks` - Farming tasks and reminders (watering, fertilizer, pest control, harvest)
    - `field_images` - Field photo monitoring for growth comparison
    - `weather_alerts` - Auto-generated weather-based farming alerts

  2. Security
    - Enable RLS on all tables
    - Users can only access their own farm data

  3. Important Notes
    - Total farm size: 6 acres (fixed)
    - Crop types: Wheat, Rice, Maize, Mustard, Sesame
    - Growth stages: seed, growing, mature, harvest
    - All expenses in PKR (Pakistani Rupees)
    - Dates stored in UTC, displayed in local timezone
*/

CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_acres decimal(5,2) DEFAULT 6.00,
  location_lat decimal(10,8),
  location_lon decimal(11,8),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own farm"
  ON farms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own farm"
  ON farms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their farm"
  ON farms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_type text NOT NULL CHECK (crop_type IN ('Wheat', 'Rice', 'Maize', 'Mustard', 'Sesame')),
  acres_allocated decimal(5,2) NOT NULL,
  plantation_date date NOT NULL,
  expected_harvest_date date NOT NULL,
  growth_stage text NOT NULL DEFAULT 'seed' CHECK (growth_stage IN ('seed', 'growing', 'mature', 'harvest')),
  expected_yield_kg decimal(10,2),
  actual_yield_kg decimal(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their farm crops"
  ON crops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert crops in their farm"
  ON crops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their crops"
  ON crops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their crops"
  ON crops FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  expense_type text NOT NULL CHECK (expense_type IN ('seeds', 'fertilizer', 'labor', 'irrigation', 'machinery', 'other')),
  amount_pkr decimal(10,2) NOT NULL,
  description text,
  expense_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses for their crops"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crops
      JOIN farms ON farms.id = crops.farm_id
      WHERE crops.id = expenses.crop_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses for their crops"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crops
      JOIN farms ON farms.id = crops.farm_id
      WHERE crops.id = crop_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crops
      JOIN farms ON farms.id = crops.farm_id
      WHERE crops.id = expenses.crop_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id uuid REFERENCES crops(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('watering', 'fertilizer', 'pest_control', 'harvest', 'other')),
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their farm tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = tasks.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their farm"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = tasks.farm_id
      AND farms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = tasks.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = tasks.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS field_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_description text,
  growth_stage text NOT NULL,
  captured_date date NOT NULL,
  storage_path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE field_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images of their crops"
  ON field_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crops
      JOIN farms ON farms.id = crops.farm_id
      WHERE crops.id = field_images.crop_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload images for their crops"
  ON field_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crops
      JOIN farms ON farms.id = crops.farm_id
      WHERE crops.id = crop_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('rain', 'heat_wave', 'frost', 'wind', 'other')),
  title text NOT NULL,
  description text,
  recommended_action text,
  alert_date timestamptz DEFAULT now(),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their farm alerts"
  ON weather_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = weather_alerts.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alert status"
  ON weather_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = weather_alerts.farm_id
      AND farms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = weather_alerts.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE INDEX idx_crops_farm_id ON crops(farm_id);
CREATE INDEX idx_expenses_crop_id ON expenses(crop_id);
CREATE INDEX idx_tasks_farm_id ON tasks(farm_id);
CREATE INDEX idx_tasks_crop_id ON tasks(crop_id);
CREATE INDEX idx_field_images_crop_id ON field_images(crop_id);
CREATE INDEX idx_weather_alerts_farm_id ON weather_alerts(farm_id);
