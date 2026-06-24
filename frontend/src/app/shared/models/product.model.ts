export interface Product {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string;
  unit_id: number;
  unit_name: string;
  unit_abbr: string;
  price: number;
  stock: number;
  min_stock: number;
  image_path: string | null;
  image_url: string | null;
  is_active: number;
  is_fragrance: number;
  created_at: string;
}
