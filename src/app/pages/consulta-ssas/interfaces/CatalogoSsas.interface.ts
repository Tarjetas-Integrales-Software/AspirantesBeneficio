export interface CatalogoSsas {
  response: number;
  message:  string;
  data:     Data;
}

export interface Data {
  modalidades_ssas:         SSA[];
  status_beneficiario_ssas: SSA[];
}

export interface SSA {
  pkOpcionGeneral: number;
  OpcionGeneral:   string;
  Valor:           string;
}
