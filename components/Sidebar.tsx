
import React, { useMemo, useState, useEffect } from 'react';
import { NAVIGATION_DATA } from '../constants';
import { AdminUser, NavItem, Role, Company } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, ProcureProLogoIcon, BuildingOfficeIcon, LogoutIcon } from './Icons';
import { usePermissions } from '../contexts/PermissionsContext';
import { Permission } from '../types';
import { CustomSelect } from './ui/CustomSelect';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: AdminUser;
  roles: Role[];
  companies?: Company[];
  currentCompanyId?: string;
  companyName?: string;
  onSwitchCompany?: (companyId: string) => void;
  onLogout: () => void;
}

const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}> = ({ item, isActive, isCollapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <div className="relative group flex justify-center">
      <button
        onClick={onClick}
        className={`flex items-center w-full text-sm font-medium transition-all duration-200 rounded-xl ${isActive
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          } ${isCollapsed ? 'justify-center p-3' : 'py-3 px-4'}`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0`} />
        {!isCollapsed && (
          <span className="ml-3 whitespace-nowrap">{item.name}</span>
        )}
      </button>
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 border border-border">
          {item.name}
        </div>
      )}
    </div>
  );
};

// Map nav item names to their required 'view' permission
// IMPORTANT: Logic below handles 'view' vs 'view-own' fallback
const navItemPermissions: Record<string, Permission> = {
  'Dashboard': 'dashboard:view',
  'My Carts': 'carts:view',
  'Properties': 'properties:view',
  'Communications': 'communications:view',
  'All Orders': 'orders:view',
  'Approvals': 'approvals:view',
  'Purchase Orders': 'purchaseOrders:view',
  'Receiving': 'receiving:view',
  'Bills': 'transactions:view',
  'Bill Payments': 'transactions:view', // Renamed from Transactions
  'Reports': 'reports:view',
  'Suppliers': 'suppliers:view',
  'Invoices': 'orders:view', // Reuse orders permission for now
  'Property AR': 'suppliers:view', // Reuse suppliers permission for now
  'Integrations': 'integrations:view',
  'Company Settings': 'settings:view',
  'Payment Settings': 'settings:view',
  'Chart of Accounts': 'settings:view'
};

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, isCollapsed, onToggleCollapse, user, roles, companies, currentCompanyId, companyName, onSwitchCompany, onLogout }) => {
  const { can } = usePermissions();
  const userRole = roles?.find(r => r.id === user.roleId)?.name || 'User';
  const isOwner = user.roleId === 'role-0';

  // Avatar handling state
  const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl);

  useEffect(() => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&bold=true`;
    // If url is missing, empty, or a known flaky placeholder, use fallback immediately
    if (!user.avatarUrl || user.avatarUrl === '' || user.avatarUrl.includes('via.placeholder.com')) {
      setAvatarSrc(fallbackUrl);
    } else {
      setAvatarSrc(user.avatarUrl);
    }
  }, [user.avatarUrl, user.name]);

  const handleImageError = () => {
    setAvatarSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&bold=true`);
  };

  const accessibleNavData = useMemo(() => {
    return NAVIGATION_DATA.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const permission = navItemPermissions[item.name];
        if (!permission) return true; // No permission required

        // Check main permission (e.g., orders:view)
        if (can(permission)) return true;

        // Fallback: Check for 'view-own' permission if applicable
        if (permission === 'orders:view' && can('orders:view-own')) return true;
        if (permission === 'carts:view' && can('carts:view-own')) return true;

        return false;
      }),
    })).filter(section => section.items.length > 0);
  }, [can]);

  return (
    <aside className={`glass flex flex-col fixed top-4 bottom-4 left-4 transition-all duration-300 ease-in-out z-40 shadow-2xl rounded-2xl border-white/20 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className={`flex flex-col p-4 border-b border-border shrink-0 ${isCollapsed ? 'items-center' : ''}`}>
        <div className={`flex items-center justify-between w-full mb-4`}>
          <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <div className="bg-background p-2 rounded-lg shadow-inner border border-border">
              <ProcureProLogoIcon className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="font-bold text-lg text-foreground whitespace-nowrap tracking-tight drop-shadow-sm truncate max-w-[140px]" title={companyName || 'ProcurePro'}>
              {companyName || 'ProcurePro'}
            </h1>
          </div>
          <button
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:bg-accent p-2 rounded-lg transition-colors hover:text-accent-foreground"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Company Switcher for Owners */}
        {isOwner && companies && onSwitchCompany && !isCollapsed && (
          <div className="w-full mb-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Viewing Company</label>
            <div className="relative">
              <CustomSelect
                value={currentCompanyId || ''}
                onChange={(val) => onSwitchCompany(val)}
                icon={<BuildingOfficeIcon className="w-4 h-4" />}
                options={companies.map(c => ({ value: c.id, label: c.name }))}
                className="bg-background"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto px-3 py-6">
        <nav className="flex-1">
          {accessibleNavData.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 transition-all duration-200 ${isCollapsed ? 'hidden' : 'px-4'}`}>
                {section.title}
              </h2>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <NavButton
                      item={item}
                      isActive={activeItem === item.name}
                      isCollapsed={isCollapsed}
                      onClick={() => setActiveItem(item.name)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-transparent">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center overflow-hidden">
            <div className="relative flex-shrink-0">
              <img
                src={avatarSrc}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border-2 border-border object-cover bg-muted"
                onError={handleImageError}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-muted rounded-full"></div>
            </div>
            <div className={`ml-3 text-left whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              <p className="font-semibold text-sm text-foreground truncate max-w-[100px]">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[100px]">{userRole}</p>
            </div>
          </div>
          {!isCollapsed && (
            <button onClick={onLogout} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors" title="Log Out">
              <LogoutIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
