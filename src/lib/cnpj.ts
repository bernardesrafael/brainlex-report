/**
 * Validates a CNPJ number using the check digit algorithm.
 * @param cnpj - Raw digits string (14 chars) or formatted CNPJ
 * @returns true if the CNPJ is valid
 */
export const validateCnpj = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;

  // Reject all-same-digit CNPJs
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // First check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const firstCheck = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[12]) !== firstCheck) return false;

  // Second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const secondCheck = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[13]) !== secondCheck) return false;

  return true;
};

export const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};
