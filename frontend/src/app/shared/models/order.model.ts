export interface OrderItem {
  id: number;
  product_id: number | null;
  preset_id: number | null;
  is_service: number;
  product_name: string | null;
  description: string | null;
  quantity: number;
  returned_quantity: number;
  unit_price: number;
  unit_abbr: string | null;
  subtotal: number;
}

export interface Order {
  id: number;
  proforma_id: number;
  client_id: number;
  client_name: string;
  notes: string | null;
  delivery_date: string | null;
  delivery_status: 'pendiente' | 'entregado';
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}
