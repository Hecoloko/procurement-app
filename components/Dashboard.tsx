import React, { useMemo } from 'react';
import { ApprovalIcon, ShipmentIcon, CartIcon, CheckCircleIcon, PlusCircleIcon, POIcon, DocumentReportIcon } from './Icons';
import { usePermissions } from '../contexts/PermissionsContext';
import { Order, Cart } from '../types';

interface StatCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className="bg-card p-6 rounded-2xl border flex items-center space-x-4 transition-all duration-300 hover:bg-muted hover:scale-105 text-left w-full disabled:cursor-default disabled:hover:scale-100 shadow-lg">
        <div className="bg-green-500/20 p-3 rounded-full">
            <Icon className="w-6 h-6 text-green-400" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    </button>
);

interface ActionButtonProps {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className="bg-card hover:bg-muted active:scale-95 transition-all duration-200 p-6 rounded-2xl border flex flex-col items-center justify-center space-y-3 text-center w-full h-full shadow-lg">
        <div className="bg-background p-4 rounded-full border">
            <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground text-sm">{label}</span>
    </button>
);

interface DashboardProps {
    orders: Order[];
    carts: Cart[];
    onNavigateToApprovals: () => void;
    onNavigateToOrdersInTransit: () => void;
    onNavigateToCartsToSubmit: () => void;
    onNavigateToCompletedOrders: () => void;
    onNavigateToMyOrders: () => void;
    onOpenCreateCartModal: () => void;
    onGenerateReport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    orders,
    carts,
    onNavigateToApprovals,
    onNavigateToOrdersInTransit,
    onNavigateToCartsToSubmit,
    onNavigateToCompletedOrders,
    onNavigateToMyOrders,
    onOpenCreateCartModal,
    onGenerateReport,
}) => {
  const { can, user } = usePermissions();

  const statsData = useMemo(() => {
      const pendingApprovalsCount = orders.filter(o => o.status === 'Pending My Approval' || o.status === 'Pending Others').length;
      
      // Count total POs in transit across all orders
      const inTransitCount = orders.reduce((acc, o) => {
          const poInTransit = o.purchaseOrders ? o.purchaseOrders.filter(po => po.status === 'In Transit').length : 0;
          return acc + poInTransit;
      }, 0);

      const cartsToSubmitCount = carts.filter(c => c.status === 'Draft' || c.status === 'Ready for Review').length;
      
      // Completed in current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const completedCount = orders.filter(o => {
          if (o.status !== 'Completed') return false;
          const date = new Date(o.submissionDate);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length;

      return {
          pendingApprovals: pendingApprovalsCount,
          inTransit: inTransitCount,
          cartsToSubmit: cartsToSubmitCount,
          completed: completedCount
      };
  }, [orders, carts]);

  const stats = [
    { icon: ApprovalIcon, title: 'Pending Approvals', value: statsData.pendingApprovals.toString(), onClick: onNavigateToApprovals, permission: 'approvals:view' },
    { icon: ShipmentIcon, title: 'Orders In Transit', value: statsData.inTransit.toString(), onClick: onNavigateToOrdersInTransit, permission: 'purchaseOrders:view' },
    { icon: CartIcon, title: 'Carts to Submit', value: statsData.cartsToSubmit.toString(), onClick: onNavigateToCartsToSubmit, permission: 'carts:submit' },
    { icon: CheckCircleIcon, title: 'Completed This Month', value: statsData.completed.toString(), onClick: onNavigateToCompletedOrders, permission: 'orders:view' },
  ].filter(stat => can(stat.permission as any));

  const actions = [
      { icon: PlusCircleIcon, label: 'Create New Cart', onClick: onOpenCreateCartModal, permission: 'carts:create' },
      { icon: POIcon, label: 'View My Orders', onClick: onNavigateToMyOrders, permission: 'orders:view' },
      { icon: ApprovalIcon, label: 'Check Approvals', onClick: onNavigateToApprovals, permission: 'approvals:view' },
      { icon: DocumentReportIcon, label: 'Generate Report', onClick: onGenerateReport, permission: 'reports:view' },
  ].filter(action => can(action.permission as any));


  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome back, {user?.name}! Here's a summary of your procurement activities.</p>

      {/* Stats Section */}
      {stats.length > 0 && (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
            </div>
        </div>
      )}

      {/* Quick Actions Section */}
      {actions.length > 0 && (
        <div className="mt-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {actions.map(action => <ActionButton key={action.label} {...action} />)}
            </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;