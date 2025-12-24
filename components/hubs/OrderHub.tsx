import React, { useState } from 'react';
import MyCarts from '../MyCarts';
import AllOrders from '../AllOrders';
import Approvals from '../Approvals';
import PurchaseOrders from '../OrderManagement';
import Receiving from '../Receiving';
import CartDetail from '../CartDetail';
import ProductDashboard from '../ProductDashboard';
import { Cart, Order, Vendor, Product, Property, AdminUser, Role } from '../../types';
import { CartIcon, POIcon, ApprovalIcon, ReceivingIcon, ChevronRightIcon } from '../Icons';

interface OrderHubProps {
    // Data Props
    carts: Cart[];
    setCarts: React.Dispatch<React.SetStateAction<Cart[]>>;
    orders: Order[];
    vendors: Vendor[];
    products: Product[];
    properties: Property[];
    users: AdminUser[];
    availableCompanies: any[]; // Company[]
    currentCompanyId: string;
    currentUser: AdminUser | null;

    // View State Props
    view: 'list' | 'detail' | 'catalog';
    setView: (view: 'list' | 'detail' | 'catalog') => void;
    selectedCart: Cart | null;
    setSelectedCart: (cart: Cart | null) => void;
    activeCart: Cart | null;
    setActiveCart: (cart: Cart | null) => void;

    // Handlers
    onSelectOrder: (order: Order | null) => void;
    onProcureOrder: (order: Order) => void;
    onDeleteOrder: (orderId: string) => void;
    onUpdateOrderStatus: (orderId: string, status: any) => Promise<void>;
    onUpdatePoStatus: (orderId: string, poId: string, status: any, proofUrl?: string) => Promise<void>;

    // Cart Handlers
    onOpenCreateCartModal: () => void;
    onBulkSubmit: (cartIds: string[]) => Promise<void>;
    onDeleteCart: (cartId: string) => Promise<void>;
    onBulkDeleteCarts: (cartIds: string[]) => Promise<void>;
    onReuseCart: (cartId: string) => Promise<void>;
    onUpdateCartName: (cartId: string, name: string) => Promise<void>;
    onUpdateCartItem: (product: any, quantity: number, note?: string) => Promise<void>;
    onSubmitForApproval: (cartId: string) => Promise<void>;
    onRevertToDraft: (cartId: string) => Promise<void>;
    onOpenEditSchedule: (cart: Cart) => void;

    // Catalog Handlers
    onSwitchCompany?: (id: string) => void;
    onRefresh: () => void;
}

const OrderHub: React.FC<OrderHubProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'requests' | 'orders' | 'approvals' | 'fulfillment' | 'receiving'>('requests');

    // Helper to render the tab button
    const TabButton = ({ id, label, icon: Icon, count }: { id: typeof activeTab, label: string, icon: any, count?: number }) => (
        <button
            onClick={() => {
                setActiveTab(id);
            }}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all duration-300 rounded-t-lg ${activeTab === id
                ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs transition-colors ${activeTab === id
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    );

    const renderCombinedRequestsView = () => {
        if (props.view === 'detail' && props.selectedCart) {
            return (
                <CartDetail
                    cart={props.selectedCart}
                    onBack={() => props.setView('list')}
                    onOpenCatalog={() => props.setView('catalog')}
                    properties={props.properties}
                    products={props.products}
                    onUpdateCartName={props.onUpdateCartName}
                    onUpdateCartItem={(prod, qty, note) => props.onUpdateCartItem(prod, qty, note)}
                    onSubmitForApproval={props.onSubmitForApproval}
                    onRevertToDraft={props.onRevertToDraft}
                    onOpenEditSchedule={props.onOpenEditSchedule}
                    onManualAdd={(item) => props.onUpdateCartItem({ sku: item.sku, name: item.name, unitPrice: item.unitPrice }, item.quantity, item.note)}
                />
            );
        }
        if (props.view === 'catalog' && props.selectedCart) {
            return (
                <ProductDashboard
                    products={props.products}
                    companies={props.availableCompanies}
                    currentCompanyId={props.currentCompanyId}
                    activeCart={props.selectedCart}
                    onUpdateItem={(prod, qty, note) => props.onUpdateCartItem(prod, qty, note)}
                    onBack={() => props.setView('detail')}
                    onRefresh={props.onRefresh}
                />
            );
        }
        return (
            <MyCarts
                carts={props.carts}
                setCarts={props.setCarts}
                onSelectCart={(c) => {
                    const freshCart = props.carts.find(cart => cart.id === c.id) || c;
                    props.setSelectedCart(freshCart);
                    props.setView('detail');
                }}
                onOpenCreateCartModal={props.onOpenCreateCartModal}
                onBulkSubmit={props.onBulkSubmit}
                properties={props.properties}
                initialStatusFilter={'All'}
                orders={props.orders}
                onDeleteCart={props.onDeleteCart}
                onDeleteOrder={props.onDeleteOrder}
                onBulkDeleteCarts={props.onBulkDeleteCarts}
                onReuseCart={props.onReuseCart}
            />
        );
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Inner Hub Header */}
            <div className="flex flex-col border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/20 rounded-xl shadow-inner">
                            <CartIcon className="w-6 h-6 text-green-700 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight">Procurement Hub</h1>
                            <p className="text-xs text-muted-foreground font-medium">Manage requests, approvals, and fulfillment.</p>
                        </div>
                    </div>
                </div>

                <div className="flex overflow-x-auto px-6 hide-scrollbar gap-2">
                    <TabButton id="requests" label="Requests" icon={CartIcon} count={props.carts.filter(c => c.status !== 'Submitted').length} />
                    <TabButton id="orders" label="All Orders" icon={POIcon} count={props.orders.length} />
                    <TabButton id="approvals" label="Approvals" icon={ApprovalIcon} count={props.orders.filter(o => o.status === 'Pending My Approval' || o.status === 'Pending Others').length} />
                    <TabButton id="fulfillment" label="Fulfillment" icon={POIcon} />
                    <TabButton id="receiving" label="Receiving" icon={ReceivingIcon} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'requests' && renderCombinedRequestsView()}

                {activeTab === 'orders' && (
                    <AllOrders
                        orders={props.orders}
                        onProcureOrder={props.onProcureOrder}
                        onSelectOrder={props.onSelectOrder}
                        properties={props.properties}
                        onDeleteOrder={props.onDeleteOrder}
                        users={props.users}
                    />
                )}

                {activeTab === 'approvals' && (
                    <Approvals
                        orders={props.orders}
                        onUpdateOrderStatus={props.onUpdateOrderStatus}
                        onSelectOrder={props.onSelectOrder}
                        users={props.users}
                        properties={props.properties}
                    />
                )}

                {activeTab === 'fulfillment' && (
                    <PurchaseOrders
                        orders={props.orders}
                        vendors={props.vendors}
                        onSelectOrder={props.onSelectOrder}
                        properties={props.properties}
                    />
                )}

                {activeTab === 'receiving' && (
                    <Receiving
                        orders={props.orders}
                        vendors={props.vendors}
                        onUpdatePoStatus={props.onUpdatePoStatus}
                        onSelectOrder={props.onSelectOrder}
                    />
                )}
            </div>
        </div>
    );
};

export default OrderHub;
