
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MyCarts from './components/MyCarts';
import CartDetail from './components/CartDetail';
import Approvals from './components/Approvals';
import AllOrders from './components/AllOrders';
import AdminSettings from './components/AdminSettings';
import ProcurementWorkspace from './components/ProcurementWorkspace';
import Receiving from './components/Receiving';
import Suppliers from './components/Suppliers';
import Transactions from './components/Transactions';
import PurchaseOrders from './components/OrderManagement';
import ChartOfAccounts from './components/ChartOfAccounts';
import Reports from './components/Reports';
import OrderDetailsDrawer from './components/OrderDetailsDrawer';
import QuickCartModal from './components/QuickCartModal';
import CreateCartFlowModal from './components/CreateCartFlowModal';
import Properties from './components/Properties';
import Integrations from './components/Integrations';
import PaymentSettings from './components/PaymentSettings';
import PropertyARList from './components/pages/accounts-receivable/PropertyARList';
import InvoicesPage from './components/pages/accounts-receivable/InvoicesPage';
import VendorInvoicesList from './components/pages/accounts-payable/VendorInvoicesList';
import VendorInvoiceDetailModal from './components/pages/accounts-payable/VendorInvoiceDetailModal';
import InvoiceTrackingList from './components/pages/accounts-receivable/InvoiceTrackingList';
import InvoicePaymentPage from './components/pages/public/InvoicePaymentPage';
const InvoiceHistoryPage = React.lazy(() => import('./components/pages/accounts-receivable/InvoiceHistoryPage'));

import { Cart, Product, Order, OrderStatus, Vendor, Property, Unit, AdminUser, CommunicationThread, Message, CartType, CartItem, ItemApprovalStatus, Role, PurchaseOrder, Company, Account, Customer } from './types';
import ProductDashboard from './components/ProductDashboard';
import CommunicationCenter from './components/CommunicationCenter';
import { DUMMY_THREADS, DUMMY_MESSAGES, DUMMY_ROLES } from './constants';
import EditScheduleModal from './components/EditScheduleModal';
import Header from './components/Header';
import GlobalCartDrawer from './components/GlobalCartDrawer';
import MobileApp from './components/mobile/MobileApp';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { supabase, getCurrentProfile, createDefaultProfile, supabaseUrl, supabaseKey } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import Auth from './components/Auth';
import { ProcureProLogoIcon, RefreshIcon } from './components/Icons';
import { useTheme } from './hooks/useTheme';
import { processPayment } from './services/paymentService';

// ... (Helper functions remain same)
const safeNumber = (val: any): number => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
};

const mapCartItem = (dbItem: any): CartItem => {
    if (!dbItem) return {} as CartItem;
    const qty = safeNumber(dbItem.quantity);
    const unitPrice = safeNumber(dbItem.unit_price);
    let totalPrice = safeNumber(dbItem.total_price);
    if (totalPrice === 0 && qty > 0 && unitPrice > 0) {
        totalPrice = qty * unitPrice;
    }

    return {
        id: dbItem.id,
        name: dbItem.name,
        sku: dbItem.sku,
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        note: dbItem.note,
        approvalStatus: dbItem.approval_status,
        rejectionReason: dbItem.rejection_reason
    };
};

const mapCart = (dbCart: any): Cart => ({
    id: dbCart.id,
    companyId: dbCart.company_id,
    workOrderId: dbCart.work_order_id || dbCart.id, // Fallback for old carts without work_order_id
    name: dbCart.name,
    type: dbCart.type,
    status: dbCart.status,
    itemCount: safeNumber(dbCart.item_count),
    totalCost: safeNumber(dbCart.total_cost),
    propertyId: dbCart.property_id,
    lastModified: dbCart.last_modified || new Date().toISOString(),
    category: dbCart.category,
    scheduledDate: dbCart.scheduled_date,
    frequency: dbCart.frequency,
    startDate: dbCart.start_date,
    dayOfWeek: dbCart.day_of_week,
    dayOfMonth: dbCart.day_of_month,
    lastRunAt: dbCart.last_run_at,
    items: dbCart.cart_items ? dbCart.cart_items.map(mapCartItem) : []
});

const mapProduct = (dbProd: any): Product => ({
    id: dbProd.id,
    companyId: dbProd.company_id,
    name: dbProd.name,
    sku: dbProd.sku,
    description: dbProd.description,
    unitPrice: safeNumber(dbProd.unit_price),
    imageUrl: dbProd.image_url,
    vendorId: dbProd.vendor_id,
    primaryCategory: dbProd.primary_category,
    secondaryCategory: dbProd.secondary_category,
    rating: dbProd.rating,
    tags: dbProd.tags || []
});

const mapVendor = (dbVendor: any): Vendor => ({
    id: dbVendor.id,
    companyId: dbVendor.company_id,
    name: dbVendor.name,
    phone: dbVendor.phone,
    email: dbVendor.email,
    accounts: (dbVendor.vendor_accounts || []).map((acc: any) => ({
        id: acc.id,
        propertyId: acc.property_id,
        accountNumber: acc.account_number
    }))
});

const mapCustomer = (dbCustomer: any): Customer => {
    if (!dbCustomer) return {} as Customer;
    return {
        ...dbCustomer,
        id: dbCustomer.id,
        companyId: dbCustomer.company_id,
        name: dbCustomer.name,
        email: dbCustomer.email,
        phone: dbCustomer.phone,
        billingAddress: dbCustomer.billing_address,
        shippingAddress: dbCustomer.shipping_address,
        taxId: dbCustomer.tax_id,
        paymentTerms: dbCustomer.payment_terms
    };
};

const mapOrder = (dbOrder: any, products: Product[]): Order => {
    if (!dbOrder) return {} as Order;
    let items: CartItem[] = [];
    if (dbOrder.cart && dbOrder.cart.cart_items) {
        items = dbOrder.cart.cart_items.filter(Boolean).map(mapCartItem);
    }
    let totalCost = safeNumber(dbOrder.total_cost);
    const calculatedTotalFromItems = items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (items.length > 0 && calculatedTotalFromItems > 0) {
        totalCost = calculatedTotalFromItems;
    }

    const purchaseOrders: PurchaseOrder[] = (dbOrder.purchase_orders || []).map((dbPO: any) => {
        const poItems = items.filter(item => {
            const product = products.find(p => p.sku === item.sku);
            return product?.vendorId === dbPO.vendor_id;
        });
        return {
            id: dbPO.id,
            originalOrderId: dbOrder.id,
            vendorId: dbPO.vendor_id,
            items: poItems,
            status: dbPO.status,
            eta: dbPO.eta,
            deliveryProofUrl: dbPO.delivery_proof_url,
            carrier: dbPO.carrier,
            trackingNumber: dbPO.tracking_number,
            vendorConfirmationNumber: dbPO.vendor_confirmation_number,
            invoiceNumber: dbPO.invoice_number,
            invoiceUrl: dbPO.invoice_url,
            paymentStatus: dbPO.payment_status,
            invoiceDate: dbPO.invoice_date,
            dueDate: dbPO.due_date,
            paymentDate: dbPO.payment_date,
            paymentMethod: dbPO.payment_method,
            amountDue: safeNumber(dbPO.amount_due),
            statusHistory: []
        };
    });

    return {
        id: dbOrder.id,
        companyId: dbOrder.company_id,
        cartId: dbOrder.cart_id,
        cartName: dbOrder.cart_name || 'Untitled Order',
        submittedBy: dbOrder.submitted_by,
        submissionDate: new Date(dbOrder.submission_date || dbOrder.created_at).toLocaleDateString(),
        totalCost: totalCost,
        status: dbOrder.status,
        type: dbOrder.type || 'Standard',
        itemCount: dbOrder.item_count || items.length,
        propertyId: dbOrder.property_id,
        threadId: dbOrder.thread_id,
        items: items,
        statusHistory: (dbOrder.order_status_history || []).map((h: any) => ({ status: h.status, date: h.date })),
        purchaseOrders: purchaseOrders
    };
};

const mapThread = (dbThread: any): CommunicationThread => ({
    id: dbThread.id,
    companyId: dbThread.company_id,
    subject: dbThread.subject,
    orderId: dbThread.order_id,
    participantIds: dbThread.participant_ids || [],
    lastMessageTimestamp: dbThread.last_message_at || dbThread.created_at,
    lastMessageSnippet: dbThread.last_message_snippet,
    isRead: dbThread.is_read
});

const mapMessage = (dbMsg: any): Message => ({
    id: dbMsg.id,
    threadId: dbMsg.thread_id,
    senderId: dbMsg.sender_id,
    content: dbMsg.content,
    timestamp: dbMsg.timestamp,
    taggedUserIds: dbMsg.tagged_user_ids || []
});

export const App: React.FC = () => {
    useTheme();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [dataError, setDataError] = useState<string | null>(null);
    const lastUserIdRef = React.useRef<string | undefined>(undefined);

    const [userProfile, setUserProfile] = useState<AdminUser | null>(null);
    const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
    const [viewingCompanyId, setViewingCompanyId] = useState<string | null>(null);
    const [invoicePreSelectedPropertyId, setInvoicePreSelectedPropertyId] = useState<string | null>(null);
    const [invoicePreSelectedUnitId, setInvoicePreSelectedUnitId] = useState<string | null>(null);
    const [currentCompanyName, setCurrentCompanyName] = useState<string>('ProcurePro');

    const [carts, setCarts] = useState<Cart[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>(DUMMY_ROLES);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [threads, setThreads] = useState<CommunicationThread[]>(DUMMY_THREADS);
    const [messages, setMessages] = useState<Message[]>(DUMMY_MESSAGES);

    const [activeItem, setActiveItem] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
    const [view, setView] = useState<'list' | 'detail' | 'catalog'>('list');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [impersonatingUser, setImpersonatingUser] = useState<AdminUser | null>(null);
    const [orderForProcurement, setOrderForProcurement] = useState<Order | null>(null);
    const [isQuickCartModalOpen, setIsQuickCartModalOpen] = useState(false);
    const [isCreateCartModalOpen, setIsCreateCartModalOpen] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
    const [cartForScheduleEdit, setCartForScheduleEdit] = useState<Cart | null>(null);
    const [activeCart, setActiveCart] = useState<Cart | null>(null);
    const [selectedVendorInvoice, setSelectedVendorInvoice] = useState<any>(null); // Placeholder type for now, used in future
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Initial Session Check
        const initSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.warn("Session check error:", error.message);
                if (error.message.includes("Refresh Token")) {
                    await supabase.auth.signOut(); // Force clear stale data
                }
                setSession(null);
                setLoading(false);
                return;
            }

            setSession(session);
            if (session) {
                fetchInitialData(session);
            } else {
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            // Only trigger full data fetch if the user has actually changed.
            // This prevents re-loading on 'TOKEN_REFRESHED' or window focus (SIGNED_IN) events when the user is the same.
            const newUserId = newSession?.user?.id;

            if (newUserId === lastUserIdRef.current) {
                // User is the same, just update the session for token rotation but don't blocking-load
                setSession(newSession);
                return;
            }

            lastUserIdRef.current = newUserId;
            setSession(newSession);

            if (newSession) {
                fetchInitialData(newSession);
            } else {
                // Logout case
                setSession(null);
                setCarts([]);
                setOrders([]);
                setViewingCompanyId(null);
                setCurrentCompanyName('ProcurePro');
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
    };

    const processRecurringCarts = async (cartsToProcess: Cart[], userCompanyId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        let hasUpdates = false;

        for (const cart of cartsToProcess) {
            if (cart.type === 'Standard') continue;

            let shouldRun = false;
            const lastRun = cart.lastRunAt ? new Date(cart.lastRunAt) : null;
            if (lastRun) lastRun.setHours(0, 0, 0, 0);
            if (lastRun && lastRun.getTime() === todayTime) continue;

            if (cart.type === 'Scheduled' && cart.scheduledDate) {
                const [y, m, d] = cart.scheduledDate.split('-').map(Number);
                const schedDate = new Date(y, m - 1, d);
                schedDate.setHours(0, 0, 0, 0);
                if (todayTime >= schedDate.getTime() && !cart.lastRunAt) shouldRun = true;
            } else if (cart.type === 'Recurring') {
                if (cart.frequency === 'Weekly' && cart.dayOfWeek !== undefined && today.getDay() === cart.dayOfWeek) shouldRun = true;
                if (cart.frequency === 'Monthly' && cart.dayOfMonth !== undefined && today.getDate() === cart.dayOfMonth) shouldRun = true;
                if (cart.frequency === 'Bi-weekly' && cart.startDate && cart.dayOfWeek !== undefined && today.getDay() === cart.dayOfWeek) {
                    const [sy, sm, sd] = cart.startDate.split('-').map(Number);
                    const startDateObj = new Date(sy, sm - 1, sd);
                    startDateObj.setHours(0, 0, 0, 0);
                    const diffTime = Math.abs(todayTime - startDateObj.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if ((diffDays / 7) % 2 === 0) shouldRun = true;
                }
                if (cart.frequency === 'Quarterly' && cart.startDate && cart.dayOfMonth !== undefined && today.getDate() === cart.dayOfMonth) {
                    const [sy, sm] = cart.startDate.split('-').map(Number);
                    const monthDiff = today.getMonth() - (sm - 1) + (12 * (today.getFullYear() - sy));
                    if (monthDiff % 3 === 0 && monthDiff >= 0) shouldRun = true;
                }
            }

            if (shouldRun) {
                hasUpdates = true;
                const newCartId = `cart-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const newCartName = `${cart.name} - ${today.toLocaleDateString()}`;

                const dbPayload = {
                    id: newCartId,
                    company_id: userCompanyId,
                    name: newCartName,
                    type: 'Standard',
                    status: 'Draft',
                    property_id: cart.propertyId,
                    created_by: session?.user?.id,
                    total_cost: cart.totalCost,
                    item_count: cart.itemCount
                };

                await supabase.from('carts').insert(dbPayload);

                if (cart.items && cart.items.length > 0) {
                    const itemsPayload = cart.items.map(item => ({
                        cart_id: newCartId,
                        name: item.name,
                        sku: item.sku,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        note: item.note
                    }));
                    await supabase.from('cart_items').insert(itemsPayload);
                }

                await supabase.from('carts').update({ last_run_at: new Date().toISOString() }).eq('id', cart.id);
            }
        }
        return hasUpdates;
    };

    const fetchInitialData = async (currentSession: any = session) => {
        setLoading(true);
        setLoadingProgress(5);
        setDataError(null);

        const loadData = async () => {
            // Clear existing data to prevent stale state during switch
            setCarts([]);
            setOrders([]);
            setProducts([]);
            setVendors([]);
            setProperties([]);
            setUnits([]);
            setAccounts([]);
            let profile = await getCurrentProfile();
            setLoadingProgress(10);

            if (!profile) {
                try {
                    profile = await createDefaultProfile();
                } catch (createErr: any) {
                    console.error("Failed to create default profile", createErr);
                    // If we can't create a profile, we can't proceed.
                    throw new Error("Failed to setup user profile.");
                }
            }
            setLoadingProgress(15);

            if (!profile) throw new Error("No profile found.");

            // Map and set the current user profile immediately
            const mappedProfile: AdminUser = {
                id: profile.id,
                companyId: profile.company_id,
                name: profile.full_name || profile.email?.split('@')[0] || 'User',
                email: profile.email || currentSession.user.email || '',
                roleId: profile.role_id || 'role-2',
                propertyIds: profile.property_ids || [],
                avatarUrl: profile.avatar_url || 'https://via.placeholder.com/150',
                status: profile.status === 'Inactive' ? 'Inactive' : 'Active'
            };
            setUserProfile(mappedProfile);

            const isOwner = profile.role_id === 'role-0';
            let targetCompanyId = viewingCompanyId || profile.company_id;

            if (isOwner) {
                const { data: companiesData } = await supabase.from('companies').select('*');
                if (companiesData) {
                    setAvailableCompanies(companiesData);
                    if (!targetCompanyId && companiesData.length > 0) {
                        targetCompanyId = companiesData[0].id;
                        setViewingCompanyId(targetCompanyId);
                    }
                }
            }
            setLoadingProgress(20);

            if (!targetCompanyId) {
                // If no company, we can't load data.
                return;
            }

            console.log("DEBUG: Fetching data for company:", targetCompanyId);

            const { data: companyData } = await supabase.from('companies').select('name').eq('id', targetCompanyId).single();
            if (companyData) {
                setCurrentCompanyName(companyData.name);
            } else {
                setCurrentCompanyName('ProcurePro');
            }

            const requests = [
                supabase.from('carts').select('*, cart_items(*)').eq('company_id', targetCompanyId).order('created_at', { ascending: false }).limit(100),
                supabase.from('orders').select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)').eq('company_id', targetCompanyId).order('created_at', { ascending: false }).limit(100),
                supabase.from('products').select('*').eq('company_id', targetCompanyId).limit(500),
                supabase.from('vendors').select('*, vendor_accounts(*)').eq('company_id', targetCompanyId),
                supabase.from('properties').select('*').eq('company_id', targetCompanyId),
                supabase.from('profiles').select('*').eq('company_id', targetCompanyId),
                supabase.from('roles').select('*'),
                supabase.from('units').select('*'),
                supabase.from('communication_threads').select('*').eq('company_id', targetCompanyId).limit(100),
                supabase.from('messages').select('*').limit(500),
                supabase.from('accounts').select('*').eq('company_id', targetCompanyId),
                supabase.from('product_vendors').select('*'),
                supabase.from('customers').select('*').eq('company_id', targetCompanyId).order('name')
            ];

            let completedCount = 0;
            const totalRequests = requests.length;
            const baseProgress = 25;
            const remainingProgress = 75;

            const trackedPromises = requests.map(req =>
                req.then(res => {
                    completedCount++;
                    const currentProgress = baseProgress + Math.round((completedCount / totalRequests) * remainingProgress);
                    setLoadingProgress(currentProgress);
                    return res;
                })
            );

            const [
                cartsData,
                ordersData,
                productsData,
                vendorsData,
                propsData,
                usersData,
                rolesData,
                unitsData,
                threadsData,
                messagesData,
                accountsData,
                productVendorsData,
                customersData
            ] = await Promise.all(trackedPromises);

            if (cartsData.error) throw cartsData.error;
            if (ordersData.error) throw ordersData.error;

            const mappedProducts = (productsData.data || []).map(mapProduct);

            if (productVendorsData && productVendorsData.data) {
                const vendorMap = new Map((vendorsData.data || []).map((v: any) => [v.id, v.name]));
                mappedProducts.forEach(p => {
                    const options = productVendorsData.data
                        .filter((pv: any) => pv.product_id === p.id)
                        .map((pv: any) => ({
                            id: pv.id,
                            vendorId: pv.vendor_id,
                            vendorName: vendorMap.get(pv.vendor_id) || 'Unknown Vendor',
                            vendorSku: pv.vendor_sku,
                            price: safeNumber(pv.price),
                            isPreferred: pv.is_preferred
                        }));
                    p.vendorOptions = options;
                });
            }

            setProducts(mappedProducts);
            console.log("DEBUG: Products loaded:", mappedProducts.length);

            if (cartsData.data) {
                const mappedCarts = cartsData.data.map(mapCart);
                setCarts(mappedCarts);

                try {
                    const hasNewGeneratedCarts = await processRecurringCarts(mappedCarts, targetCompanyId);
                    if (hasNewGeneratedCarts) {
                        const { data: refreshedCarts } = await supabase.from('carts').select('*, cart_items(*)').eq('company_id', targetCompanyId).order('created_at', { ascending: false }).limit(100);
                        if (refreshedCarts) {
                            const remappedCarts = refreshedCarts.map(mapCart);
                            setCarts(remappedCarts);
                            if (!activeCart && remappedCarts.length > 0) {
                                const draft = remappedCarts.find(c => c.status === 'Draft');
                                if (draft) setActiveCart(draft);
                            }
                        }
                    }
                } catch (recurringErr) {
                    console.error("Error processing recurring carts:", recurringErr);
                    // Don't block the app load for this
                }

                // Fallback if no recurring update or error
                if ((!activeCart || activeCart.companyId !== targetCompanyId) && mappedCarts.length > 0) {
                    const draft = mappedCarts.find(c => c.status === 'Draft');
                    if (draft) setActiveCart(draft);
                    else setActiveCart(null);
                } else if (mappedCarts.length === 0) {
                    setActiveCart(null);
                }
            }
            if (ordersData.data) {
                setOrders(ordersData.data.map((o: any) => mapOrder(o, mappedProducts)));
            }
            setVendors((vendorsData.data || []).map(mapVendor));

            setProperties((propsData.data || []).map((p: any) => ({ id: p.id, companyId: p.company_id, name: p.name, address: p.address })));

            if (unitsData.data) {
                const validPropIds = new Set((propsData.data || []).map((p: any) => p.id));
                const filteredUnits = unitsData.data.filter((u: any) => validPropIds.has(u.property_id));
                setUnits(filteredUnits.map((u: any) => ({ id: u.id, propertyId: u.property_id, name: u.name })));
            }

            if (threadsData.data) setThreads(threadsData.data.map(mapThread));
            if (messagesData.data) setMessages(messagesData.data.map(mapMessage));

            if (rolesData.data) setRoles(rolesData.data as Role[]);

            if (accountsData.data) {
                setAccounts(accountsData.data.map((acc: any) => ({
                    id: acc.id,
                    companyId: acc.company_id,
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    subtype: acc.subtype,
                    isActive: acc.is_active,
                    balance: acc.balance
                })));
            }

            if (customersData.data) {
                setCustomers(customersData.data.map(mapCustomer));
            }

            if (usersData.data) {
                const mappedUsers: AdminUser[] = usersData.data.map((p: any) => {
                    let finalName = p.full_name;
                    if (p.role_id === 'role-0') {
                        finalName = 'Procure Pro Owner';
                    }
                    else {
                        if (!finalName || finalName.trim() === '') {
                            finalName = p.email ? p.email.split('@')[0] : 'New User';
                        }
                    }

                    return {
                        id: p.id,
                        companyId: p.company_id,
                        name: finalName,
                        email: p.email || '',
                        roleId: p.role_id || 'role-2',
                        propertyIds: p.property_ids || [],
                        avatarUrl: p.avatar_url || 'https://via.placeholder.com/150',
                        status: p.status === 'Inactive' ? 'Inactive' : 'Active'
                    };
                });
                setUsers(mappedUsers);
            }
            setLoadingProgress(100);
        };

        // Safety timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Data fetch timed out')), 30000)
        );

        try {
            await Promise.race([loadData(), timeoutPromise]);
        } catch (error: any) {
            console.error("Error fetching data:", error);

            let msg = error.message || "Database sync error.";
            if (msg.includes("timed out")) msg = "Connection timed out. Please check your internet.";

            setDataError(msg);

            // If critical session error, potentially sign out
            if (msg.includes("Refresh Token")) {
                await supabase.auth.signOut();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async (account: Omit<Account, 'id'>) => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;
        if (!targetCompany) return;

        const id = `acc-${Date.now()}`;
        const payload = {
            id,
            company_id: targetCompany,
            code: account.code,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            is_active: account.isActive
        };

        const { data: newAcc } = await supabase.from('accounts').insert(payload).select().single();
        if (newAcc) {
            setAccounts(prev => [...prev, {
                id: newAcc.id,
                companyId: newAcc.company_id,
                code: newAcc.code,
                name: newAcc.name,
                type: newAcc.type,
                subtype: newAcc.subtype,
                isActive: newAcc.is_active
            }]);
        }
    };

    const handleUpdateAccount = async (account: Account) => {
        const payload = {
            code: account.code,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            is_active: account.isActive
        };

        const { data: updatedAcc } = await supabase.from('accounts').update(payload).eq('id', account.id).select().single();
        if (updatedAcc) {
            setAccounts(prev => prev.map(a => a.id === account.id ? {
                ...a,
                code: updatedAcc.code,
                name: updatedAcc.name,
                type: updatedAcc.type,
                subtype: updatedAcc.subtype,
                isActive: updatedAcc.is_active
            } : a));
        }
    };

    const handleDeleteAccount = async (accountId: string) => {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
        await supabase.from('accounts').delete().eq('id', accountId);
    };

    const handleSwitchCompany = (newCompanyId: string) => {
        setViewingCompanyId(newCompanyId);
        setLoading(true);
    };

    useEffect(() => {
        if (viewingCompanyId && session) {
            fetchInitialData(session);
        }
    }, [viewingCompanyId]);

    const handleAddCart = async (cartType: CartType = 'Standard', targetCompany?: string, additionalData?: any): Promise<{ success: boolean; message?: string }> => {
        if (!properties[0]) return { success: false, message: 'No properties available' };
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        if (!targetCompany) {
            targetCompany = viewingCompanyId || currentUser?.companyId;
        }

        if (!targetCompany) return { success: false, message: 'No company selected' };

        const cartId = `cart-${Date.now()}`;
        const { propertyId, unitId, items, name, scheduledDate, startDate, dayOfWeek, dayOfMonth, frequency, category } = additionalData || {};

        // Generate globally unique Work Order ID
        let workOrderId = '';
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const timestamp = Date.now().toString().slice(-4);
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const candidateWO = `WO-${timestamp}-${random}`;

            // Check global uniqueness across all companies
            const { data: existing } = await supabase
                .from('carts')
                .select('id')
                .eq('work_order_id', candidateWO)
                .maybeSingle();

            if (!existing) {
                workOrderId = candidateWO;
                break;
            }

            attempts++;
        }

        if (!workOrderId) {
            return { success: false, message: 'Failed to generate unique Work Order ID. Please try again.' };
        }

        let initialItemCount = 0;
        let initialTotalCost = 0;
        if (items && Array.isArray(items)) {
            initialItemCount = items.length;
            initialTotalCost = items.reduce((sum: number, item: any) => sum + (safeNumber(item.quantity) * safeNumber(item.unitPrice)), 0);
        }

        const dbPayload: any = {
            id: cartId,
            company_id: targetCompany,
            work_order_id: workOrderId,
            name: name || `New ${cartType} Cart`,
            type: cartType,
            status: 'Draft',
            property_id: propertyId || properties[0].id,
            unit_id: unitId || null,
            created_by: session?.user?.id,
            total_cost: initialTotalCost,
            item_count: initialItemCount
        };

        if (category) dbPayload.category = category;
        if (scheduledDate) dbPayload.scheduled_date = scheduledDate;
        if (startDate) dbPayload.start_date = startDate;
        if (dayOfWeek !== undefined) dbPayload.day_of_week = dayOfWeek;
        if (dayOfMonth !== undefined) dbPayload.day_of_month = dayOfMonth;
        if (frequency) dbPayload.frequency = frequency;

        const { error: cartError } = await supabase.from('carts').insert(dbPayload);

        if (cartError) {
            console.error("Error creating cart:", cartError);
            return { success: false, message: `Error creating cart: ${cartError.message}` };
        }

        if (items && Array.isArray(items) && items.length > 0) {
            const itemsPayload = items.map((item: any) => ({
                cart_id: cartId,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                note: item.note,
                vendor_id: item.vendorId
            }));
            await supabase.from('cart_items').insert(itemsPayload);
        }

        const { data: finalCartData } = await supabase.from('carts').select('*, cart_items(*)').eq('id', cartId).single();
        if (finalCartData) {
            const mappedCart = mapCart(finalCartData);
            if (initialTotalCost > 0 && mappedCart.totalCost === 0) {
                mappedCart.totalCost = initialTotalCost;
            }
            setCarts(prev => [mappedCart, ...prev]);
            setActiveCart(mappedCart);
            setView('detail');
            setSelectedCart(mappedCart);
        }

        return { success: true };
    };

    const handleReuseCart = async (originalCartId: string) => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        if (!currentUser) return;

        // 1. Fetch original cart and items
        const { data: originalCart, error: cartError } = await supabase
            .from('carts')
            .select('*, cart_items(*)')
            .eq('id', originalCartId)
            .single();

        if (cartError || !originalCart) {
            alert("Failed to fetch original cart details.");
            return;
        }

        // 2. Generate new metadata
        const newCartId = `cart-${Date.now()}`;
        const workOrderId = `WO-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const newName = `${originalCart.type} Cart - ${currentUser.name} - ${workOrderId}`;

        // 3. Create new cart payload (Draft status)
        const dbPayload = {
            id: newCartId,
            company_id: originalCart.company_id,
            work_order_id: workOrderId,
            name: newName,
            type: originalCart.type,
            status: 'Draft',
            property_id: originalCart.property_id,
            created_by: session?.user?.id,
            total_cost: originalCart.total_cost,
            item_count: originalCart.item_count,
            category: originalCart.category,
            // Copy scheduling info if present, though user might want to change it. For reuse, we keep it.
            scheduled_date: originalCart.scheduled_date,
            start_date: originalCart.start_date,
            day_of_week: originalCart.day_of_week,
            day_of_month: originalCart.day_of_month,
            frequency: originalCart.frequency
        };

        const { error: createError } = await supabase.from('carts').insert(dbPayload);
        if (createError) {
            console.error("Error creating reused cart:", createError);
            alert(`Error reusing cart: ${createError.message}`);
            return;
        }

        // 4. Copy items
        if (originalCart.cart_items && originalCart.cart_items.length > 0) {
            const itemsPayload = originalCart.cart_items.map((item: any) => ({
                cart_id: newCartId,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unit_price: item.unit_price,
                note: item.note,
                vendor_id: item.vendor_id
            }));
            await supabase.from('cart_items').insert(itemsPayload);
        }

        // 5. Update state and navigate
        const { data: finalCartData } = await supabase.from('carts').select('*, cart_items(*)').eq('id', newCartId).single();
        if (finalCartData) {
            const mappedCart = mapCart(finalCartData);
            setCarts(prev => [mappedCart, ...prev]);
            setActiveCart(mappedCart);
            setSelectedCart(mappedCart);
            setView('detail');
            setActiveItem('My Carts'); // Ensure we are on the right view
        }
    };

    const handleUpdateCartItem = async (cartId: string, product: { sku: string; name: string; unitPrice: number; vendorId?: string }, quantity: number, note?: string) => {
        console.log('App: handleUpdateCartItem called', { cartId, product, quantity });
        const currentCart = carts.find(c => c.id === cartId);
        if (!currentCart) {
            console.error('App: handleUpdateCartItem - Cart not found', cartId);
            return;
        }
        const existingItem = currentCart.items.find(i => i.sku === product.sku);

        if (quantity <= 0) {
            if (existingItem) {
                const { error } = await supabase.from('cart_items').delete().eq('id', existingItem.id);
                if (error) console.error('Error deleting item:', error);
            }
        } else {
            const itemPayload: any = { cart_id: cartId, name: product.name, sku: product.sku, unit_price: product.unitPrice, quantity: quantity, note: note };
            if (product.vendorId) itemPayload.vendor_id = product.vendorId;

            let error;
            if (existingItem) {
                const res = await supabase.from('cart_items').update(itemPayload).eq('id', existingItem.id);
                error = res.error;
            } else {
                const res = await supabase.from('cart_items').insert(itemPayload);
                error = res.error;
            }

            if (error) {
                console.error('Error updating/inserting item:', error);
                alert(`Failed to add item: ${error.message}`);
                return;
            }
        }

        const { data: currentItems } = await supabase.from('cart_items').select('*').eq('cart_id', cartId);
        if (currentItems) {
            const newTotal = currentItems.reduce((sum: number, item: any) => {
                const qty = safeNumber(item.quantity);
                const price = safeNumber(item.unit_price);
                const lineTotal = item.total_price !== undefined ? safeNumber(item.total_price) : (qty * price);
                if (lineTotal === 0 && qty > 0 && price > 0) return sum + (qty * price);
                return sum + lineTotal;
            }, 0);

            await supabase.from('carts').update({
                total_cost: newTotal,
                item_count: currentItems.length
            }).eq('id', cartId);
        }

        const { data } = await supabase.from('carts').select('*, cart_items(*)').eq('id', cartId).single();
        if (data) {
            const updatedCart = mapCart(data);
            setCarts(prev => prev.map(c => c.id === cartId ? updatedCart : c));
            if (activeCart?.id === cartId) setActiveCart(updatedCart);
            if (selectedCart?.id === cartId) setSelectedCart(updatedCart);
        }
    };

    const handleUpdateCartName = async (cartId: string, newName: string) => {
        const { error } = await supabase.from('carts').update({ name: newName }).eq('id', cartId);
        if (!error) {
            setCarts(prev => prev.map(c => c.id === cartId ? { ...c, name: newName } : c));
            if (selectedCart?.id === cartId) setSelectedCart(prev => prev ? { ...prev, name: newName } : null);
        }
    };

    const handleSubmitCart = async (cartId: string) => {
        const { data: dbItems } = await supabase.from('cart_items').select('*').eq('cart_id', cartId);
        if (!dbItems || dbItems.length === 0) return;

        const calculatedTotal = dbItems.reduce((sum: number, item: any) => {
            const qty = safeNumber(item.quantity);
            const price = safeNumber(item.unit_price);
            return sum + (qty * price);
        }, 0);
        const calculatedCount = dbItems.length;

        const { data: cartData } = await supabase.from('carts').select('name, type, property_id, unit_id, created_by').eq('id', cartId).single();
        if (!cartData) return;

        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;

        await supabase.from('carts').update({ status: 'Submitted', total_cost: calculatedTotal, item_count: calculatedCount }).eq('id', cartId);

        const orderPayload = {
            id: `ord-${Date.now()}`,
            company_id: targetCompany,
            cart_id: cartId,
            cart_name: cartData.name,
            submitted_by: session?.user?.id,
            status: 'Pending My Approval',
            total_cost: calculatedTotal,
            item_count: calculatedCount,
            property_id: cartData.property_id,
            unit_id: cartData.unit_id,
            type: cartData.type,
            submission_date: new Date().toISOString()
        };

        const { data: orderData } = await supabase.from('orders').insert(orderPayload).select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)').single();
        if (orderData) {
            const { data: refreshedOrder } = await supabase
                .from('orders')
                .select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)')
                .eq('id', orderData.id)
                .single();

            const mappedOrder = mapOrder(refreshedOrder || orderData, products);
            setOrders(prev => [mappedOrder, ...prev]);
            setCarts(prev => prev.map(c => c.id === cartId ? { ...c, status: 'Submitted', totalCost: calculatedTotal, itemCount: calculatedCount } : c));
            setView('list');
        }
    };

    const handleRevertCartToDraft = async (cartId: string) => {
        const { error } = await supabase.from('carts').update({ status: 'Draft' }).eq('id', cartId);
        if (!error) {
            setCarts(prev => prev.map(c => c.id === cartId ? { ...c, status: 'Draft' } : c));
            if (selectedCart?.id === cartId) setSelectedCart(prev => prev ? { ...prev, status: 'Draft' } : null);
        }
    };

    const handleDeleteCart = async (cartId: string) => {
        // Optimistically remove from UI immediately for responsiveness
        setCarts(prev => prev.filter(c => c.id !== cartId));
        // Also remove any order associated with this cart to prevent ghost data
        setOrders(prev => prev.filter(o => o.cartId !== cartId));

        if (activeCart?.id === cartId) setActiveCart(null);
        if (selectedCart?.id === cartId) setSelectedCart(null);
        if (view === 'detail' && selectedCart?.id === cartId) setView('list');

        const { error } = await supabase.from('carts').delete().eq('id', cartId);

        if (error) {
            console.error("Error deleting cart:", error);
            alert(`Failed to delete cart: ${error.message}`);
            // Re-fetch to sync state if failed (optional, but good practice)
            if (session) fetchInitialData(session);
        }
    };

    const handleBulkDeleteCarts = async (cartIds: string[]) => {
        // Optimistic UI update
        setCarts(prev => prev.filter(c => !cartIds.includes(c.id)));
        setOrders(prev => prev.filter(o => !cartIds.includes(o.cartId)));

        if (activeCart && cartIds.includes(activeCart.id)) setActiveCart(null);
        if (selectedCart && cartIds.includes(selectedCart.id)) setSelectedCart(null);

        const { error } = await supabase.from('carts').delete().in('id', cartIds);

        if (error) {
            console.error("Error deleting carts:", error);
            alert(`Failed to delete selected carts: ${error.message}`);
            if (session) fetchInitialData(session);
        }
    };

    const handleBulkSubmit = async (cartIds: string[]) => {
        for (const id of cartIds) await handleSubmitCart(id);
    };

    const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
        await supabase.from('orders').update({ status: status }).eq('id', orderId);
        await supabase.from('order_status_history').insert({ order_id: orderId, status: status, date: new Date().toISOString() });
        const { data } = await supabase.from('orders').select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)').eq('id', orderId).single();
        if (data) {
            const updatedOrder = mapOrder(data, products);
            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(updatedOrder);
        }
    };

    const handleApprovalDecision = async (orderId: string, itemDecisions: Map<string, { status: ItemApprovalStatus; reason?: string }>) => {
        const updates = [];
        for (const [itemId, decision] of itemDecisions.entries()) {
            updates.push(supabase.from('cart_items').update({ approval_status: decision.status, rejection_reason: decision.reason }).eq('id', itemId));
        }
        await Promise.all(updates);
        const { data: orderData } = await supabase.from('orders').select('*, cart:carts(cart_items(*))').eq('id', orderId).single();
        if (orderData && orderData.cart?.cart_items) {
            const allItems = orderData.cart.cart_items;
            const allApproved = allItems.every((item: any) => item.approval_status === 'Approved');
            const anyRejected = allItems.some((item: any) => item.approval_status === 'Rejected');

            if (allApproved) await handleUpdateOrderStatus(orderId, 'Approved');
            else if (anyRejected && allItems.every((item: any) => item.approval_status !== 'Pending')) await handleUpdateOrderStatus(orderId, 'Needs Revision');
            else await fetchInitialData(session);
        } else await fetchInitialData(session);
    };

    const handleSaveOrder = async (updatedOrder: Order) => {
        if (updatedOrder.status) await supabase.from('orders').update({ status: updatedOrder.status }).eq('id', updatedOrder.id);
        if (updatedOrder.purchaseOrders) {
            for (const po of updatedOrder.purchaseOrders) {
                const poPayload = { id: po.id, original_order_id: updatedOrder.id, vendor_id: po.vendorId, status: po.status, eta: po.eta, carrier: po.carrier, tracking_number: po.trackingNumber, vendor_confirmation_number: po.vendorConfirmationNumber, invoice_number: po.invoiceNumber, invoice_url: po.invoiceUrl };
                await supabase.from('purchase_orders').upsert(poPayload);
            }
        }
        const { data } = await supabase.from('orders').select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)').eq('id', updatedOrder.id).single();
        if (data) {
            const remapped = mapOrder(data, products);
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? remapped : o));
            setOrderForProcurement(remapped);
        }
    };

    const handleUpdatePoStatus = async (orderId: string, poId: string, newStatus: any, proofUrl?: string) => {
        const update: any = { status: newStatus };
        if (proofUrl) update.delivery_proof_url = proofUrl;
        await supabase.from('purchase_orders').update(update).eq('id', poId);

        const { data: freshOrderData } = await supabase.from('orders').select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)').eq('id', orderId).single();

        if (freshOrderData && freshOrderData.purchase_orders) {
            const freshOrder = mapOrder(freshOrderData, products);
            const purchaseOrders = freshOrder.purchaseOrders || [];
            const allReceived = purchaseOrders.every((po: any) => po.status === 'Received');
            const allShipped = purchaseOrders.every((po: any) => ['In Transit', 'Received'].includes(po.status));
            let newOrderStatus = freshOrder.status;
            if (allReceived && freshOrder.status !== 'Completed') {
                newOrderStatus = 'Completed';
            } else if (allShipped && freshOrder.status !== 'Completed' && freshOrder.status !== 'Shipped') {
                newOrderStatus = 'Shipped';
            }
            if (newOrderStatus !== freshOrder.status) {
                await handleUpdateOrderStatus(orderId, newOrderStatus);
            } else {
                setOrders(prev => prev.map(o => o.id === orderId ? freshOrder : o));
                if (selectedOrder?.id === orderId) setSelectedOrder(freshOrder);
            }
        }
    };

    const handleSendMessage = async (threadId: string, content: string, taggedUserIds?: string[]) => {
        await supabase.from('messages').insert({ id: `msg-${Date.now()}`, thread_id: threadId, sender_id: session.user.id, content: content, tagged_user_ids: taggedUserIds || [] });
        await supabase.from('communication_threads').update({ last_message_at: new Date().toISOString(), last_message_snippet: content.substring(0, 50) }).eq('id', threadId);
        const { data } = await supabase.from('messages').select('*');
        if (data) setMessages(data.map(mapMessage));
        const targetCompany = viewingCompanyId || users?.find(u => u.id === session?.user?.id)?.companyId;
        if (targetCompany) {
            const { data: tData } = await supabase.from('communication_threads').select('*').eq('company_id', targetCompany);
            if (tData) setThreads(tData.map(mapThread));
        }
    };

    const handleStartThread = async (participantIds: string[]): Promise<string> => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;
        const newThreadId = `thread-${Date.now()}`;
        const allParticipants = Array.from(new Set([...participantIds, session.user.id]));
        const { data } = await supabase.from('communication_threads').insert({
            id: newThreadId,
            company_id: targetCompany,
            participant_ids: allParticipants,
            subject: 'New Conversation',
            last_message_snippet: 'Started a new thread',
            is_read: true
        }).select().single();
        if (data) {
            setThreads(prev => [mapThread(data), ...prev]);
            return data.id;
        }
        return '';
    };

    const handleNavigation = (newItem: string) => {
        setActiveItem(newItem);
        setOrderForProcurement(null);
        setIsCartDrawerOpen(false);
        setIsQuickCartModalOpen(false);
        setIsCreateCartModalOpen(false);
    };

    const handleAddProperty = async (data: { name: string; userIds?: string[] }) => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;
        if (!targetCompany) return;
        const id = `prop-${Date.now()}`;
        const { data: newProp } = await supabase.from('properties').insert({ id, company_id: targetCompany, name: data.name }).select().single();

        if (newProp) {
            setProperties(prev => [...prev, { id: newProp.id, companyId: newProp.company_id, name: newProp.name, address: newProp.address }]);

            // Assign users if selected
            if (data.userIds && data.userIds.length > 0) {
                const updates = data.userIds.map(async (userId) => {
                    const user = users?.find(u => u.id === userId);
                    if (user) {
                        const newPropertyIds = [...(user.propertyIds || []), newProp.id];
                        // Update Supabase
                        await supabase.from('profiles').update({ property_ids: newPropertyIds }).eq('id', userId);
                        // Update Local State
                        setUsers(prev => prev.map(u => u.id === userId ? { ...u, propertyIds: newPropertyIds } : u));
                    }
                });
                await Promise.all(updates);
            }
        }
    };

    const handleDeleteProperty = async (propertyId: string) => {
        // Optimistically remove
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        // Also remove units associated with this property
        setUnits(prev => prev.filter(u => u.propertyId !== propertyId));

        const { error } = await supabase.from('properties').delete().eq('id', propertyId);
        if (error) {
            console.error("Error deleting property:", error);
            alert(`Failed to delete property: ${error.message}`);
            if (session) fetchInitialData(session);
        }
    };

    const handleAddUnit = async (data: { propertyId: string, name: string }) => {
        const id = `unit-${Date.now()}`;
        const { data: newUnit } = await supabase.from('units').insert({ id, property_id: data.propertyId, name: data.name }).select().single();
        if (newUnit) setUnits(prev => [...prev, { id: newUnit.id, propertyId: newUnit.property_id, name: newUnit.name }]);
    };

    const handleDeleteUser = async (userId: string) => {
        // Optimistically remove from local state
        setUsers(prev => prev.filter(u => u.id !== userId));

        const { error } = await supabase.from('profiles').delete().eq('id', userId);

        if (error) {
            console.error("Error deleting user:", error);
            alert(`Failed to delete user: ${error.message}`);
            // Re-fetch to sync state if failed
            if (session) fetchInitialData(session);
        }
    }

    const handleAddUser = async (userData: { name: string; email: string; password?: string; roleId: string; propertyIds: string[]; sendInvite?: boolean }) => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;
        if (!targetCompany) return;

        let newUserId = `user-${Date.now()}`;
        let authError = null;

        // If a password is provided, try to create the Auth User using a temporary client to avoid logging out the admin.
        if (userData.password) {
            // Create a temporary client that DOES NOT persist session (so we don't log out the admin)
            const tempSupabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            const { data: authData, error } = await tempSupabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name
                    }
                }
            });

            if (error) {
                console.error("Auth creation error:", error);
                alert(`Failed to create login account: ${error.message}. Profile will be created anyway.`);
                authError = error;
            } else if (authData.user) {
                newUserId = authData.user.id; // Use the real UUID
            }
        }

        // Insert (or Update if the trigger already created it from signUp) the Profile
        // Upsert is safer here because if signUp succeeded, the trigger might have inserted a row already.
        const { data: newUser, error: profileError } = await supabase.from('profiles').upsert({
            id: newUserId,
            company_id: targetCompany,
            full_name: userData.name,
            email: userData.email,
            role_id: userData.roleId,
            property_ids: userData.propertyIds,
            status: 'Active'
        }).select().single();

        if (profileError) {
            console.error("Profile creation error:", profileError);
            if (!authError) alert("Failed to save user profile.");
            return;
        }

        if (newUser) {
            // Update local state (handle both insert and update cases)
            setUsers(prev => {
                const existingIndex = prev.findIndex(u => u.id === newUser.id);
                const userObj: AdminUser = {
                    id: newUser.id,
                    companyId: newUser.company_id,
                    name: newUser.full_name,
                    email: newUser.email,
                    roleId: newUser.role_id,
                    propertyIds: newUser.property_ids || [],
                    avatarUrl: 'https://via.placeholder.com/150',
                    status: newUser.status
                };

                if (existingIndex >= 0) {
                    const newArr = [...prev];
                    newArr[existingIndex] = userObj;
                    return newArr;
                }
                return [...prev, userObj];
            });

            // Invitation Logic
            if (userData.sendInvite) {
                const roleName = roles.find(r => r.id === userData.roleId)?.name || 'User';
                const inviteUrl = window.location.origin; // e.g. http://localhost:5173 or https://your-app.com
                const subject = encodeURIComponent("Invitation to ProcurePro");
                let body = '';

                if (userData.password) {
                    body = encodeURIComponent(`Hi ${userData.name},\n\nYou have been invited to join the ProcurePro platform as a ${roleName}.\n\nYour account has been created.\n\nEmail: ${userData.email}\nPassword: ${userData.password}\n\nLog in here: ${inviteUrl}\n\nBest,\nThe ProcurePro Team`);
                } else {
                    body = encodeURIComponent(`Hi ${userData.name},\n\nYou have been invited to join the ProcurePro platform as a ${roleName}.\n\nPlease create your account and set your password by visiting the link below:\n\n${inviteUrl}\n\nIMPORTANT: When you see the login screen, please click "Sign Up" (not Sign In) and use the following email address:\n\n${userData.email}\n\nBest,\nThe ProcurePro Team`);
                }

                // Open the user's default email client
                window.open(`mailto:${userData.email}?subject=${subject}&body=${body}`, '_blank');
            }
        }
    };

    const handleAddCompany = async (companyData: { name: string }, userData: { name: string; email: string; password: string; roleId: string }) => {
        try {
            setLoading(true);
            const companyId = `comp-${Date.now()}`;

            // 1. Create Company
            await supabase.from('companies').insert({
                id: companyId,
                name: companyData.name
            });

            // 2. Create Admin User (Simulated Auth User for demo purposes, as actual Auth requires admin API)
            const userId = `user-${Date.now()}`;

            await supabase.from('profiles').insert({
                id: userId,
                company_id: companyId,
                full_name: userData.name,
                email: userData.email,
                role_id: userData.roleId,
                status: 'Active',
                property_ids: [] // Admins usually access all via roles, but can be specific
            });

            // Refresh data
            if (viewingCompanyId) {
                // If we are viewing a company, just reload
                fetchInitialData(session);
            } else {
                // If owner view, reload companies list
                const { data: companiesData } = await supabase.from('companies').select('*');
                if (companiesData) setAvailableCompanies(companiesData);
            }

            alert(`Company "${companyData.name}" created successfully with admin user "${userData.name}".`);

        } catch (error: any) {
            console.error("Error creating company:", error);
            alert("Failed to create company.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddRole = async (roleData: Omit<Role, 'id'>) => {
        const id = `role-${Date.now()}`;
        const { data: newRole } = await supabase.from('roles').insert({ id, ...roleData }).select().single();
        if (newRole) setRoles(prev => [...prev, newRole]);
    };

    const handleUpdateRole = async (role: Role) => {
        const { data: updatedRole } = await supabase.from('roles').update(role).eq('id', role.id).select().single();
        if (updatedRole) setRoles(prev => prev.map(r => r.id === role.id ? updatedRole : r));
    };

    const handleDeleteRole = async (roleId: string) => {
        await supabase.from('roles').delete().eq('id', roleId);
        setRoles(prev => prev.filter(r => r.id !== roleId));
    };

    const handleAddVendor = async (vendorData: { name: string; phone?: string; email?: string }) => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;
        if (!targetCompany) return;
        const id = `vendor-${Date.now()}`;
        const { data: newVendor } = await supabase.from('vendors').insert({ id, company_id: targetCompany, ...vendorData }).select('*, vendor_accounts(*)').single();
        if (newVendor) setVendors(prev => [...prev, mapVendor(newVendor)]);
    };

    const handleAddProduct = async (product: Omit<Product, 'id'>) => {
        const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
        const targetCompany = viewingCompanyId || currentUser?.companyId;
        if (!targetCompany) return;
        const id = `prod-${Date.now()}`;
        const payload = {
            id,
            company_id: targetCompany,
            name: product.name,
            sku: product.sku,
            description: product.description,
            unit_price: product.unitPrice,
            image_url: product.imageUrl,
            vendor_id: product.vendorId,
            primary_category: product.primaryCategory,
            secondary_category: product.secondaryCategory,
            rating: product.rating,
            tags: product.tags
        };
        const { data: newProd } = await supabase.from('products').insert(payload).select().single();
        if (newProd) setProducts(prev => [...prev, mapProduct(newProd)]);
    };

    const handleUpdateProduct = async (product: Product) => {
        const payload = {
            name: product.name,
            sku: product.sku,
            description: product.description,
            unit_price: product.unitPrice,
            image_url: product.imageUrl,
            vendor_id: product.vendorId,
            primary_category: product.primaryCategory,
            secondary_category: product.secondaryCategory,
            rating: product.rating,
            tags: product.tags
        };
        const { data: updatedProd } = await supabase.from('products').update(payload).eq('id', product.id).select().single();
        if (updatedProd) {
            setProducts(prev => prev.map(p => p.id === product.id ? mapProduct(updatedProd) : p));
        }
    };

    const handleNavigateToPropertyInvoice = (propertyId: string, unitId?: string) => {
        setInvoicePreSelectedPropertyId(propertyId);
        setInvoicePreSelectedUnitId(unitId || null);
        setActiveItem('Invoices');
    };

    const handleAddVendorAccount = async (vendorId: string, accountData: { propertyId: string, accountNumber: string }) => {
        const id = `vacc-${Date.now()}`;
        const { data: newAcc } = await supabase.from('vendor_accounts').insert({ id, vendor_id: vendorId, property_id: accountData.propertyId, account_number: accountData.accountNumber }).select().single();
        if (newAcc) {
            const currentUser = impersonatingUser || users?.find(u => u.id === session?.user?.id);
            const targetCompany = viewingCompanyId || currentUser?.companyId;
            if (targetCompany) {
                const { data } = await supabase.from('vendors').select('*, vendor_accounts(*)').eq('company_id', targetCompany);
                if (data) setVendors(data.map(mapVendor));
            }
        }
    };

    const originalUser = userProfile;
    const currentUser = impersonatingUser || originalUser;

    // Public Routes (Bypass Auth)
    if (window.location.hash.startsWith('#/pay/')) {
        return <InvoicePaymentPage />;
    }

    if (loading || (session && !currentUser && !dataError)) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground px-6 font-sans">
                <div className="mb-8 p-5 bg-background/50 dark:bg-foreground/10 rounded-3xl backdrop-blur-md shadow-2xl border border-border">
                    <ProcureProLogoIcon className="w-20 h-20 text-foreground drop-shadow-lg" />
                </div>
                <h2 className="text-3xl font-bold mb-2 tracking-tight text-center">Company Database is loading</h2>
                <p className="text-muted-foreground text-sm mb-10 text-center max-w-xs">Synchronizing assets, orders, and user permissions...</p>

                <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden border border-border shadow-inner">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_15px_hsl(var(--primary)_/_0.6)] relative"
                        style={{ width: `${loadingProgress}%` }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-primary-foreground/30 animate-pulse"></div>
                    </div>
                </div>
                <div className="flex justify-between w-full max-w-xs mt-3 px-1">
                    <span className="text-xs font-medium text-muted-foreground">System Sync</span>
                    <span className="text-xs font-bold text-primary font-mono">{loadingProgress}%</span>
                </div>
            </div>
        );
    }

    if (!session) return <Auth />;

    if (!currentUser) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background p-8 text-center">
                <div className="bg-card/40 p-8 rounded-2xl backdrop-blur-lg border border-red-500/30 max-w-md">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Setup Issue</h2>
                    <p className="text-muted-foreground mb-6">
                        {dataError || "Could not load profile. Please try refreshing."}
                    </p>
                    <button onClick={() => window.location.reload()} className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-all shadow-lg">Retry Connection</button>
                </div>
            </div>
        );
    }

    if (isMobile) {
        return (
            <PermissionsProvider user={currentUser} roles={roles}>
                <MobileApp
                    orders={orders}
                    carts={carts}
                    products={products}
                    users={users}
                    threads={threads}
                    messages={messages}
                    properties={properties}
                    currentUser={currentUser}
                    activeCart={activeCart}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onApprovalDecision={handleApprovalDecision}
                    onUpdateCartItem={(prod, qty, note) => activeCart && handleUpdateCartItem(activeCart.id, prod, qty, note)}
                    onSendMessage={handleSendMessage}
                    onSelectCart={setActiveCart}
                    onStartNewThread={handleStartThread}
                    onNewCart={(type) => handleAddCart(type)}
                    // Add Props for Full Parity
                    vendors={vendors}
                    units={units}
                    roles={roles}
                    availableCompanies={availableCompanies}
                    currentCompanyId={viewingCompanyId || currentUser.companyId}
                    companyName={currentCompanyName}
                    onSwitchCompany={handleSwitchCompany}
                    onAddProperty={handleAddProperty}
                    onAddUnit={handleAddUnit}
                    onAddUser={handleAddUser}
                    onAddRole={handleAddRole}
                    onUpdateRole={handleUpdateRole}
                    onDeleteRole={handleDeleteRole}
                    onAddVendor={handleAddVendor}
                    onAddProduct={handleAddProduct}
                    onAddVendorAccount={handleAddVendorAccount}
                    onUpdatePoStatus={handleUpdatePoStatus}
                    onProcureOrder={(o) => setOrderForProcurement(o)}
                    onSelectOrder={(o) => setSelectedOrder(o)}
                    onLogout={handleLogout}
                    impersonatingUser={impersonatingUser}
                    onImpersonate={setImpersonatingUser}
                    onRefresh={() => session && fetchInitialData(session)}
                />
            </PermissionsProvider>
        )
    }

    const handleDeleteOrder = async (orderId: string) => {
        // Optimistically remove
        setOrders(prev => prev.filter(o => o.id !== orderId));
        if (selectedOrder?.id === orderId) setSelectedOrder(null);

        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) {
            console.error("Error deleting order:", error);
            alert(`Failed to delete order: ${error.message}`);
            if (session) fetchInitialData(session);
        }
    };

    const handleUpdatePoPaymentStatus = async (orderId: string, poId: string, updates: Partial<PurchaseOrder> & { paymentMetadata?: any }) => {
        console.log("DEBUG: handleUpdatePoPaymentStatus called", { orderId, poId, updates });

        // 1. Process Payment via Sola (if metadata provided)
        // 1. Process Payment via Sola (if metadata provided AND explicitly requested)
        if (updates.paymentMetadata && updates.paymentMetadata.processPayment) {
            try {
                // Ensure we have an amount to charge
                const amountToCharge = updates.paymentMetadata.chargeAmount || updates.amountDue;
                if (!amountToCharge) {
                    alert("Error: Payment amount is missing. Cannot process.");
                    return;
                }

                // We use a placeholder token for now as per previous design
                const paymentResult = await processPayment(poId, 'placeholder-token', amountToCharge, updates.paymentMetadata);

                if (!paymentResult.success) {
                    alert(`Payment Failed: ${paymentResult.error}`);
                    return; // Abort DB update
                }

                console.log("Payment Successful:", paymentResult.transactionId);
                // Optionally store transactionId in DB if schema supports it
            } catch (err: any) {
                console.error("Critical Payment Error:", err);
                alert(`System Error during payment: ${err.message}`);
                return;
            }
        }

        const dbUpdates: any = {};
        if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
        if (updates.invoiceNumber) dbUpdates.invoice_number = updates.invoiceNumber;
        if (updates.invoiceDate) dbUpdates.invoice_date = updates.invoiceDate;
        if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
        if (updates.amountDue) dbUpdates.amount_due = updates.amountDue;
        if (updates.paymentDate) dbUpdates.payment_date = updates.paymentDate;
        if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
        if (updates.invoiceUrl) dbUpdates.invoice_url = updates.invoiceUrl;

        const { error: updateError } = await supabase.from('purchase_orders').update(dbUpdates).eq('id', poId);

        if (updateError) {
            console.error("Error updating PO status:", updateError);
            alert(`Failed to update status: ${updateError.message}`);
            return;
        }

        // NEW: If Payment Status is Paid, create Billable Items (AR)
        if (updates.paymentStatus === 'Paid') {
            try {
                // Dynamically import to avoid circular dependencies if any (though App.tsx is top level)
                const { billbackService } = await import('./services/billbackService');
                await billbackService.createBillableItemsFromPurchaseOrder(poId);
                console.log("Billable Items Created for PO:", poId);
            } catch (err: any) {
                console.error("Error creating billable items:", err);
                alert(`Warning: Payment recorded, but failed to create AR Billable Items: ${err.message}`);
            }
        }

        const { data: freshOrderData, error: fetchError } = await supabase.from('orders').select('*, cart:carts(cart_items(*)), purchase_orders(*), order_status_history(*)').eq('id', orderId).single();

        if (fetchError) {
            console.error("Error fetching fresh order data:", fetchError);
            return;
        }

        if (freshOrderData && freshOrderData.purchase_orders) {
            const freshOrder = mapOrder(freshOrderData, products);
            setOrders(prev => prev.map(o => o.id === orderId ? freshOrder : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(freshOrder);
        }
    };

    const renderContent = () => {
        if (orderForProcurement) return <ProcurementWorkspace key={orderForProcurement.id} order={orderForProcurement} vendors={vendors} products={products} onBack={(updated) => { setOrderForProcurement(null); if (updated) handleSaveOrder(updated); }} onOrderComplete={handleSaveOrder} />;

        if (activeItem === 'My Carts' || activeItem === 'Carts to Submit') {
            if (view === 'detail' && selectedCart) {
                return <CartDetail cart={selectedCart} onBack={() => setView('list')} onOpenCatalog={() => setView('catalog')} properties={properties} products={products} onUpdateCartName={handleUpdateCartName} onUpdateCartItem={(prod, qty, note) => handleUpdateCartItem(selectedCart.id, prod, qty, note)} onSubmitForApproval={handleSubmitCart} onRevertToDraft={handleRevertCartToDraft} onOpenEditSchedule={(cart) => { setCartForScheduleEdit(cart); setIsEditScheduleModalOpen(true); }} onManualAdd={(item) => handleUpdateCartItem(selectedCart.id, { sku: item.sku, name: item.name, unitPrice: item.unitPrice }, item.quantity, item.note)} />;
            }
            if (view === 'catalog' && selectedCart) {
                return <ProductDashboard products={products} companies={availableCompanies} currentCompanyId={viewingCompanyId || currentUser?.companyId || ''} activeCart={selectedCart} onUpdateItem={(prod, qty, note) => handleUpdateCartItem(selectedCart.id, prod, qty, note)} onBack={() => setView('detail')} onRefresh={() => session && fetchInitialData(session)} />;
            }
            return <MyCarts carts={carts} setCarts={setCarts} onSelectCart={(c) => { const freshCart = carts.find(cart => cart.id === c.id) || c; setSelectedCart(freshCart); setView('detail'); }} onOpenCreateCartModal={() => setIsCreateCartModalOpen(true)} onBulkSubmit={handleBulkSubmit} properties={properties} initialStatusFilter={activeItem === 'Carts to Submit' ? 'Needs Attention' : 'All'} orders={orders} onDeleteCart={handleDeleteCart} onDeleteOrder={handleDeleteOrder} onBulkDeleteCarts={handleBulkDeleteCarts} onReuseCart={handleReuseCart} />;
        }

        if (activeItem === 'All Orders') return <AllOrders orders={orders} onProcureOrder={(o) => setOrderForProcurement(o)} onSelectOrder={(o) => { setSelectedOrder(o); }} properties={properties} onDeleteOrder={handleDeleteOrder} users={users} />;
        if (activeItem === 'Purchase Orders') return <PurchaseOrders orders={orders} vendors={vendors} onSelectOrder={(o) => { setSelectedOrder(o); }} properties={properties} />;
        if (activeItem === 'Approvals') return <Approvals orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} onSelectOrder={(o) => { setSelectedOrder(o); }} users={users} properties={properties} />;
        if (activeItem === 'Receiving') return <Receiving orders={orders} vendors={vendors} onUpdatePoStatus={handleUpdatePoStatus} onSelectOrder={(o) => setSelectedOrder(o)} />;
        if (activeItem === 'Communications') return <CommunicationCenter threads={threads} messages={messages} users={users} orders={orders} currentUser={currentUser} onSendMessage={handleSendMessage} onStartNewThread={handleStartThread} onSelectOrder={setSelectedOrder} />;
        if (activeItem === 'Company Settings') return <AdminSettings vendors={vendors} properties={properties} units={units} users={users} roles={roles} companies={availableCompanies} currentUser={currentUser} onAddProperty={handleAddProperty} onDeleteProperty={handleDeleteProperty} onAddUnit={handleAddUnit} onAddRole={handleAddRole} onUpdateRole={handleUpdateRole} onDeleteRole={handleDeleteRole} onViewAsUser={setImpersonatingUser} onAddUser={handleAddUser} onAddCompany={handleAddCompany} onDeleteUser={handleDeleteUser} products={products} onUpdateProduct={handleUpdateProduct} />;
        if (activeItem === 'Payment Settings') return <PaymentSettings companyId={viewingCompanyId || currentUser?.companyId || ''} />;
        if (activeItem === 'Suppliers') return <Suppliers vendors={vendors} products={products} orders={orders} properties={properties} companies={availableCompanies} currentCompanyId={viewingCompanyId || currentUser?.companyId || ''} onSwitchCompany={currentUser?.roleId === 'role-0' ? handleSwitchCompany : undefined} onSelectOrder={(o) => { setSelectedOrder(o); }} onAddVendor={handleAddVendor} onAddProduct={handleAddProduct} onAddVendorAccount={handleAddVendorAccount} />;
        if (activeItem === 'Chart of Accounts') return <ChartOfAccounts accounts={accounts} onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} onDeleteAccount={handleDeleteAccount} />;

        // AP & AR Routes
        if (activeItem === 'Bills') return <VendorInvoicesList companyId={viewingCompanyId || currentUser?.companyId || ''} onViewDetail={(inv) => { setSelectedVendorInvoice(inv); console.log("Selected Invoice:", inv); }} />;
        if (activeItem === 'Bill Payments') return <Transactions orders={orders} vendors={vendors} onUpdatePoPaymentStatus={handleUpdatePoPaymentStatus} />;
        if (activeItem === 'Invoices') return (
            <InvoicesPage
                currentCompanyId={viewingCompanyId || currentUser?.companyId || ''}
                currentUser={currentUser}
                products={products}
                customers={customers}
                properties={properties}
                units={units}
                preSelectedPropertyId={invoicePreSelectedPropertyId}
                preSelectedUnitId={invoicePreSelectedUnitId}
                onClearPreSelectedProperty={() => {
                    setInvoicePreSelectedPropertyId(null);
                    setInvoicePreSelectedUnitId(null);
                }}
            />
        );
        if (activeItem === 'Property AR') return <PropertyARList properties={properties} units={units} onSelectProperty={handleNavigateToPropertyInvoice} onSelectUnit={(pid, uid) => handleNavigateToPropertyInvoice(pid, uid)} />;
        if (activeItem === 'Invoice History') {
            return (
                <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                    <InvoiceHistoryPage companyId={viewingCompanyId || currentUser?.companyId || ''} />
                </React.Suspense>
            );
        }
        if (activeItem === 'Property AR') return <PropertyARList properties={properties} units={units} onSelectProperty={handleNavigateToPropertyInvoice} onSelectUnit={(pid, uid) => handleNavigateToPropertyInvoice(pid, uid)} />;
        if (activeItem === 'Reports') return <Reports orders={orders} vendors={vendors} products={products} />;
        if (activeItem === 'Integrations') return <Integrations />;
        if (activeItem === 'Properties') return <Properties properties={properties} units={units} orders={orders} users={users} onSelectOrder={setSelectedOrder} />;
        if (activeItem === 'Product Dashboard') return <ProductDashboard products={products} companies={availableCompanies} currentCompanyId={viewingCompanyId || currentUser?.companyId || ''} onSwitchCompany={currentUser?.roleId === 'role-0' ? handleSwitchCompany : undefined} onRefresh={() => session && fetchInitialData(session)} />;

        return <Dashboard orders={orders} carts={carts} onNavigateToApprovals={() => handleNavigation('Approvals')} onNavigateToOrdersInTransit={() => handleNavigation('Receiving')} onNavigateToCartsToSubmit={() => handleNavigation('Carts to Submit')} onNavigateToCompletedOrders={() => handleNavigation('All Orders')} onNavigateToMyOrders={() => handleNavigation('All Orders')} onOpenCreateCartModal={() => setIsCreateCartModalOpen(true)} onGenerateReport={() => { }} />;
    };

    return (
        <PermissionsProvider user={currentUser} roles={roles}>
            <div className="flex h-screen bg-background font-sans text-foreground">
                <Sidebar
                    activeItem={activeItem}
                    setActiveItem={handleNavigation}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                    user={currentUser}
                    roles={roles}
                    companies={availableCompanies}
                    currentCompanyId={viewingCompanyId || ''}
                    companyName={currentCompanyName}
                    onSwitchCompany={handleSwitchCompany}
                    onLogout={handleLogout}
                />
                <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-28' : 'ml-72'}`}>
                    <Header onQuickCartClick={() => setIsQuickCartModalOpen(true)} onCartIconClick={() => setIsCartDrawerOpen(true)} user={currentUser} activeCart={activeCart} roles={roles} />
                    <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{renderContent()}</main>
                </div>
                <CreateCartFlowModal isOpen={isCreateCartModalOpen} onClose={() => setIsCreateCartModalOpen(false)} onSave={async (data) => { const result = await handleAddCart(data.type, viewingCompanyId || currentUser?.companyId, data); return result; }} properties={properties} units={units} userName={currentUser?.name || 'Unknown User'} />
                <QuickCartModal isOpen={isQuickCartModalOpen} onClose={() => setIsQuickCartModalOpen(false)} onSave={(data) => { handleAddCart('Standard', viewingCompanyId || currentUser?.companyId, { name: data.name, propertyId: data.propertyId, items: data.items as any }); setIsQuickCartModalOpen(false); }} properties={properties} />
                <GlobalCartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} activeCart={activeCart} carts={carts?.filter(c => c.status === 'Draft' || c.status === 'Ready for Review')} onSelectCart={setActiveCart} onUpdateItem={(prod, qty, note) => activeCart && handleUpdateCartItem(activeCart.id, prod, qty, note)} onSubmitForApproval={(cartId) => { handleSubmitCart(cartId); setIsCartDrawerOpen(false); }} onViewFullCart={() => { if (activeCart) { setIsCartDrawerOpen(false); setActiveItem('My Carts'); setSelectedCart(activeCart); setView('detail'); } }} />
                <OrderDetailsDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} properties={properties} users={users} threads={threads} messages={messages} currentUser={currentUser} onSendMessage={handleSendMessage} orders={orders} onSelectOrder={setSelectedOrder} onUpdateOrderStatus={handleUpdateOrderStatus} onApprovalDecision={handleApprovalDecision} onProcureOrder={(o) => { setSelectedOrder(null); setOrderForProcurement(o); }} vendors={vendors} />
                <EditScheduleModal isOpen={isEditScheduleModalOpen} onClose={() => setIsEditScheduleModalOpen(false)} cart={cartForScheduleEdit} onSave={() => { setIsEditScheduleModalOpen(false); }} />
                <VendorInvoiceDetailModal
                    isOpen={!!selectedVendorInvoice}
                    onClose={() => setSelectedVendorInvoice(null)}
                    invoice={selectedVendorInvoice}
                    companyId={viewingCompanyId || currentUser?.companyId || ''}
                    onUpdate={() => session && fetchInitialData(session)}
                />
            </div>
        </PermissionsProvider>
    );
};

export default App;
