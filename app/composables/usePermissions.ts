import { useAuthStore } from '~/stores/auth'

export const usePermissions = () => {
  const auth = useAuthStore()

  const can = (permission?: string | null) => {
    if (!permission) return true
    return auth.hasPermission(permission)
  }

  const canAny = (permissions?: string[] | null) => {
    if (!permissions || permissions.length === 0) return true
    return auth.hasAnyPermission(permissions)
  }

  const canAll = (permissions?: string[] | null) => {
    if (!permissions || permissions.length === 0) return true
    return auth.hasAllPermissions(permissions)
  }

  const filterByPermission = <T extends { permission?: string; permissions?: string[]; children?: T[] }>(items: T[]): T[] => {
    return items
      .map((item) => {
        const children = item.children ? filterByPermission(item.children) : undefined
        const allowed = can(item.permission) && canAny(item.permissions)
        if (!allowed && (!children || children.length === 0)) return null
        return { ...item, children }
      })
      .filter(Boolean) as T[]
  }

  return { can, canAny, canAll, filterByPermission }
}
