export interface Student {
  id: number;
  user_id: number;
  roll_number: string;
  department: string;
  class_name: string;
  phone: string | null;
  photo: string | null;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}
