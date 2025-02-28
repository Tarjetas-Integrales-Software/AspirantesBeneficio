export interface Jalisco {
  response: boolean;
  data:     Datum[];
  message:  string;
  status:   number;
}

export interface Datum {
  id:                number;
  estado:            string;
  municipio:         string;
  ciudad:            string;
  cp:                string;
  colonia:           string;
  tipo_asentamiento: string;
  tipo_zona:         string;
  created_id:        null;
  updated_id:        null;
  deleted_id:        null;
  created_at:        null;
  updated_at:        null;
  deleted_at:        null;
}
