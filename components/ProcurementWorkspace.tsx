import React, { useState, useEffect, useMemo } from 'react';
import { Order, CartItem, PurchaseOrder, PurchaseOrderStatus, Vendor, Product, ProductVendorOption } from '../types';
import { ChevronLeftIcon, CheckBadgeIcon, CameraIcon, ShipmentIcon, TransactionIcon, PaperClipIcon, ArrowUpTrayIcon } from './Icons';
import { CustomSelect } from './ui/CustomSelect';
import VendorComparisonModal from './VendorComparisonModal';
import { usePermissions } from '../contexts/PermissionsContext';
import { generatePOId } from '../utils/idGenerator';

interface ProcurementWorkspaceProps {
  order: Order;
  vendors: Vendor[];
  products: Product[];
  onBack: (updatedOrder?: Order) => void;
  onOrderComplete: (completedOrder: Order) => void;
}

const getPOStatusTheme = (status: PurchaseOrderStatus) => {
  switch (status) {
    case 'Issued': return 'bg-white/10 text-gray-300 border border-white/10';
    case 'Purchased': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    case 'In Transit': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
    case 'Received': return 'bg-green-500/20 text-green-300 border border-green-500/30';
  }
}

const assignmentCache: Record<string, Record<string, string>> = {};

const ProcurementWorkspace: React.FC<ProcurementWorkspaceProps> = ({ order, vendors, products, onBack, onOrderComplete }) => {
  const [localOrder, setLocalOrder] = useState<Order>(order);
  const [activeTab, setActiveTab] = useState<'assign' | 'manage'>(() => {
    // Default to manage if POs exist, otherwise assign
    if (order.purchaseOrders && order.purchaseOrders.length > 0) return 'manage';
    return 'assign';
  });

  // Initialize from cache if available to survive remounts
  const [itemVendorAssignments, setItemVendorAssignments] = useState<Record<string, string>>(() => {
    return assignmentCache[order.id] || {};
  });

  const [itemPriceOverrides, setItemPriceOverrides] = useState<Record<string, number>>({});
  const [comparisonProduct, setComparisonProduct] = useState<Product | null>(null);
  const [comparisonItemId, setComparisonItemId] = useState<string | null>(null);
  const { can } = usePermissions();

  const canCreatePOs = can('purchaseOrders:create');
  const canEditPOs = can('purchaseOrders:edit');


  useEffect(() => {
    // Prevent overwriting local optimistic updates with stale prop data
    setLocalOrder(prev => {
      const prevPoCount = prev.purchaseOrders?.length || 0;
      const newPoCount = order.purchaseOrders?.length || 0;

      // If we have more POs locally (optimistic creation), don't revert to stale prop
      // This handles the case where parent re-renders before DB update propagates
      if (prevPoCount > newPoCount) {
        return prev;
      }
      return order;
    });
  }, [order]);

  // Sync state to cache
  useEffect(() => {
    assignmentCache[order.id] = itemVendorAssignments;
  }, [itemVendorAssignments, order.id]);

  // Only set initial tab when order ID changes (new order loaded)
  // REMOVED: Handled by key prop in App.tsx forcing remount

  useEffect(() => {
    if (activeTab === 'manage' && localOrder.purchaseOrders) {
      const allPOsReceived = localOrder.purchaseOrders.every(po => po.status === 'Received');
      if (allPOsReceived && localOrder.status !== 'Completed') {
        const completedOrder = { ...localOrder, status: 'Completed' as const };
        setLocalOrder(completedOrder);
        onOrderComplete(completedOrder);
      }
    }
  }, [localOrder, activeTab, onOrderComplete]);

  const assignedItemIdsInPOs = useMemo(() =>
    new Set(localOrder.purchaseOrders?.flatMap(po => po.items.map(i => i.id)) ?? []),
    [localOrder.purchaseOrders]
  );

  const itemsToAssign = useMemo(() =>
    localOrder.items.filter(item => !assignedItemIdsInPOs.has(item.id)),
    [localOrder.items, assignedItemIdsInPOs]
  );

  // Pre-fill vendor assignments with default vendorId
  const initializedItems = React.useRef<Set<string>>(new Set());

  // Reset initialized items when order ID changes
  // Reset initialized items when order ID changes
  // REMOVED: Handled by key prop

  useEffect(() => {
    if (itemsToAssign.length > 0) {
      setItemVendorAssignments(prev => {
        const next = { ...prev };
        let hasChanges = false;
        itemsToAssign.forEach(item => {
          if (!initializedItems.current.has(item.id)) {
            // Check product data first, then item snapshot. Match by SKU since CartItem doesn't have productId.
            const product = products.find(p => p.sku === item.sku);
            const effectiveVendorId = product?.vendorId || item.vendorId;

            if (effectiveVendorId && !next[item.id]) {
              next[item.id] = effectiveVendorId;
              hasChanges = true;
            }
            initializedItems.current.add(item.id);
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [itemsToAssign, products]);

  const handleVendorSelect = (itemId: string, vendorId: string) => {
    setItemVendorAssignments(prev => ({ ...prev, [itemId]: vendorId }));
  };

  const handlePriceChange = (itemId: string, price: number) => {
    setItemPriceOverrides(prev => ({ ...prev, [itemId]: price }));
  };

  const handleCreatePOs = () => {
    if (!canCreatePOs) {
      return;
    }

    const posByVendor: Record<string, CartItem[]> = {};
    const assignedItemIds = Object.keys(itemVendorAssignments);

    itemsToAssign.forEach(item => {
      // Use direct lookup to be safe against potential type mismatches (string vs number)
      // and to avoid O(N*M) complexity (though N is small here)
      const vendorId = itemVendorAssignments[item.id];

      if (vendorId) {
        if (!posByVendor[vendorId]) {
          posByVendor[vendorId] = [];
        }

        // Apply price override if exists
        const finalUnitPrice = itemPriceOverrides[item.id] ?? item.unitPrice;
        const finalTotalPrice = finalUnitPrice * item.quantity;

        posByVendor[vendorId].push({
          ...item,
          unitPrice: finalUnitPrice,
          totalPrice: finalTotalPrice
        });
      }
    });

    const existingPoCount = localOrder.purchaseOrders?.length || 0;
    const newPurchaseOrders: PurchaseOrder[] = Object.entries(posByVendor).map(([vendorId, items], index) => {
      // Generate PO ID by inheriting sequence from Order ID
      // If multiple POs, add vendor suffix like V1, V2, V3...
      const vendorSuffix = Object.keys(posByVendor).length > 1 ? `V${existingPoCount + index + 1}` : undefined;
      const poId = generatePOId(localOrder.id, vendorSuffix);

      return {
        id: poId,
        originalOrderId: localOrder.id,
        vendorId,
        items,
        status: 'Issued'
      };
    });

    const updatedOrder = {
      ...localOrder,
      purchaseOrders: [...(localOrder.purchaseOrders || []), ...newPurchaseOrders],
      status: 'Processing' as const
    };

    setLocalOrder(updatedOrder);
    onOrderComplete(updatedOrder);
    setItemVendorAssignments({});
    setItemPriceOverrides({}); // Reset overrides
    setActiveTab('manage');
  };

  const updatePo = (poId: string, updates: Partial<PurchaseOrder>) => {
    if (!canEditPOs) return;
    const updatedOrder = {
      ...localOrder,
      purchaseOrders: localOrder.purchaseOrders?.map(po => po.id === poId ? { ...po, ...updates } : po)
    };
    setLocalOrder(updatedOrder);
    onOrderComplete(updatedOrder);
  };

  const handleInvoiceUpload = (poId: string, file: File) => {
    if (!canEditPOs) return;
    const url = URL.createObjectURL(file);
    updatePo(poId, { invoiceUrl: url });
  };

  const poCount = localOrder.purchaseOrders?.length || 0;

  const AssignItemsView = (
    <div>
      <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left font-bold rounded-tl-2xl">Product</th>
              <th className="px-6 py-3 text-center font-bold">Qty</th>
              <th className="px-6 py-3 text-right font-bold">Unit Price</th>
              <th className="px-6 py-3 text-right font-bold">Total Price</th>
              <th className="px-6 py-3 text-left font-bold rounded-tr-2xl">Vendor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-gray-600 dark:text-gray-300">
            {itemsToAssign.map((item, index) => {
              const isLast = index === itemsToAssign.length - 1;
              const currentUnitPrice = itemPriceOverrides[item.id] ?? item.unitPrice;
              const currentTotalPrice = currentUnitPrice * item.quantity;

              // Determine effective vendor from live product data or item snapshot. Match by SKU.
              const product = products.find(p => p.sku === item.sku);
              // FIX: Prioritize the user's manual assignment from state!
              const effectiveVendorId = itemVendorAssignments[item.id] || product?.vendorId || item.vendorId;

              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className={`px-6 py-4 font-bold text-gray-900 dark:text-white ${isLast ? 'rounded-bl-2xl' : ''}`}>{item.name}</td>
                  <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={isNaN(currentUnitPrice) ? '' : currentUnitPrice}
                        onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 text-right bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">${currentTotalPrice.toFixed(2)}</td>
                  <td className={`px-6 py-4 ${isLast ? 'rounded-br-2xl' : ''}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <CustomSelect
                          value={effectiveVendorId || ''}
                          onChange={(val) => {
                            if (val) {
                              handleVendorSelect(item.id, val);
                              // Find price for the selected vendor
                              const vendorOptions = product?.vendorOptions || [];
                              const opt = vendorOptions.find(vo => vo.vendorId === val);
                              if (opt) {
                                handlePriceChange(item.id, opt.price);
                              } else if (val === item.vendorId) {
                                // Fallback to original item price if it matches original vendor
                                handlePriceChange(item.id, item.unitPrice);
                              }
                            } else {
                              // Handle clearing vendor? Maybe not allowed or just clear assignment
                              setItemVendorAssignments(prev => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                            }
                          }}
                          options={vendors.map(v => {
                            const vendorOptions = product?.vendorOptions || [];
                            const opt = vendorOptions.find(vo => vo.vendorId === v.id);
                            let label = v.name;
                            let rightLabel = null;
                            if (opt) {
                              rightLabel = `$${opt.price.toFixed(2)}`;
                            } else if (v.id === item.vendorId) {
                              rightLabel = `$${item.unitPrice.toFixed(2)}`;
                            }
                            return { value: v.id, label, rightLabel };
                          })}
                          placeholder="Select a vendor..."
                          className="w-full max-w-xs bg-gray-50 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white flex-1"
                          disabled={!canCreatePOs}
                        />
                        <span className="font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          ${currentUnitPrice.toFixed(2)}
                        </span>
                      </div>

                      {(() => {
                        const vendorOptions = product?.vendorOptions || [];
                        // Include the original item price as an option if not already in vendorOptions
                        const allOptions = [...vendorOptions];
                        if (item.vendorId && !allOptions.find(o => o.vendorId === item.vendorId)) {
                          allOptions.push({ id: 'original', vendorId: item.vendorId, price: item.unitPrice, vendorSku: item.sku, isPreferred: false });
                        }

                        if (allOptions.length > 0 && effectiveVendorId) {
                          const currentPrice = currentUnitPrice;
                          const cheapestOption = allOptions.sort((a, b) => a.price - b.price)[0];

                          if (cheapestOption && currentPrice > cheapestOption.price) {
                            const savings = currentPrice - cheapestOption.price;
                            const cheapestVendor = vendors.find(v => v.id === cheapestOption.vendorId);
                            return (
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 mt-1 animate-pulse">
                                <ArrowUpTrayIcon className="w-4 h-4 rotate-180" />
                                Save ${savings.toFixed(2)} with {cheapestVendor?.name || 'Cheaper Vendor'}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div >
      {canCreatePOs && (
        <div className="flex justify-end mt-6">
          <button
            onClick={handleCreatePOs}
            disabled={Object.keys(itemVendorAssignments).length === 0}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 active:scale-95 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
          >
            Create Purchase Order(s)
          </button>
        </div>
      )}
    </div >
  );

  const ManagePOsView = (
    <div className="space-y-6">
      {localOrder.purchaseOrders?.slice().sort((a, b) => a.id.localeCompare(b.id)).map(po => (
        <div key={po.id} className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{po.id}</h2>
              <p className="font-semibold text-gray-500 dark:text-gray-400 mt-1">{vendors?.find(v => v.id === po.vendorId)?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPOStatusTheme(po.status)}`}>
                {po.status}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4">
            <p className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">Items:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400 font-medium">
              {po.items.map(item => <li key={item.id}>{item.name} (Qty: {item.quantity})</li>)}
            </ul>
          </div>
          <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Tracking &amp; Status Management</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-1">Confirmation Number</label>
                <input type="text" value={po.vendorConfirmationNumber || ''} onChange={(e) => updatePo(po.id, { vendorConfirmationNumber: e.target.value })} disabled={po.status !== 'Issued' || !canEditPOs} className="block w-full px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-500 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-1">Invoice Number</label>
                <input type="text" value={po.invoiceNumber || ''} onChange={(e) => updatePo(po.id, { invoiceNumber: e.target.value })} disabled={po.status !== 'Issued' || !canEditPOs} className="block w-full px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-500 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 transition-colors" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-1">Invoice / Confirmation Document</label>
              {po.invoiceUrl ? (
                <div className="flex items-center gap-4">
                  <a href={po.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-400 hover:text-green-300 hover:underline flex items-center gap-1.5">
                    <PaperClipIcon className="w-4 h-4" />
                    View Uploaded Document
                  </a>
                  {po.status === 'Issued' && canEditPOs && (
                    <button onClick={() => updatePo(po.id, { invoiceUrl: undefined })} className="text-xs text-red-400 hover:text-red-300 hover:underline">(Remove)</button>
                  )}
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 text-gray-300 text-sm font-bold px-3 py-2 border-2 border-dashed border-white/20 rounded-lg w-full max-w-xs transition-colors ${po.status !== 'Issued' || !canEditPOs ? 'cursor-not-allowed bg-white/5 text-gray-600' : 'cursor-pointer bg-white/5 hover:bg-white/10'}`}>
                  <ArrowUpTrayIcon className="w-5 h-5 text-gray-400" />
                  Upload PDF/Doc/Image
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,image/*" disabled={po.status !== 'Issued' || !canEditPOs} onChange={(e) => e.target.files && handleInvoiceUpload(po.id, e.target.files[0])} />
                </label>
              )}
            </div>

            {(po.status === 'Purchased' || po.status === 'In Transit' || po.status === 'Received') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-1">ETA</label>
                  <input type="date" value={po.eta || ''} onChange={(e) => updatePo(po.id, { eta: e.target.value })} disabled={po.status === 'Received' || !canEditPOs} className="block w-full px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-500 text-gray-900 dark:text-white font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-1">Carrier</label>
                  <input type="text" placeholder="e.g., UPS, FedEx" value={po.carrier || ''} onChange={(e) => updatePo(po.id, { carrier: e.target.value })} disabled={po.status === 'Received' || !canEditPOs} className="block w-full px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-500 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-1">Tracking Number</label>
                  <input type="text" placeholder="Enter tracking number" value={po.trackingNumber || ''} onChange={(e) => updatePo(po.id, { trackingNumber: e.target.value })} disabled={po.status === 'Received' || !canEditPOs} className="block w-full px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-500 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
              </div>
            )}


            <div className="flex flex-wrap justify-end items-center gap-2">
              {po.status === 'Issued' && canEditPOs && (
                <div className="relative group">
                  <button onClick={() => updatePo(po.id, { status: 'Purchased' })} disabled={!po.vendorConfirmationNumber?.trim() || !po.invoiceUrl} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-lg shadow-blue-600/20 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"><TransactionIcon className="w-5 h-5" />Mark Purchased</button>
                  {(!po.vendorConfirmationNumber?.trim() || !po.invoiceUrl) && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 border border-gray-700">Enter Confirmation # & Upload Document first.</div>}
                </div>
              )}
              {po.status === 'Purchased' && canEditPOs && (
                <div className="relative group">
                  <button onClick={() => {
                    const trackingNum = po.trackingNumber?.trim() || Math.floor(10000000 + Math.random() * 90000000).toString();
                    updatePo(po.id, { status: 'In Transit', trackingNumber: trackingNum });
                  }} disabled={!po.eta} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-lg shadow-cyan-600/20 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none">
                    <ShipmentIcon className="w-5 h-5" />Mark In Transit
                  </button>
                  {(!po.eta) && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 border border-gray-700">Enter ETA first.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <button onClick={() => onBack(localOrder)} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 mb-4 group">
        <ChevronLeftIcon className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to All Orders
      </button>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Procurement: {localOrder.cartName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Create and manage Purchase Orders for this approved order.</p>
        </div>
        {localOrder.status === 'Completed' && (
          <div className="flex items-center gap-2 bg-green-500/20 text-green-300 font-bold py-3 px-5 rounded-xl border border-green-500/30">
            <CheckBadgeIcon className="w-6 h-6" />
            <span>Order Complete</span>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-white/10 mt-6 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('assign')} disabled={itemsToAssign.length === 0} className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors disabled:text-gray-400 dark:disabled:text-gray-600 disabled:border-transparent ${activeTab === 'assign' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500'}`}>Assign Items ({itemsToAssign.length})</button>
          <button onClick={() => setActiveTab('manage')} disabled={poCount === 0} className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors disabled:text-gray-400 dark:disabled:text-gray-600 disabled:border-transparent ${activeTab === 'manage' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500'}`}>Manage POs ({poCount})</button>
        </nav>
      </div>

      {activeTab === 'assign' && itemsToAssign.length > 0 && AssignItemsView}
      {activeTab === 'assign' && itemsToAssign.length === 0 && (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <CheckBadgeIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-white">All items assigned</h3>
          <p className="mt-2 text-gray-400 font-medium">You can now manage the created POs in the "Manage POs" tab.</p>
        </div>
      )}
      {activeTab === 'manage' && poCount > 0 && ManagePOsView}

      {comparisonProduct && comparisonItemId && (
        <VendorComparisonModal
          isOpen={!!comparisonProduct}
          onClose={() => {
            setComparisonProduct(null);
            setComparisonItemId(null);
          }}
          product={comparisonProduct}
          currentVendorId={itemVendorAssignments[comparisonItemId]}
          onSelect={(option) => {
            if (comparisonItemId) {
              handleVendorSelect(comparisonItemId, option.vendorId);
              handlePriceChange(comparisonItemId, option.price);
            }
            setComparisonProduct(null);
            setComparisonItemId(null);
          }}
        />
      )}
    </div>
  );
};

export default ProcurementWorkspace;
