import React, { useState } from 'react';
import Properties from '../Properties';
import Reports from '../Reports';
import AdminSettings from '../AdminSettings';
import Integrations from '../Integrations';
import PaymentSettings from '../PaymentSettings';
// Types
import { Order, Vendor, Product, Property, Unit, AdminUser, Role, Company } from '../../types';
import { SettingsIcon, PropertiesIcon, DocumentReportIcon, IntegrationIcon } from '../Icons';

interface AdminHubProps {
    // Data
    orders: Order[];
    vendors: Vendor[];
    products: Product[];
    properties: Property[];
    units: Unit[];
    users: AdminUser[];
    roles: Role[];
    availableCompanies: Company[];
    currentUser: AdminUser | null;
    currentCompanyId: string;

    // Handlers
    onSelectOrder: (order: Order | null) => void;
    onAddProperty: (p: any) => Promise<void>;
    onDeleteProperty: (id: string) => Promise<void>;
    onAddUnit: (u: any) => Promise<void>;

    // Settings Handlers
    onAddRole: (r: any) => Promise<void>;
    onUpdateRole: (r: any) => Promise<void>;
    onDeleteRole: (id: string) => Promise<void>;
    onViewAsUser: (user: AdminUser | null) => void;
    onAddUser: (u: any) => Promise<void>;
    onAddCompany: (companyData: { name: string }, userData: { name: string; email: string; password: string; roleId: string }) => Promise<void>;
    onDeleteUser: (id: string) => Promise<void>;
    onUpdateProduct: (p: any) => Promise<void>;

    onSwitchCompany: (id: string) => void;
}

const AdminHub: React.FC<AdminHubProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'properties' | 'settings' | 'reports' | 'integrations' | 'payments'>('properties');

    // Helper to render the tab button
    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="flex flex-col border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/20 rounded-xl shadow-inner">
                            <SettingsIcon className="w-6 h-6 text-purple-700 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight">Management Hub</h1>
                            <p className="text-xs text-muted-foreground font-medium">System configuration and oversight.</p>
                        </div>
                    </div>
                </div>

                <div className="flex overflow-x-auto px-6 hide-scrollbar gap-2">
                    <TabButton id="properties" label="Properties" icon={PropertiesIcon} />
                    <TabButton id="reports" label="Reports" icon={DocumentReportIcon} />
                    <TabButton id="settings" label="Company Settings" icon={SettingsIcon} />
                    <TabButton id="payments" label="Payment Config" icon={SettingsIcon} />
                    <TabButton id="integrations" label="Integrations" icon={IntegrationIcon} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'properties' && (
                    <Properties
                        properties={props.properties}
                        units={props.units}
                        orders={props.orders}
                        users={props.users}
                        onSelectOrder={props.onSelectOrder}
                    />
                )}
                {activeTab === 'reports' && (
                    <Reports
                        orders={props.orders}
                        vendors={props.vendors}
                        products={props.products}
                    />
                )}
                {activeTab === 'settings' && (
                    <AdminSettings
                        vendors={props.vendors}
                        properties={props.properties}
                        units={props.units}
                        users={props.users}
                        roles={props.roles}
                        companies={props.availableCompanies}
                        currentUser={props.currentUser}
                        onAddProperty={props.onAddProperty}
                        onDeleteProperty={props.onDeleteProperty}
                        onAddUnit={props.onAddUnit}
                        onAddRole={props.onAddRole}
                        onUpdateRole={props.onUpdateRole}
                        onDeleteRole={props.onDeleteRole}
                        onViewAsUser={props.onViewAsUser}
                        onAddUser={props.onAddUser}
                        onAddCompany={props.onAddCompany}
                        onDeleteUser={props.onDeleteUser}
                        products={props.products}
                        onUpdateProduct={props.onUpdateProduct}
                    />
                )}
                {activeTab === 'payments' && (
                    <PaymentSettings
                        companyId={props.currentCompanyId}
                    />
                )}
                {activeTab === 'integrations' && (
                    <Integrations />
                )}
            </div>
        </div>
    );
};

export default AdminHub;
