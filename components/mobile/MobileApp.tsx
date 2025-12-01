
import React, { useState, useMemo, useEffect } from 'react';
import { Order, Cart, Product, AdminUser, OrderStatus, CommunicationThread, Message, Property, CartType, ItemApprovalStatus, Vendor, Unit, Role, Company, PurchaseOrderStatus } from '../../types';
import MobileApprovals from './MobileApprovals';
import MobileCarts from './MobileCarts';
import MobileOrders from './MobileOrders';
import MobileCommunications from './MobileCommunications';
import AdminSettings from '../AdminSettings';
import Receiving from '../Receiving';
import Suppliers from '../Suppliers';
import Transactions from '../Transactions';
import PurchaseOrders from '../OrderManagement';
import ProcurementWorkspace from '../ProcurementWorkspace';
import { ApprovalIcon, CartIcon, POIcon, CommunicationIcon, PlusIcon, XMarkIcon, SearchIcon, PencilIcon, Bars3Icon, BuildingOfficeIcon, SettingsIcon, ShipmentIcon, TransactionIcon, SupplierIcon, LogoutIcon, CheckCircleIcon } from '../Icons';
import { Select } from '../../components/ui/Select';
import { usePermissions } from '../../contexts/PermissionsContext';

// --- NATIVE FEEL UTILS ---
const hapticFeedback = () => {
    if (navigator.vibrate) {
        navigator.vibrate(10); // Light tap
    }
};

// --- TOAST COMPONENT ---
const Toast: React.FC<{ message: string, type: 'success' | 'error', onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-safe-top mt-4 left-4 right-4 z-50 animate-slide-down">
            <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg backdrop-blur-md border ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {type === 'success' ? <CheckCircleIcon className="w-6 h-6 text-green-600" /> : <XMarkIcon className="w-6 h-6 text-red-600" />}
                <p className="font-medium text-sm">{message}</p>
            </div>
        </div>
    )
}

interface MobileAppProps {
    orders: Order[];
    carts: Cart[];
    products: Product[];
    users: AdminUser[];
    threads: CommunicationThread[];
    messages: Message[];
    properties: Property[];
    currentUser: AdminUser;
    activeCart: Cart | null;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onApprovalDecision: (orderId: string, itemDecisions: Map<string, { status: ItemApprovalStatus; reason?: string }>) => void;
    onUpdateCartItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
    onSendMessage: (threadId: string, content: string, taggedUserIds?: string[]) => void;
    onSelectCart: (cart: Cart | null) => void;
    onStartNewThread: (participantIds: string[]) => Promise<string>;
    onNewCart: (type: CartType) => void;

    // Extended props for full parity
    vendors: Vendor[];
    units: Unit[];
    roles: Role[];
    availableCompanies: Company[];
    currentCompanyId: string;
    companyName: string;
    onSwitchCompany: (companyId: string) => void;
    onAddProperty: (propertyData: { name: string }) => void;
    onAddUnit: (unitData: { propertyId: string; name: string }) => void;
    onAddUser: (userData: { name: string; email: string; roleId: string; propertyIds: string[] }) => void;
    onAddRole: (roleData: Omit<Role, 'id'>) => void;
    onUpdateRole: (roleData: Role) => void;
    onDeleteRole: (roleId: string) => void;
    onAddVendor: (vendorData: { name: string; phone?: string; email?: string }) => void;
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onAddVendorAccount: (vendorId: string, accountData: { propertyId: string, accountNumber: string }) => void;
    onUpdatePoStatus: (orderId: string, poId: string, newStatus: PurchaseOrderStatus, proofUrl?: string) => void;
    onProcureOrder: (order: Order) => void;
    onSelectOrder: (order: Order) => void; // Used for navigating to desktop order view
    onLogout: () => void;
    impersonatingUser: AdminUser | null;
    onImpersonate: (user: AdminUser | null) => void;
    onRefresh: () => void;
}

type MobileView = 'approvals' | 'carts' | 'orders' | 'messages' | 'more' | 'receiving' | 'suppliers' | 'settings' | 'transactions' | 'purchaseOrders' | 'procurement';

const MobileApp: React.FC<MobileAppProps> = (props) => {
    const [activeView, setActiveView] = useState<MobileView>('approvals');
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [cartView, setCartView] = useState<'list' | 'add_item' | 'manual_add'>('list');
    const [isInsideMessageView, setIsInsideMessageView] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [procurementOrder, setProcurementOrder] = useState<Order | null>(null);
    const { can } = usePermissions();

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        hapticFeedback();
    }

    // Handle tab change with haptics
    const handleTabChange = (view: MobileView) => {
        if (view !== activeView) {
            hapticFeedback();
            setActiveView(view);
            // Reset cart view on tab change
            if (view !== 'carts') setCartView('list');
        }
    };

    const handleProcureOrder = (order: Order) => {
        setProcurementOrder(order);
        setActiveView('procurement');
    };

    const NavButton: React.FC<{ view: MobileView, label: string, icon: React.FC<any>, permission?: string }> = ({ view, label, icon: Icon, permission }) => {
        const isActive = activeView === view || (view === 'more' && ['receiving', 'suppliers', 'settings', 'transactions', 'purchaseOrders', 'procurement'].includes(activeView));
        if (permission && !can(permission as any)) return null;

        return (
            <button
                onClick={() => handleTabChange(view)}
                className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-200 active:scale-95 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
            >
                <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50 translate-y-[-2px]' : ''} mb-0.5`}>
                    <Icon className={`w-6 h-6`} />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'opacity-100 font-semibold' : 'opacity-70'}`}>{label}</span>
            </button>
        )
    };

    const fabActions = useMemo(() => {
        if (activeView === 'carts' && props.activeCart && can('carts:edit-own')) {
            return [
                { label: 'Add from Catalog', icon: SearchIcon, action: () => { hapticFeedback(); setCartView('add_item'); setIsFabOpen(false); } },
                { label: 'Add Manually', icon: PencilIcon, action: () => { hapticFeedback(); setCartView('manual_add'); setIsFabOpen(false); } }
            ];
        }
        if (can('carts:create') && activeView === 'carts') {
            return [
                { label: 'New Cart', icon: CartIcon, action: () => { hapticFeedback(); props.onNewCart('Standard'); showToast('New cart created'); setActiveView('carts'); setIsFabOpen(false); } }
            ];
        }
        return [];
    }, [activeView, props.activeCart, props.onNewCart, can]);


    const renderContent = () => {
        switch (activeView) {
            case 'approvals':
                return <div className="animate-fade-in"><MobileApprovals
                    orders={props.orders}
                    users={props.users}
                    onUpdateOrderStatus={(id, status) => { props.onUpdateOrderStatus(id, status); showToast(`Order ${status}`); }}
                    onApprovalDecision={props.onApprovalDecision}
                    properties={props.properties}
                /></div>;
            case 'carts':
                return <div className="animate-fade-in"><MobileCarts
                    carts={props.carts}
                    products={props.products}
                    onUpdateCartItem={props.onUpdateCartItem}
                    activeCart={props.activeCart}
                    onSelectCart={props.onSelectCart}
                    view={cartView}
                    setView={setCartView}
                    onRefresh={props.onRefresh}
                    currentCompanyId={props.currentCompanyId}
                /></div>;
            case 'orders':
                return <div className="animate-fade-in"><MobileOrders
                    orders={props.orders}
                    properties={props.properties}
                    onProcure={handleProcureOrder}
                /></div>;
            case 'messages':
                return <div className="animate-fade-in"><MobileCommunications
                    threads={props.threads}
                    messages={props.messages}
                    users={props.users}
                    orders={props.orders}
                    currentUser={props.currentUser}
                    onSendMessage={props.onSendMessage}
                    onStartNewThread={props.onStartNewThread}
                    setIsInsideMessageView={setIsInsideMessageView}
                /></div>;
            case 'procurement':
                if (!procurementOrder) return null;
                return (
                    <div className="bg-gray-50 min-h-full -m-4 sm:-m-6 p-4 sm:p-6 text-gray-900 pb-32 animate-slide-in-right">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                            <button onClick={() => { hapticFeedback(); setActiveView('orders'); setProcurementOrder(null); }} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-100 border border-gray-200"><XMarkIcon className="w-6 h-6" /></button>
                            <h2 className="font-bold text-xl tracking-tight text-gray-900">Procure Order</h2>
                        </div>
                        <ProcurementWorkspace
                            order={procurementOrder}
                            vendors={props.vendors}
                            products={props.products}
                            onBack={(updated) => {
                                setActiveView('orders');
                                setProcurementOrder(null);
                                if (updated) props.onProcureOrder(updated);
                            }}
                            onOrderComplete={(updated) => {
                                props.onProcureOrder(updated);
                                showToast('Order Procured Successfully');
                                setActiveView('orders');
                                setProcurementOrder(null);
                            }}
                        />
                    </div>
                );
            case 'more':
                return (
                    <div className="pb-24 animate-slide-in-right">
                        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={props.currentUser.avatarUrl} className="w-16 h-16 rounded-full border-2 border-blue-100 shadow-sm" alt="Profile" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{props.currentUser.name}</h2>
                                    <p className="text-gray-500 text-sm font-medium">{props.roles?.find(r => r.id === props.currentUser.roleId)?.name}</p>
                                </div>
                            </div>
                            {/* Company Switcher */}
                            {props.availableCompanies.length > 1 && (
                                <div className="mb-6">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Current Company</label>
                                    <div className="relative">
                                        <Select
                                            value={props.currentCompanyId}
                                            onChange={(e) => { props.onSwitchCompany(e.target.value); showToast(`Switched to ${props.availableCompanies?.find(c => c.id === e.target.value)?.name}`); }}
                                            className="bg-gray-50 text-gray-900 border-gray-200 focus:ring-blue-500/50"
                                            icon={null}
                                        >
                                            {props.availableCompanies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </Select>
                                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                            <button onClick={() => { hapticFeedback(); props.onLogout(); }} className="w-full py-3 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 active:scale-[0.98] transition-all border border-red-100">
                                <LogoutIcon className="w-5 h-5" /> Log Out
                            </button>
                        </div>

                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 px-2 tracking-widest">Modules</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {can('receiving:view') && (
                                <button onClick={() => setActiveView('receiving')} className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm border border-gray-100 aspect-square">
                                    <div className="bg-cyan-50 p-4 rounded-full"><ShipmentIcon className="w-7 h-7 text-cyan-600" /></div>
                                    <span className="font-semibold text-gray-700 text-sm">Receiving</span>
                                </button>
                            )}
                            {can('purchaseOrders:view') && (
                                <button onClick={() => setActiveView('purchaseOrders')} className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm border border-gray-100 aspect-square">
                                    <div className="bg-blue-50 p-4 rounded-full"><POIcon className="w-7 h-7 text-blue-600" /></div>
                                    <span className="font-semibold text-gray-700 text-sm">Purchase Orders</span>
                                </button>
                            )}
                            {can('transactions:view') && (
                                <button onClick={() => setActiveView('transactions')} className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm border border-gray-100 aspect-square">
                                    <div className="bg-yellow-50 p-4 rounded-full"><TransactionIcon className="w-7 h-7 text-yellow-600" /></div>
                                    <span className="font-semibold text-gray-700 text-sm">Transactions</span>
                                </button>
                            )}
                            {can('suppliers:view') && (
                                <button onClick={() => setActiveView('suppliers')} className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm border border-gray-100 aspect-square">
                                    <div className="bg-purple-50 p-4 rounded-full"><SupplierIcon className="w-7 h-7 text-purple-600" /></div>
                                    <span className="font-semibold text-gray-700 text-sm">Suppliers</span>
                                </button>
                            )}
                            {can('settings:view') && (
                                <button onClick={() => setActiveView('settings')} className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm border border-gray-100 aspect-square">
                                    <div className="bg-gray-100 p-4 rounded-full"><SettingsIcon className="w-7 h-7 text-gray-500" /></div>
                                    <span className="font-semibold text-gray-700 text-sm">Company Settings</span>
                                </button>
                            )}
                        </div>
                    </div>
                );

            // --- WRAPPED DESKTOP COMPONENTS ---
            case 'settings':
                return (
                    <div className="bg-gray-50 min-h-full -m-4 sm:-m-6 p-4 sm:p-6 text-gray-900 pb-32 animate-slide-in-right">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                            <button onClick={() => { hapticFeedback(); setActiveView('more'); }} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-100 border border-gray-200"><XMarkIcon className="w-6 h-6" /></button>
                            <h2 className="font-bold text-xl tracking-tight">Settings</h2>
                        </div>
                        <AdminSettings
                            vendors={props.vendors}
                            properties={props.properties}
                            units={props.units}
                            users={props.users}
                            roles={props.roles}
                            currentUser={props.currentUser}
                            onAddProperty={props.onAddProperty}
                            onAddUnit={props.onAddUnit}
                            onAddRole={props.onAddRole}
                            onUpdateRole={props.onUpdateRole}
                            onDeleteRole={props.onDeleteRole}
                            onViewAsUser={props.onImpersonate}
                            onAddUser={props.onAddUser}
                            onDeleteUser={() => { }}
                            onDeleteProperty={() => { }}
                        />
                    </div>
                );
            case 'receiving':
                return (
                    <div className="bg-gray-50 min-h-full -m-4 sm:-m-6 p-4 sm:p-6 text-gray-900 pb-32 animate-slide-in-right">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                            <button onClick={() => { hapticFeedback(); setActiveView('more'); }} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-100 border border-gray-200"><XMarkIcon className="w-6 h-6" /></button>
                            <h2 className="font-bold text-xl tracking-tight">Receiving</h2>
                        </div>
                        <Receiving orders={props.orders} vendors={props.vendors} onUpdatePoStatus={props.onUpdatePoStatus} onSelectOrder={() => { }} />
                    </div>
                );
            case 'suppliers':
                return (
                    <div className="bg-gray-50 min-h-full -m-4 sm:-m-6 p-4 sm:p-6 text-gray-900 pb-32 animate-slide-in-right">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                            <button onClick={() => { hapticFeedback(); setActiveView('more'); }} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-100 border border-gray-200"><XMarkIcon className="w-6 h-6" /></button>
                            <h2 className="font-bold text-xl tracking-tight">Suppliers</h2>
                        </div>
                        <Suppliers
                            vendors={props.vendors}
                            products={props.products}
                            orders={props.orders}
                            properties={props.properties}
                            onSelectOrder={() => { }}
                            onAddVendor={props.onAddVendor}
                            onAddProduct={props.onAddProduct}
                            onAddVendorAccount={props.onAddVendorAccount}
                            companies={props.availableCompanies}
                            currentCompanyId={props.currentCompanyId}
                        />
                    </div>
                );
            case 'transactions':
                return (
                    <div className="bg-gray-50 min-h-full -m-4 sm:-m-6 p-4 sm:p-6 text-gray-900 pb-32 animate-slide-in-right">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                            <button onClick={() => { hapticFeedback(); setActiveView('more'); }} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-100 border border-gray-200"><XMarkIcon className="w-6 h-6" /></button>
                            <h2 className="font-bold text-xl tracking-tight">Transactions</h2>
                        </div>
                        <Transactions
                            orders={props.orders}
                            vendors={props.vendors}
                            onUpdatePoPaymentStatus={async (orderId, poId, status) => {
                                // Mobile implementation for payment status update - simplified for now
                                console.log('Update payment status:', orderId, poId, status);
                                showToast('Payment status updated');
                            }}
                        />
                    </div>
                );
            case 'purchaseOrders':
                return (
                    <div className="bg-gray-50 min-h-full -m-4 sm:-m-6 p-4 sm:p-6 text-gray-900 pb-32 animate-slide-in-right">
                        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                            <button onClick={() => { hapticFeedback(); setActiveView('more'); }} className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-100 border border-gray-200"><XMarkIcon className="w-6 h-6" /></button>
                            <h2 className="font-bold text-xl tracking-tight">Purchase Orders</h2>
                        </div>
                        <PurchaseOrders orders={props.orders} vendors={props.vendors} onSelectOrder={() => { }} properties={props.properties} />
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <>
            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
                .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                `}
            </style>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="fixed inset-0 bg-gray-50 text-gray-900 font-sans overflow-hidden flex flex-col">
                {/* Top Bar (only for non-wrapped views) */}
                {!['receiving', 'suppliers', 'settings', 'transactions', 'purchaseOrders', 'procurement'].includes(activeView) && !isInsideMessageView && (
                    <div className="px-6 pt-safe-top pb-2 flex justify-between items-center z-10 backdrop-blur-md bg-white/80 border-b border-gray-200 sticky top-0">
                        <h1 className="font-bold text-xl tracking-tight flex items-center gap-2 text-gray-900">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {props.companyName}
                        </h1>
                        {props.impersonatingUser && (
                            <button onClick={() => props.onImpersonate(null)} className="text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100">Stop Impersonating</button>
                        )}
                    </div>
                )}

                <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none relative z-0 scroll-smooth">
                    <div className="p-4 sm:p-6 min-h-full pb-safe-bottom">
                        {renderContent()}
                    </div>
                </main>

                {!isInsideMessageView && (
                    <>
                        {/* FAB Modal */}
                        {isFabOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in touch-none" onClick={() => setIsFabOpen(false)}>
                                <div className="absolute bottom-32 right-1/2 translate-x-1/2 w-full px-10 flex flex-col items-end gap-5 animate-slide-up">
                                    {fabActions.map((action, index) => (
                                        <div key={action.label} className="flex items-center justify-end gap-4 w-full">
                                            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg border border-gray-100">{action.label}</span>
                                            <button onClick={action.action} className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                                                <action.icon className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <footer className="fixed bottom-0 left-0 right-0 pb-safe-bottom bg-white border-t border-gray-200 z-50">
                            <div className="flex justify-around items-center h-[60px] px-2">
                                <div className="w-1/5"><NavButton view="approvals" label="Home" icon={ApprovalIcon} permission="approvals:view" /></div>
                                <div className="w-1/5"><NavButton view="carts" label="Carts" icon={CartIcon} permission="carts:view" /></div>

                                <div className="w-1/5 flex justify-center relative">
                                    {fabActions.length > 0 && (
                                        <button
                                            onClick={() => { hapticFeedback(); setIsFabOpen(!isFabOpen); }}
                                            className={`absolute -top-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-300 cubic-bezier(0.68, -0.55, 0.265, 1.55) transform ${isFabOpen ? 'rotate-[135deg] bg-gray-800 scale-90' : 'hover:scale-105 active:scale-95'} border-[4px] border-gray-50`}
                                        >
                                            <PlusIcon className="w-7 h-7" />
                                        </button>
                                    )}
                                </div>

                                <div className="w-1/5"><NavButton view="orders" label="Orders" icon={POIcon} permission="orders:view" /></div>
                                <div className="w-1/5"><NavButton view="more" label="Menu" icon={Bars3Icon} /></div>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </>
    );
};

export default MobileApp;
