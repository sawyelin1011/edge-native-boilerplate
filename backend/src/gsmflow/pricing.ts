import type { Role } from 'shared'

const roleDiscountPercent: Record<Role, number> = {
  USER: 0,
  RESELLER: -10,
  DISTRIBUTOR: -20,
  WEB_OWNER: -30,
  ADMIN: -50
}

export function calculateRolePrice(params: { apiPrice: number; role: Role }): number {
  const discount = roleDiscountPercent[params.role] ?? 0
  const raw = params.apiPrice * (1 + discount / 100)

  // Financial rounding: 2 decimals, deterministic
  return Math.round(raw * 100) / 100
}
