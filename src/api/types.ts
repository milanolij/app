export type Role = 'lifeguard' | 'pool' | 'admin';

export interface RegisterLifeguardPayload {
  email: string;
  wachtwoord: string;
  naam: string;
  telefoon: string;
  woonplaats: string;
}

export interface RegisterPoolPayload {
  email: string;
  wachtwoord: string;
  naam: string;
  telefoon: string;
  zwembad_naam: string;
  adres: string;
  max_diepte_m: number;
  oppervlakte_m2: number;
}

export interface LoginPayload {
  email: string;
  wachtwoord: string;
}

export interface SafeUser {
  id: string;
  email: string;
  role: Role;
  naam: string;
  telefoon: string;
  aangemaakt_op: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  user: SafeUser;
}

export type BrevetType = 'hoger_redder' | 'basisredder';
export type BrevetStatus = 'in_behandeling' | 'geverifieerd' | 'verlopen' | 'afgekeurd';
export type WeergaveStatus = 'geldig' | 'bijna_verlopen' | 'verlopen' | 'in_behandeling' | 'afgekeurd';

export interface Brevet {
  id: string;
  type: BrevetType;
  vervaldatum: string;
  status: BrevetStatus;
  weergave_status: WeergaveStatus;
  aangemaakt_op: string;
}

export type Weekday = 'ma' | 'di' | 'wo' | 'do' | 'vr' | 'za' | 'zo';

export interface LifeguardProfile {
  id: string;
  user_id: string;
  woonplaats: string;
  latitude: number;
  longitude: number;
  actiestraal_km: number;
  beschikbare_dagen: Weekday[];
  created_at: string;
  updated_at: string;
}

export interface UpdateAvailabilityPayload {
  actiestraal_km?: number;
  beschikbare_dagen?: Weekday[];
}

export type CallOutReason = 'tekort' | 'ziekte' | 'drukte' | 'anders';

export interface OpenCallOut {
  id: string;
  zwembad: string;
  afstand_km: number;
  start_tijd: string;
  eind_tijd: string;
  reden: CallOutReason;
  vereist_brevet_type: BrevetType;
}

export type CallOutStatus = 'open' | 'bevestigd' | 'geannuleerd' | 'verlopen';

export interface CallOut {
  id: string;
  pool_id: string;
  reden: CallOutReason;
  aantal_redders_nodig: number;
  vereist_brevet_type: BrevetType;
  start_tijd: string;
  eind_tijd: string;
  vergoeding: string;
  status: CallOutStatus;
  aangemaakt_op: string;
  updated_at: string;
}

export interface CallOutConfirmation {
  id: string;
  zwembad: string;
  adres: string;
  contactpersoon: string;
  telefoon: string;
  vergoeding: string;
  start_tijd: string;
  eind_tijd: string;
  reden: CallOutReason;
  status: CallOutStatus;
}

export interface CreateCallOutPayload {
  reden: CallOutReason;
  aantal_redders_nodig: number;
  vereist_brevet_type?: BrevetType;
  start_tijd: string;
  eind_tijd: string;
  vergoeding: number;
}

export interface CallOutPoolView {
  id: string;
  reden: CallOutReason;
  start_tijd: string;
  eind_tijd: string;
  vergoeding: string;
  status: CallOutStatus;
  redder: { naam: string; telefoon: string } | null;
}
