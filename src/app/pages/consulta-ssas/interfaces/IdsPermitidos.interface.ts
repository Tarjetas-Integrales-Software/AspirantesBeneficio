export interface IDSPermitidos {
  response: boolean;
  data:     Datum[];
  message:  string;
  status:   number;
}

export interface Datum {
  id:         number;
  clave:      string;
  valor:      string;
  created_at: null;
  updated_at: null;
  deleted_at: null;
  created_id: null;
  updated_id: null;
  deleted_id: null;
}
