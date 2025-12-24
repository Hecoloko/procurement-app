import React, { useState } from 'react';
import Transactions from '../Transactions';
import VendorInvoicesList from '../pages/accounts-payable/VendorInvoicesList'; // Bills
import InvoicesPage from '../pages/accounts-receivable/InvoicesPage';
import PropertyARList from '../pages/accounts-receivable/PropertyARList';
import ChartOfAccounts from '../ChartOfAccounts';
import Suppliers from '../Suppliers';
import Header from '../Header'; // Assuming we might need generic header components?
// Types
import { Order, Vendor, Account, Product, Customer, Property, Unit, AdminUser, PurchaseOrder } from '../../types';
import { TransactionIcon, DocumentReportIcon, SupplierIcon, PropertiesIcon } from '../Icons';

// Lazy load History
const InvoiceHistoryPage = React.lazy(() => import('../pages/accounts-receivable/InvoiceHistoryPage'));

interface FinanceHubProps {
    // Data
    orders: Order[];
    vendors: Vendor[];
    accounts: Account[];
    products: Product[];
    customers: Customer[];
    properties: Property[];
    units: Unit[];
    availableCompanies: any[];
    currentCompanyId: string;
    currentUser: AdminUser | null;

    // View State for sub-components (if any need lifting)
    invoicePreSelectedPropertyId: string | null;
    invoicePreSelectedUnitId: string | null;
    onClearPreSelectedProperty: () => void;
    onNavigateToPropertyInvoice: (propertyId: string, unitId?: string) => void;

    // Handlers
    onUpdatePoPaymentStatus: (orderId: string, poId: string, updates: any) => Promise<void>;
    onViewDetail_Bill: (inv: any) => void; // For VendorInvoicesList

    onAddAccount: (acc: any) => Promise<void>;
    onUpdateAccount: (acc: any) => Promise<void>;
    onDeleteAccount: (id: string) => Promise<void>;

    onSelectOrder: (order: Order | null) => void; // For Suppliers linking back to orders
    onSwitchCompany?: (id: string) => void;
    onAddVendor: (v: any) => Promise<void>;
    onAddProduct: (p: any) => Promise<void>;
    onAddVendorAccount: (vid: string, data: any) => Promise<void>;
}

const FinanceHub: React.FC<FinanceHubProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'payables' | 'receivables' | 'suppliers' | 'coa'>('payables');
    const [subTab, setSubTab] = useState<'bills' | 'payments' | 'invoices' | 'history' | 'property_ar'>('bills');

    // Helper to handle tab switching logic including default sub-tabs
    const handleMainTab = (tab: typeof activeTab, defaultSub?: typeof subTab) => {
        setActiveTab(tab);
        if (defaultSub) setSubTab(defaultSub);
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="flex flex-col border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/20 rounded-xl shadow-inner">
                            <DocumentReportIcon className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight">Financial Hub</h1>
                            <p className="text-xs text-muted-foreground font-medium">AP, AR, and Ledger Management.</p>
                        </div>
                    </div>
                </div>

                <div className="flex px-6 space-x-1">
                    <button onClick={() => handleMainTab('payables', 'bills')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'payables' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <TransactionIcon className="w-4 h-4" /> Payables
                    </button>
                    <button onClick={() => handleMainTab('receivables', 'invoices')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'receivables' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <DocumentReportIcon className="w-4 h-4" /> Receivables
                    </button>
                    <button onClick={() => handleMainTab('suppliers')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'suppliers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <SupplierIcon className="w-4 h-4" /> Suppliers
                    </button>
                    <button onClick={() => handleMainTab('coa')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'coa' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <DocumentReportIcon className="w-4 h-4" /> Chart of Accounts
                    </button>
                </div>
            </div>

            {/* Sub-Header / Secondary Nav for specific sections */}
            {activeTab === 'payables' && (
                <div className="bg-muted/30 px-6 py-2 flex gap-4 border-b border-border">
                    <button onClick={() => setSubTab('bills')} className={`text-xs font-bold px-3 py-1 rounded-full ${subTab === 'bills' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>Unpaid Bills</button>
                    <button onClick={() => setSubTab('payments')} className={`text-xs font-bold px-3 py-1 rounded-full ${subTab === 'payments' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>All Payments</button>
                </div>
            )}
            {activeTab === 'receivables' && (
                <div className="bg-muted/30 px-6 py-2 flex gap-4 border-b border-border">
                    <button onClick={() => setSubTab('invoices')} className={`text-xs font-bold px-3 py-1 rounded-full ${subTab === 'invoices' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>Invoices</button>
                    <button onClick={() => setSubTab('property_ar')} className={`text-xs font-bold px-3 py-1 rounded-full ${subTab === 'property_ar' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>Property AR Ledger</button>
                    <button onClick={() => setSubTab('history')} className={`text-xs font-bold px-3 py-1 rounded-full ${subTab === 'history' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>Tracking History</button>
                </div>
            )}

            {/* Content Content - Render based on Active Tabs */}
            <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'payables' && subTab === 'bills' && (
                    <VendorInvoicesList
                        companyId={props.currentCompanyId}
                        onViewDetail={props.onViewDetail_Bill}
                    />
                )}
                {activeTab === 'payables' && subTab === 'payments' && (
                    <Transactions
                        orders={props.orders}
                        vendors={props.vendors}
                        onUpdatePoPaymentStatus={props.onUpdatePoPaymentStatus}
                    />
                )}

                {activeTab === 'receivables' && subTab === 'invoices' && (
                    <InvoicesPage
                        currentCompanyId={props.currentCompanyId}
                        currentUser={props.currentUser}
                        products={props.products}
                        customers={props.customers}
                        properties={props.properties}
                        units={props.units}
                        preSelectedPropertyId={props.invoicePreSelectedPropertyId}
                        preSelectedUnitId={props.invoicePreSelectedUnitId}
                        onClearPreSelectedProperty={props.onClearPreSelectedProperty}
                    />
                )}
                {activeTab === 'receivables' && subTab === 'property_ar' && (
                    <PropertyARList
                        properties={props.properties}
                        units={props.units}
                        onSelectProperty={props.onNavigateToPropertyInvoice}
                        onSelectUnit={(pid, uid) => props.onNavigateToPropertyInvoice(pid, uid)}
                    />
                )}
                {activeTab === 'receivables' && subTab === 'history' && (
                    <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Invoice History...</div>}>
                        <InvoiceHistoryPage companyId={props.currentCompanyId} />
                    </React.Suspense>
                )}

                {activeTab === 'suppliers' && (
                    <Suppliers
                        vendors={props.vendors}
                        products={props.products}
                        orders={props.orders}
                        properties={props.properties}
                        companies={props.availableCompanies}
                        currentCompanyId={props.currentCompanyId}
                        onSwitchCompany={props.onSwitchCompany}
                        onSelectOrder={props.onSelectOrder}
                        onAddVendor={props.onAddVendor}
                        onAddProduct={props.onAddProduct}
                        onAddVendorAccount={props.onAddVendorAccount}
                    />
                )}

                {activeTab === 'coa' && (
                    <ChartOfAccounts
                        accounts={props.accounts}
                        onAddAccount={props.onAddAccount}
                        onUpdateAccount={props.onUpdateAccount}
                        onDeleteAccount={props.onDeleteAccount}
                    />
                )}
            </div>
        </div>
    );
};

export default FinanceHub;
