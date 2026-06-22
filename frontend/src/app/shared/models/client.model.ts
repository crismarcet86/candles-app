export interface Client {
  id: number;
  name: string;
  cedula: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
}
