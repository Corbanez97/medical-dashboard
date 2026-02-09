export type Notice = {
  kind: "success" | "error" | "info";
  message: string;
};

export function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }
  return date.toLocaleString("pt-BR");
}

export function formatOptional(value: number | null | string): string {
  if (value === null || value === "") {
    return "-";
  }
  return String(value);
}

export function formatDecimal(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return "-";
  }
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateAge(dateOfBirth: string): number | null {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDelta = now.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function toTodayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseRequiredNumber(value: string, label: string): number {
  const parsed = Number(value.trim());
  if (value.trim() === "" || Number.isNaN(parsed)) {
    throw new Error(`Campo numérico obrigatório: ${label}`);
  }
  return parsed;
}

export function parseOptionalNumber(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error(`Campo numérico inválido: ${label}`);
  }
  return parsed;
}

export function parseOptionalInt(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Campo inteiro inválido: ${label}`);
  }
  return parsed;
}
