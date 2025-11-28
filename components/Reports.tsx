import React, { useMemo } from 'react';
import { Order, Vendor, Product } from '../types';
import { DocumentReportIcon, TransactionIcon, SupplierIcon, CalendarIcon } from './Icons';

interface ReportsProps {
    orders: Order[];
    vendors: Vendor[];
    products: Product[];
}

const Reports: React.FC<ReportsProps> = ({ orders, vendors, products }) => {
    // --- Metrics Calculation ---
    const metrics = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        let totalSpendYTD = 0;
        let totalSpendAllTime = 0;
        let openOrdersCount = 0;
        let pendingApprovalsCount = 0;

        const spendByVendor: Record<string, number> = {};
        const spendByCategory: Record<string, number> = {};
        const monthlySpend: Record<string, number> = {};

        // Initialize last 6 months for chart
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toLocaleString('default', { month: 'short' });
            monthlySpend[key] = 0;
        }

        orders.forEach(order => {
            const orderDate = new Date(order.submissionDate);
            const orderYear = orderDate.getFullYear();
            const orderMonth = orderDate.getMonth();
            const cost = order.totalCost || 0;

            // Status Counts
            if (['Submitted', 'Processing', 'Shipped', 'Partially Received'].includes(order.status)) {
                openOrdersCount++;
            }
            if (['Pending My Approval', 'Pending Others'].includes(order.status)) {
                pendingApprovalsCount++;
            }

            // Financials (Only count Approved/Completed/Processing for spend to be realistic, or maybe just everything not rejected/draft)
            if (!['Draft', 'Rejected', 'Cancelled'].includes(order.status)) {
                totalSpendAllTime += cost;
                if (orderYear === currentYear) {
                    totalSpendYTD += cost;
                }

                // Monthly Spend (Last 6 Months)
                const monthDiff = (currentYear - orderYear) * 12 + (currentMonth - orderMonth);
                if (monthDiff >= 0 && monthDiff <= 5) {
                    const key = orderDate.toLocaleString('default', { month: 'short' });
                    if (monthlySpend[key] !== undefined) {
                        monthlySpend[key] += cost;
                    }
                }

                // Vendor Spend (approximate based on POs or items if POs missing)
                if (order.purchaseOrders && order.purchaseOrders.length > 0) {
                    order.purchaseOrders.forEach(po => {
                        const vendor = vendors.find(v => v.id === po.vendorId);
                        const vName = vendor?.name || 'Unknown Vendor';
                        const poCost = po.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
                        spendByVendor[vName] = (spendByVendor[vName] || 0) + poCost;
                    });
                } else {
                    // Fallback to item level vendor lookup
                    order.items.forEach(item => {
                        const product = products.find(p => p.sku === item.sku);
                        const vendor = vendors.find(v => v.id === product?.vendorId);
                        const vName = vendor?.name || 'Unknown Vendor';
                        spendByVendor[vName] = (spendByVendor[vName] || 0) + item.totalPrice;
                    });
                }

                // Category Spend
                order.items.forEach(item => {
                    const product = products.find(p => p.sku === item.sku);
                    const cat = product?.primaryCategory || 'Uncategorized';
                    spendByCategory[cat] = (spendByCategory[cat] || 0) + item.totalPrice;
                });
            }
        });

        return {
            totalSpendYTD,
            totalSpendAllTime,
            openOrdersCount,
            pendingApprovalsCount,
            spendByVendor: Object.entries(spendByVendor).sort((a, b) => b[1] - a[1]).slice(0, 5), // Top 5
            spendByCategory: Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5), // Top 5
            monthlySpend: Object.entries(monthlySpend) // Keep order from init
        };
    }, [orders, vendors, products]);

    const maxMonthlySpend = Math.max(...metrics.monthlySpend.map(([, val]) => val), 1);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground mt-1">Overview of your procurement performance and spending.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-background border border-input rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        This Year
                    </button>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <DocumentReportIcon className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TransactionIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">+12% vs last year</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spend (YTD)</p>
                    <h3 className="text-3xl font-bold text-foreground mt-1">${metrics.totalSpendYTD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <SupplierIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Open Orders</p>
                    <h3 className="text-3xl font-bold text-foreground mt-1">{metrics.openOrdersCount}</h3>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <DocumentReportIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                    <h3 className="text-3xl font-bold text-foreground mt-1">{metrics.pendingApprovalsCount}</h3>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <TransactionIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Lifetime Spend</p>
                    <h3 className="text-3xl font-bold text-foreground mt-1">${metrics.totalSpendAllTime.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Spend Chart */}
                <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-6">Monthly Spend Trend</h3>
                    <div className="h-64 flex items-end justify-between gap-4">
                        {metrics.monthlySpend.map(([month, value]) => {
                            const heightPercentage = (value / maxMonthlySpend) * 100;
                            return (
                                <div key={month} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-muted/50 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                        <div
                                            className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500 ease-out rounded-t-lg relative"
                                            style={{ height: `${heightPercentage}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                ${value.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">{month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Vendors */}
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-6">Top Vendors by Spend</h3>
                    <div className="space-y-5">
                        {metrics.spendByVendor.map(([vendor, amount], index) => (
                            <div key={vendor} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{vendor}</p>
                                        <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${(amount / (metrics.spendByVendor[0][1] || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-foreground">${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        ))}
                        {metrics.spendByVendor.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No vendor data available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6">Spend by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.spendByCategory.map(([category, amount]) => (
                        <div key={category} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
                            <p className="text-xl font-bold text-foreground">${amount.toLocaleString()}</p>
                        </div>
                    ))}
                    {metrics.spendByCategory.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">No category data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
