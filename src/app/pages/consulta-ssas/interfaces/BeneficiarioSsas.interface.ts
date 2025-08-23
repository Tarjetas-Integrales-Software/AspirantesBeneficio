export interface BeneficiarioSsas {
  status: number;
  data:   Data;
}

export interface Data {
  "48456": The48456;
}

export interface The48456 {
  identity: Identity;
  contact:  Contact;
  address:  Address;
  SSAS:     Ssas;
  students: Students;
  TISA:     Tisa;
}

export interface Ssas {
  fpu:                    number;
  modalidad_id:           number;
  vigencia:               string;
  passages:               null;
  status_beneficiario_id: number;
}

export interface Tisa {
  fecha_entrega: null;
  status_tisa:   null;
  uidcode:       null;
}

export interface Address {
  street:       string;
  ext:          string;
  int:          null;
  postal_code:  string;
  neighborhood: Neighborhood;
  city:         City;
  state:        City;
}

export interface City {
  id:   string;
  name: string;
}

export interface Neighborhood {
  id:   number;
  name: string;
}

export interface Contact {
  phone:     string;
  cellphone: string;
  email:     string;
}

export interface Identity {
  name:             string;
  paternal_surname: string;
  maternal_surname: string;
  birthdate:        Date;
  gender:           string;
}

export interface Students {
  scholarship: null;
  school:      null;
  grade:       null;
}
