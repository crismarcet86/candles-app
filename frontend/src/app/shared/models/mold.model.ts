export interface Mold {
  id: number;
  name: string;
  wax_grams: number;
  total_grams: number | null;
  mold_type_id: number | null;
  mold_type_name: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
}
