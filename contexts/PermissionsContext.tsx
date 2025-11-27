import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { AdminUser, Role, Permission } from '../types';

interface PermissionsContextType {
  user: AdminUser | null;
  permissions: Set<Permission>;
  can: (permission: Permission) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  user: null,
  permissions: new Set(),
  can: () => false,
});

export const usePermissions = () => useContext(PermissionsContext);

interface PermissionsProviderProps {
  user: AdminUser;
  roles: Role[];
  children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ user, roles, children }) => {
  const permissions = useMemo(() => {
    const role = roles.find(r => r.id === user.roleId);
    return new Set(role?.permissions || []);
  }, [user, roles]);

  const can = (permission: Permission): boolean => {
    return permissions.has(permission);
  };

  const value = { user, permissions, can };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
