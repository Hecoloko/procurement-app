
import React, { useState, useEffect } from 'react';
import { AdminUser, Cart, Role } from '../types';
import { CartIcon, PlusCircleIcon } from './Icons';
import { usePermissions } from '../contexts/PermissionsContext';

interface HeaderProps {
  onQuickCartClick: () => void;
  onCartIconClick: () => void;
  user: AdminUser;
  activeCart?: Cart | null;
  roles: Role[];
}

const Header: React.FC<HeaderProps> = ({ onQuickCartClick, onCartIconClick, user, activeCart, roles }) => {
  const { can } = usePermissions();
  const cartItemCount = activeCart?.itemCount || 0;

  // Avatar handling state
  const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl);

  useEffect(() => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&bold=true`;
    if (!user.avatarUrl || user.avatarUrl === '' || user.avatarUrl.includes('via.placeholder.com')) {
      setAvatarSrc(fallbackUrl);
    } else {
      setAvatarSrc(user.avatarUrl);
    }
  }, [user.avatarUrl, user.name]);

  const handleImageError = () => {
    setAvatarSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&bold=true`);
  };

  return (
    <header className="glass border-b border-white/10 p-4 h-[68px] flex-shrink-0 z-30 mb-6 mx-6 rounded-2xl mt-4">
      <div className="flex items-center justify-end h-full">
        <div className="flex items-center space-x-4">
          {can('carts:create') && (
            <button
              onClick={onQuickCartClick}
              className="flex items-center bg-card hover:bg-muted text-foreground font-semibold py-2 px-4 rounded-lg border border-border shadow-sm transition-all duration-200 active:scale-95 text-sm"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Quick Cart
            </button>
          )}

          {can('carts:view-all') && (
            <button onClick={onCartIconClick} className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
              <CartIcon className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center space-x-3 pl-2 border-l border-border">
            <img
              src={avatarSrc}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover bg-muted"
              onError={handleImageError}
            />
            <div>
              <p className="font-semibold text-sm text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{roles?.find(r => r.id === user.roleId)?.name || 'User'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
