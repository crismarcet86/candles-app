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
  is_active: number;
  created_at: string;
}
