export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'user';
  is_active: number;
  created_at: string;
}

export interface AuthResponse {
  ok: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: ('admin' | 'user')[];
}
