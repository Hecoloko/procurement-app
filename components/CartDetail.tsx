
import React, { useState, useEffect, useMemo } from 'react';
import { Cart, CartItem, Property, Product } from '../types';
import { ChevronLeftIcon, DocumentReportIcon, PencilIcon, PlusIcon, TrashIcon, BuildingOfficeIcon, CalendarIcon, ArrowDownTrayIcon } from './Icons';
import ManualAddItemModal from './ManualAddItemModal';
import { usePermissions } from '../contexts/PermissionsContext';

interface CartDetailProps {
  cart: Cart;
  onBack: () => void;
  onOpenCatalog: () => void;
  onManualAdd: (itemData: { name: string; sku: string; quantity: number; unitPrice: number; note?: string; }) => void;
  onUpdateCartName: (cartId: string, newName: string) => void;
  onUpdateCartItem: (product: { sku: string; name: string; unitPrice: number; vendorId?: string }, newQuantity: number, note?: string) => void;
  onSubmitForApproval: (cartId: string) => void;
  onRevertToDraft: (cartId: string) => void;
  properties: Property[];
  onOpenEditSchedule: (cart: Cart) => void;
  products: Product[];
}

const EditableNote: React.FC<{
  item: CartItem;
  onUpdateCartItem: (product: { sku: string; name: string; unitPrice: number; vendorId?: string }, newQuantity: number, note?: string) => void;
}> = ({ item, onUpdateCartItem }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(item.note || '');
  const { can } = usePermissions();
  const canEdit = can('carts:edit') || can('carts:edit-own');

  const handleSave = () => {
    if (note.trim() !== (item.note || '')) {
      onUpdateCartItem(
        { sku: item.sku, name: item.name, unitPrice: item.unitPrice, vendorId: item.vendorId },
        item.quantity,
        note.trim()
      );
    }
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    if (!canEdit) return;
    setNote(item.note || '');
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="mt-1 flex items-center gap-1">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="w-full text-xs p-1 border rounded border-gray-300 focus:ring-green-500 focus:border-green-500"
          placeholder="Add a note..."
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className={`mt-1 group flex items-center gap-2 text-xs text-gray-500 ${canEdit ? 'cursor-pointer' : ''}`} onClick={handleStartEditing}>
      {item.note ? (
        <p className="italic hover:bg-gray-100 p-1 rounded" title={item.note}>Note: {item.note}</p>
      ) : (
        <p className="italic text-gray-400 hover:bg-gray-100 p-1 rounded">{canEdit ? 'Add Note' : 'No note'}</p>
      )}
      {canEdit && (
        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <PencilIcon className="w-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  );
};


const getScheduleSummary = (cart: Cart): { icon: React.FC<any>, label: string, value: string }[] => {
  const details = [];
  if (cart.type === 'Scheduled' && cart.scheduledDate) {
    details.push({ icon: CalendarIcon, label: 'Scheduled Date', value: cart.scheduledDate });
  }
  if (cart.type === 'Recurring') {
    if (cart.frequency) details.push({ icon: CalendarIcon, label: 'Frequency', value: cart.frequency });
    if (cart.startDate) details.push({ icon: CalendarIcon, label: 'Start Date', value: cart.startDate });
    if (cart.dayOfWeek !== undefined) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      details.push({ icon: CalendarIcon, label: 'Day of Week', value: days[cart.dayOfWeek] });
    }
    if (cart.dayOfMonth) details.push({ icon: CalendarIcon, label: 'Day of Month', value: cart.dayOfMonth.toString() });
  }
  return details;
};

// Helper function to convert cart data to CSV format and trigger download
const exportCartToCSV = (cart: Cart) => {
  if (!cart) return;

  const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
  const estimatedTax = subtotal * 0.08;
  const grandTotal = subtotal + estimatedTax;

  let csvContent = "data:text/csv;charset=utf-8,";

  // Header
  csvContent += "Product,SKU,Quantity,Unit Price,Total Price,Note\r\n";

  // Items
  cart.items.forEach(item => {
    const row = [
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.quantity,
      item.unitPrice.toFixed(2),
      item.totalPrice.toFixed(2),
      `"${(item.note || '').replace(/"/g, '""')}"`
    ].join(',');
    csvContent += row + "\r\n";
  });

  // Summary
  csvContent += "\r\n";
  csvContent += `Subtotal,,,,"",${subtotal.toFixed(2)}\r\n`;
  csvContent += `Estimated Tax (8%),,,,"",${estimatedTax.toFixed(2)}\r\n`;
  csvContent += `Grand Total,,,,"",${grandTotal.toFixed(2)}\r\n`;

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const fileName = `Cart-Export-${cart.name.replace(/\s/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
};


const CartDetail: React.FC<CartDetailProps> = ({ cart, onBack, onOpenCatalog, onManualAdd, onUpdateCartName, onUpdateCartItem, onSubmitForApproval, onRevertToDraft, properties, onOpenEditSchedule, products }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const { can } = usePermissions();

  const canEditCart = can('carts:edit') || can('carts:edit-own');
  const canSubmitCart = can('carts:submit');
  const canDeleteItems = can('carts:edit') || can('carts:edit-own');

  const baseName = cart.name;

  const [editedName, setEditedName] = useState(baseName);

  const property = useMemo(() => properties?.find(p => p.id === cart.propertyId), [properties, cart.propertyId]);
  const scheduleDetails = useMemo(() => getScheduleSummary(cart), [cart]);

  useEffect(() => {
    setEditedName(cart.name);
  }, [cart.name]);


  const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
  const estimatedTax = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + estimatedTax;

  // Robust check for submittable state
  const isDraftStatus = cart.status === 'Draft' || cart.status === 'Ready for Review';
  const hasItems = cart.items && cart.items.length > 0;
  const isSubmittable = isDraftStatus && hasItems;

  // Tooltip for disabled button
  let submitDisabledReason = '';
  if (!isDraftStatus) submitDisabledReason = `Current status is ${cart.status}`;
  else if (!hasItems) submitDisabledReason = 'Cart is empty';

  const handleSaveManualItem = (itemData: { name: string; sku: string; quantity: number; unitPrice: number; note?: string; }) => {
    onManualAdd(itemData);
    setIsModalOpen(false);
  };

  const handleNameSave = () => {
    if (!canEditCart) return;
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== baseName) {
      onUpdateCartName(cart.id, trimmedName);
    }
    setIsEditingName(false);
  };

  const handleItemDelete = (item: CartItem) => {
    if (window.confirm(`Are you sure you want to remove "${item.name}" from the cart?`)) {
      const productInfo = { sku: item.sku, name: item.name, unitPrice: item.unitPrice, vendorId: item.vendorId };
      onUpdateCartItem(productInfo, 0, item.note);
    }
  };

  const handleExport = () => {
    exportCartToCSV(cart);
  };

  const handleDownloadPdf = () => {
    window.print();
  };


  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-2">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Back to all carts
          </button>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setEditedName(baseName);
                    setIsEditingName(false);
                  }
                }}
                onBlur={handleNameSave}
                className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight bg-white dark:bg-gray-800 border-b-2 border-green-500 focus:outline-none p-0"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => canEditCart && setIsEditingName(true)}
                className={`text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2 group ${canEditCart ? 'cursor-pointer' : 'cursor-default'}`}
                title={canEditCart ? "Click to edit name" : ""}
              >
                {baseName}
                {canEditCart && <PencilIcon className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </h1>
            )}
            {cart.workOrderId && <h1 className="text-3xl md:text-4xl font-bold text-gray-400 tracking-tight">#{cart.workOrderId}</h1>}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-500">Status: <span className="font-semibold text-gray-700">{cart.status}</span></p>
            {property && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">{property.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExport} className="flex items-center bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 shadow-sm transition-all duration-200 active:scale-95">
            <DocumentReportIcon className="w-5 h-5 mr-2" />
            Export
          </button>
          <button onClick={handleDownloadPdf} className="flex items-center bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 shadow-sm transition-all duration-200 active:scale-95">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Download PDF
          </button>

          {cart.status === 'Submitted' ? (
            <button
              onClick={() => onRevertToDraft(cart.id)}
              className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95"
              title="Revert status to Draft to edit"
            >
              Revert to Draft
            </button>
          ) : canSubmitCart && (
            <button
              onClick={() => onSubmitForApproval(cart.id)}
              disabled={!isSubmittable}
              title={!isSubmittable ? submitDisabledReason : "Submit for Approval"}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit for Approval
            </button>
          )}
        </div>
      </div>

      {/* Add Item actions */}
      {canEditCart && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onOpenCatalog}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 p-4 rounded-lg border border-gray-200 dark:border-white/10 transition-colors duration-200"
            >
              <p className="font-semibold text-gray-800 dark:text-gray-100">Add from Catalog</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Browse approved items and add to cart.</p>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 p-4 rounded-lg border border-gray-200 dark:border-white/10 transition-colors duration-200"
            >
              <p className="font-semibold text-gray-800 dark:text-gray-100">Add Manually</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">For one-off items not in the catalog.</p>
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Product</th>
              <th scope="col" className="px-6 py-3">SKU</th>
              <th scope="col" className="px-6 py-3 text-center">Quantity</th>
              <th scope="col" className="px-6 py-3 text-right">Unit Price</th>
              <th scope="col" className="px-6 py-3 text-right">Total</th>
              <th scope="col" className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item: CartItem) => (
              <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 align-top">
                  <div>{item.name}</div>
                  <EditableNote item={item} onUpdateCartItem={onUpdateCartItem} />
                </th>
                <td className="px-6 py-4 align-top">{item.sku}</td>
                <td className="px-6 py-4 text-center align-top">{item.quantity}</td>
                <td className="px-6 py-4 text-right align-top">${item.unitPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-100 align-top">${item.totalPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-center align-top">
                  <div className="flex justify-center items-center space-x-2">
                    {canDeleteItems && (
                      <button
                        onClick={() => handleItemDelete(item)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-md transition-colors duration-200"
                        aria-label={`Remove ${item.name}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cart.items.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">This cart is empty</h3>
            <p className="mt-1 text-gray-500">Get started by adding items above.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex justify-end mt-8 items-start gap-8">
        {scheduleDetails.length > 0 && (
          <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Schedule Details</h3>
              {canEditCart && <button onClick={() => onOpenEditSchedule(cart)} className="text-sm font-semibold text-green-600 hover:text-green-800">Edit</button>}
            </div>
            <div className="space-y-2">
              {scheduleDetails.map((detail, index) => (
                <div key={index} className="flex justify-between text-gray-600 text-sm">
                  <span className="flex items-center gap-2"><detail.icon className="w-4 h-4 text-gray-400" /> {detail.label}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Cart Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Est. Tax (8%)</span>
              <span>${estimatedTax.toFixed(2)}</span>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <div className="flex justify-between text-gray-900 dark:text-gray-100 font-bold text-lg">
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <ManualAddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveManualItem}
        products={products}
      />

      {/* Printable View - No longer uses Tailwind 'hidden' */}
      <div className="printable-area">
        <div className="p-10 font-sans">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Request</h1>
              <p className="text-gray-500 mt-1">ProcurePro Systems Inc.</p>
              <p className="text-sm text-gray-500">123 Innovation Drive, Tech City, 12345</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">{property?.name}</h2>
              <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Cart ID: {cart.id}</p>
            </div>
          </div>

          <div className="my-8">
            <h2 className="text-2xl font-bold text-gray-800">{cart.name}</h2>
            <p className="text-gray-600">Status: <span className="font-semibold">{cart.status}</span></p>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Product</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">SKU</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Quantity</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Unit Price</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item: CartItem) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {item.name}
                    {item.note && <div className="text-xs font-normal text-gray-500 italic">Note: {item.note}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">${item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-8">
            <div className="w-full max-w-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Est. Tax (8%)</span>
                  <span className="font-medium">${estimatedTax.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-gray-900 font-bold text-lg">
                  <span>Grand Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
            <p>Thank you for your business.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDetail;