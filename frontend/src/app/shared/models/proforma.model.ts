export interface ProformaItem {
  id?: number;
  product_id?: number | null;
  product_name?: string;
  description?: string | null;
  quantity: number;
  unit_price?: number;
  unit_abbr?: string;
  subtotal?: number;
}

export interface Proforma {
  id: number;
  client_id: number;
  client_name: string;
  notes: string | null;
  delivery_date: string | null;
  discount: number;
  labor_cost: number;
  subtotal: number;
  total: number;
  status: 'borrador' | 'confirmada' | 'cancelada';
  created_at: string;
  items?: ProformaItem[];
}
