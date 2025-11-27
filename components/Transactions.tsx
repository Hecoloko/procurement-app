
import React, { useState, Fragment } from 'react';
import { Transaction, TransactionStatus, ProcessHistoryEvent } from '../types';
import { 
    SearchIcon, FilterIcon, EllipsisHorizontalIcon, DocumentDuplicateIcon, LinkIcon,
    PaperClipIcon, ArrowDownTrayIcon, XMarkIcon, CheckCircleIcon, ClockIcon,
    TransactionIcon, ChevronRightIcon
} from './Icons';

// Dummy Data
const dummyTransactions: Transaction[] = [
    {
        id: '#QARUdtDipNBJkGgbFBMP',
        submitter: 'Victoria Kerts',
        submitterId: 'OB20240000250058',
        receiverId: '5432109876',
        documentType: 'Bill',
        documentDate: '22/12/2024',
        approvalStatus: 'Pending',
        ettn: 'a1b2c3d-e4f5-33gh-77h3-g',
        invoiceNumber: '4566891256',
        documentNumber: 'QARUdtDipNBJkGgbFBMP',
        portalLink: '#',
        attachments: [
            { name: 'invoiceiwei.pdf', size: '4mb' },
            { name: 'paiddoct5.pdf', size: '4mb' },
        ],
        processHistory: [
            { id: 'hist-1-3', title: 'Invoice Approved', description: 'The invoice was approved by the authorized person.', timestamp: 'Jan,4 2025 ∙ 23:59:42', status: 'in_progress' },
            { id: 'hist-1-2', title: 'Signature Process Completed', description: 'The invoice was successfully signed.', timestamp: 'Jan,4 2025 ∙ 23:59:42', status: 'in_progress' },
            { id: 'hist-1-1', title: 'Invoice Created', description: 'Invoice successfully created and saved in the system.', timestamp: 'Jan,4 2025 ∙ 23:59:41', status: 'completed' },
        ]
    },
    {
        id: '#e8c67b0-c78e-11ef-95d1-e',
        submitter: 'Emma Thompson',
        submitterId: 'OB202400000150023',
        receiverId: '1234567890',
        documentType: 'Receipt',
        documentDate: '18/12/2024',
        approvalStatus: 'Failed',
        ettn: 'e8c67b0-c78e-11ef-95d1-e',
        invoiceNumber: '9876543210',
        documentNumber: 'e8c67b0-c78e-11ef-95d1-e',
        portalLink: '#',
        attachments: [],
        processHistory: [
            { id: 'hist-2-1', title: 'Approval Failed', description: 'Missing required documentation.', timestamp: 'Dec,19 2024 ∙ 10:30:00', status: 'completed' }
        ]
    },
    {
        id: '#q1w2e3r-t4y5-s5k-99j5-L',
        submitter: 'Lucas Santos',
        submitterId: 'OB202400000645789',
        receiverId: '8901234567',
        documentType: 'Bill',
        documentDate: '29/12/2024',
        approvalStatus: 'Completed',
        ettn: 'q1w2e3r-t4y5-s5k-99j5-L',
        invoiceNumber: '1122334455',
        documentNumber: 'q1w2e3r-t4y5-s5k-99j5-L',
        portalLink: '#',
        attachments: [{ name: 'final_invoice.pdf', size: '2.1mb' }],
        processHistory: [
            { id: 'hist-3-2', title: 'Payment Sent', description: 'Payment processed via bank transfer.', timestamp: 'Jan,5 2025 ∙ 14:00:00', status: 'completed' },
            { id: 'hist-3-1', title: 'Invoice Approved', description: 'Approved by management.', timestamp: 'Jan,2 2025 ∙ 11:00:00', status: 'completed' }
        ]
    },
];

const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const themes = {
        Completed: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-800 dark:text-green-300', dot: 'bg-green-500' },
        Pending: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-500' },
        Failed: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-500' },
        Approved: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-800 dark:text-green-300', dot: 'bg-green-500' },
    };
    const theme = themes[status] || themes.Pending;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border ${theme.bg} ${theme.text}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${theme.dot}`}></span>
            {status}
        </span>
    );
};


const TransactionCard: React.FC<{ transaction: Transaction, onSelect: () => void }> = ({ transaction, onSelect }) => (
    <div onClick={onSelect} className="bg-card p-5 rounded-2xl border border-border shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-muted/40 hover:scale-[1.02]">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-foreground">{transaction.submitter}</p>
                <p className="text-xs text-muted-foreground">ID: {transaction.submitterId}</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
                <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Receiver ID</span>
                <span className="font-medium text-foreground">{transaction.receiverId}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Document Type</span>
                <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">{transaction.documentType}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Document Date</span>
                <span className="font-medium text-foreground">{transaction.documentDate}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Approval Status</span>
                <StatusBadge status={transaction.approvalStatus} />
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground font-mono truncate">{transaction.ettn}</p>
            <DocumentDuplicateIcon className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"/>
        </div>
    </div>
);

const TransactionDetailDrawer: React.FC<{ transaction: Transaction | null; onClose: () => void }> = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const getHistoryIcon = (status: ProcessHistoryEvent['status']) => {
        switch(status) {
            case 'completed': return <CheckCircleIcon className="w-5 h-5 text-white bg-green-500 rounded-full p-0.5 shadow-sm" />;
            case 'in_progress': return <div className="w-5 h-5 bg-blue-500 rounded-full p-1"><div className="w-full h-full bg-white rounded-full animate-pulse"></div></div>;
            default: return <ClockIcon className="w-5 h-5 text-muted-foreground" />;
        }
    };
    
    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${transaction ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div 
                onClick={(e) => e.stopPropagation()}
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${transaction ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full text-foreground">
                    {/* Header */}
                    <div className="p-6 border-b border-border bg-muted/10">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-xl text-foreground truncate" title={transaction.id}>{transaction.id}</h2>
                            <div className="flex items-center space-x-2">
                                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><EllipsisHorizontalIcon className="w-5 h-5" /></button>
                                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{transaction.submitter} ∙ {new Date(transaction.documentDate.split('/').reverse().join('-')).toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-8">
                        {/* Invoice Detail */}
                        <section>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4 tracking-wider">Invoice Detail</h3>
                            <div className="space-y-4 text-sm bg-muted/20 p-4 rounded-xl border border-border">
                                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><TransactionIcon className="w-4 h-4"/>Invoice Number</span> <span className="font-medium text-foreground">{transaction.invoiceNumber}</span></div>
                                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><DocumentDuplicateIcon className="w-4 h-4"/>Document Number</span> <span className="font-medium text-foreground flex items-center group cursor-pointer">{transaction.documentNumber.substring(0, 10)}... <DocumentDuplicateIcon className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"/></span></div>
                                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><ClockIcon className="w-4 h-4"/>Status</span> <StatusBadge status={transaction.approvalStatus} /></div>
                                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><EllipsisHorizontalIcon className="w-4 h-4"/>ETTN</span> <span className="font-medium text-foreground flex items-center group cursor-pointer">{transaction.ettn.substring(0, 10)}... <DocumentDuplicateIcon className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"/></span></div>
                                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><LinkIcon className="w-4 h-4"/>Links</span> <a href={transaction.portalLink} className="font-medium text-blue-500 hover:text-blue-400 hover:underline flex items-center transition-colors">View in Portal <ChevronRightIcon className="w-3 h-3 ml-1"/></a></div>
                            </div>
                        </section>
                        
                        {/* Attachments */}
                        <section>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4 tracking-wider">Attachments</h3>
                            <div className="flex flex-wrap gap-3">
                                {transaction.attachments.map(att => (
                                    <button key={att.name} className="flex items-center bg-muted hover:bg-muted/80 border border-border transition-all text-foreground text-sm font-medium px-4 py-2 rounded-lg">
                                        <PaperClipIcon className="w-4 h-4 mr-2 text-muted-foreground"/>
                                        {att.name} <span className="text-muted-foreground ml-2 text-xs">({att.size})</span>
                                    </button>
                                ))}
                                {transaction.attachments.length === 0 && <span className="text-muted-foreground text-sm italic">No attachments.</span>}
                            </div>
                        </section>

                        {/* Process History */}
                        <section>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4 tracking-wider">Process History</h3>
                            <div className="relative pl-2">
                                {transaction.processHistory.map((event, index) => (
                                    <div key={event.id} className="flex items-start mb-8 last:mb-0 relative">
                                         {/* Line */}
                                         {index < transaction.processHistory.length - 1 && (
                                            <div className="absolute left-[9px] top-6 bottom-[-32px] w-[2px] bg-border"></div>
                                        )}
                                        <div className="flex flex-col items-center mr-4 z-10 mt-0.5">
                                            {getHistoryIcon(event.status)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-sm">{event.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1 font-mono">{event.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Transactions: React.FC = () => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    return (
        <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-2 mb-8">Review and manage all financial transactions.</p>
            
            {/* Header / Actions */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center bg-card p-1 rounded-lg border border-border">
                    <button className="px-4 py-1.5 bg-muted text-foreground rounded-md shadow-sm text-sm font-medium transition-colors">Cards</button>
                    <button className="px-4 py-1.5 text-muted-foreground hover:text-foreground rounded-md text-sm font-medium transition-colors">Table</button>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <SearchIcon className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"/>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="pl-10 pr-4 py-2 w-full sm:w-64 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                        <FilterIcon className="w-5 h-5"/>
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Transaction Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dummyTransactions.map(tx => (
                    <TransactionCard key={tx.id} transaction={tx} onSelect={() => setSelectedTransaction(tx)} />
                ))}
            </div>
            
            <TransactionDetailDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
        </div>
    );
};

export default Transactions;
