export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(input: RegisterInput): string | null {
  if (!USERNAME_REGEX.test(input.username)) {
    return "El usuario debe tener entre 3 y 20 caracteres alfanuméricos.";
  }

  if (!EMAIL_REGEX.test(input.email.trim())) {
    return "El email no es válido.";
  }

  if (input.password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  return null;
}

export interface TournamentInput {
  theme: string;
  startsAt: string;
  entryFee?: number;
  coverImageUrl?: string | null;
}

export function validateTournamentInput(input: TournamentInput): string | null {
  const theme = input.theme.trim();

  if (theme.length < 2 || theme.length > 120) {
    return "La temática debe tener entre 2 y 120 caracteres.";
  }

  if (!input.startsAt || Number.isNaN(Date.parse(input.startsAt))) {
    return "La fecha y hora del torneo es obligatoria.";
  }

  if (
    input.entryFee !== undefined &&
    (!Number.isFinite(input.entryFee) || input.entryFee < 0)
  ) {
    return "La cuota de entrada no es válida.";
  }

  return null;
}

export function validateTeamName(teamName: string): string | null {
  const team = teamName.trim();

  if (team.length < 2 || team.length > 40) {
    return "El nombre del equipo debe tener entre 2 y 40 caracteres.";
  }

  return null;
}

export function validateScore(value: number): string | null {
  if (!Number.isInteger(value) || value < 0 || value > 99) {
    return "El marcador debe ser un entero entre 0 y 99.";
  }

  return null;
}
