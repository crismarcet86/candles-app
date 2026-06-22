export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_abbr: string;
  subtotal: number;
}

export interface Order {
  id: number;
  proforma_id: number;
  client_id: number;
  client_name: string;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}
