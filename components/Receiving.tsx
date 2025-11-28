
import React, { useState, useMemo } from 'react';
import { Order, PurchaseOrder, PurchaseOrderStatus, Vendor } from '../types';
import { SearchIcon, ReceivingIcon, CheckBadgeIcon, CameraIcon, PencilIcon } from './Icons';
import { usePermissions } from '../contexts/PermissionsContext';
import SignaturePad from './SignaturePad';

interface AugmentedPO extends PurchaseOrder {
    parentOrder: {
        id: string;
        cartName: string;
    }
}

interface ReceivingProps {
    orders: Order[];
    vendors: Vendor[];
    onUpdatePoStatus: (orderId: string, poId: string, newStatus: PurchaseOrderStatus, proofUrl?: string) => void;
    onSelectOrder: (order: Order) => void;
}

const ReceivingCard: React.FC<{
    po: AugmentedPO;
    vendorName: string;
    onUpdatePoStatus: (orderId: string, poId: string, newStatus: PurchaseOrderStatus, proofUrl?: string) => void;
    onSelect: () => void;
    isReceivedTab: boolean;
}> = ({ po, vendorName, onUpdatePoStatus, onSelect, isReceivedTab }) => {
    const itemCount = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const { can } = usePermissions();
    const canReceive = can('receiving:edit');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canReceive) return;
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleMarkAsReceived = () => {
        if (!proofFile || !canReceive) return;
        setIsUploading(true);
        setTimeout(() => {
            const proofUrl = URL.createObjectURL(proofFile);
            onUpdatePoStatus(po.originalOrderId, po.id, 'Received', proofUrl);
            setIsUploading(false);
        }, 300);
    };

    const handleSignatureSave = (blob: Blob) => {
        setIsUploading(true);
        setShowSignaturePad(false);
        setTimeout(() => {
            const proofUrl = URL.createObjectURL(blob);
            onUpdatePoStatus(po.originalOrderId, po.id, 'Received', proofUrl);
            setIsUploading(false);
        }, 300);
    };


    return (
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border transition-all duration-200 hover:bg-muted/40 hover:scale-[1.01]">
            {showSignaturePad && (
                <SignaturePad
                    onSave={handleSignatureSave}
                    onCancel={() => setShowSignaturePad(false)}
                />
            )}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg text-foreground cursor-pointer hover:underline" onClick={onSelect}>{po.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        For Order: <span className="font-medium text-foreground">{po.parentOrder.cartName}</span>
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-bold text-lg text-foreground">{vendorName}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Carrier</p>
                    <p className="font-semibold text-foreground">{po.carrier || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Tracking #</p>
                    <p className="font-semibold text-foreground font-mono">{po.trackingNumber || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">ETA</p>
                    <p className="font-semibold text-foreground">{po.eta || 'Not specified'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Items</p>
                    <p className="font-semibold text-foreground">{itemCount}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                {!isReceivedTab ? (
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-foreground mb-1">Proof of Delivery (Required)</label>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className={`flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 border border-dashed border-border rounded-lg transition-colors ${canReceive ? 'cursor-pointer bg-muted/30 hover:bg-muted text-foreground' : 'cursor-not-allowed bg-muted/30 text-muted-foreground'}`}>
                                <CameraIcon className="w-5 h-5" />
                                {proofFile ? 'Change File' : 'Upload Photo/PDF'}
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} disabled={!canReceive} />
                            </label>
                            <span className="text-xs text-muted-foreground font-medium uppercase">OR</span>
                            <button
                                onClick={() => setShowSignaturePad(true)}
                                disabled={!canReceive}
                                className={`flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 border border-dashed border-border rounded-lg transition-colors ${canReceive ? 'cursor-pointer bg-muted/30 hover:bg-muted text-foreground' : 'cursor-not-allowed bg-muted/30 text-muted-foreground'}`}
                            >
                                <PencilIcon className="w-5 h-5" />
                                Sign on Screen
                            </button>
                            {proofFile && <span className="text-sm text-muted-foreground truncate max-w-xs">{proofFile.name}</span>}
                        </div>
                    </div>
                ) : (
                    po.deliveryProofUrl ? (
                        <a href={po.deliveryProofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-green-600 hover:text-green-500 hover:underline flex items-center gap-2">
                            <CheckBadgeIcon className="w-4 h-4" /> View Proof of Delivery
                        </a>
                    ) : <div></div>
                )}
                <div className="w-full md:w-auto flex justify-end">
                    {isReceivedTab ? (
                        <div className="flex items-center gap-2 bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 font-bold py-2 px-4 rounded-lg text-sm border border-green-200 dark:border-green-500/30">
                            <CheckBadgeIcon className="w-5 h-5" />
                            <span>Received</span>
                        </div>
                    ) : (
                        canReceive && <button
                            onClick={handleMarkAsReceived}
                            disabled={!proofFile || isUploading}
                            className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed shadow-md"
                        >
                            {isUploading ? 'Processing...' : <><CheckBadgeIcon className="w-5 h-5" /> Mark as Received</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const Receiving: React.FC<ReceivingProps> = ({ orders, vendors, onUpdatePoStatus, onSelectOrder }) => {
    const [activeTab, setActiveTab] = useState<'In Transit' | 'Received'>('In Transit');
    const [searchTerm, setSearchTerm] = useState('');

    const allPurchaseOrders = useMemo((): AugmentedPO[] => {
        return orders.flatMap(order =>
            order.purchaseOrders ? order.purchaseOrders.map(po => ({
                ...po,
                parentOrder: {
                    id: order.id,
                    cartName: order.cartName,
                }
            })) : []
        );
    }, [orders]);

    const filteredPOs = useMemo(() => {
        return allPurchaseOrders.filter(po => {
            if (po.status !== activeTab) return false;

            const lowerSearchTerm = searchTerm.toLowerCase();
            const vendor = vendors.find(v => v.id === po.vendorId);

            return (
                po.id.toLowerCase().includes(lowerSearchTerm) ||
                po.parentOrder.id.toLowerCase().includes(lowerSearchTerm) ||
                po.parentOrder.cartName.toLowerCase().includes(lowerSearchTerm) ||
                (vendor && vendor.name.toLowerCase().includes(lowerSearchTerm)) ||
                (po.carrier && po.carrier.toLowerCase().includes(lowerSearchTerm)) ||
                (po.trackingNumber && po.trackingNumber.toLowerCase().includes(lowerSearchTerm))
            );
        });
    }, [allPurchaseOrders, searchTerm, activeTab, vendors]);

    const handleCardClick = (po: AugmentedPO) => {
        const parentOrder = orders.find(o => o.id === po.parentOrder.id);
        if (parentOrder) {
            onSelectOrder(parentOrder);
        }
    };


    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Receiving</h1>
            <p className="text-muted-foreground mt-2 mb-8">Track incoming shipments and mark items as received.</p>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center bg-card p-1 rounded-lg border border-border shadow-sm">
                    <button onClick={() => setActiveTab('In Transit')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'In Transit' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>In Transit</button>
                    <button onClick={() => setActiveTab('Received')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'Received' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Received</button>
                </div>
                <div className="relative w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground/70 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
                        placeholder="Search POs, vendors, tracking..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredPOs.length > 0 ? (
                    filteredPOs.map(po => (
                        <ReceivingCard
                            key={po.id}
                            po={po}
                            vendorName={vendors.find(v => v.id === po.vendorId)?.name || 'N/A'}
                            onUpdatePoStatus={onUpdatePoStatus}
                            onSelect={() => handleCardClick(po)}
                            isReceivedTab={activeTab === 'Received'}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed shadow-sm">
                        <div className="flex flex-col items-center">
                            <ReceivingIcon className="w-16 h-16 text-muted-foreground" />
                            <p className="font-semibold mt-4 text-lg text-foreground">No shipments to display</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {activeTab === 'In Transit'
                                    ? 'There are currently no orders in transit.'
                                    : 'No shipments have been marked as received yet.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Receiving;
