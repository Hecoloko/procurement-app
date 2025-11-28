import React from 'react';
import { CloudIcon, CheckCircleIcon } from './Icons';

const Integrations: React.FC = () => {
    const integrations = [
        { name: 'QuickBooks Online', status: 'Connected', description: 'Sync invoices and payments automatically.', icon: 'QB' },
        { name: 'Slack', status: 'Connected', description: 'Receive notifications for approval requests.', icon: 'SL' },
        { name: 'NetSuite', status: 'Disconnected', description: 'Enterprise resource planning synchronization.', icon: 'NS' },
        { name: 'Outlook / Gmail', status: 'Coming Soon', description: 'Email integration for communication threads.', icon: 'EM' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Integrations</h1>
                    <p className="text-muted-foreground mt-1">Manage your connections with external tools and services.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <div key={integration.name} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {integration.icon}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${integration.status === 'Connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    integration.status === 'Disconnected' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {integration.status === 'Connected' && <CheckCircleIcon className="w-3 h-3" />}
                                {integration.status}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground mb-6 h-10">{integration.description}</p>

                        <button
                            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${integration.status === 'Connected'
                                    ? 'bg-background border border-border text-foreground hover:bg-muted'
                                    : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                                }`}
                            disabled={integration.status === 'Coming Soon'}
                        >
                            {integration.status === 'Connected' ? 'Manage' : integration.status === 'Coming Soon' ? 'Notify Me' : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-muted/30 rounded-2xl p-8 border border-dashed border-border flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-background rounded-full shadow-sm mb-4">
                    <CloudIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Need a custom integration?</h3>
                <p className="text-muted-foreground max-w-md mt-2 mb-6">
                    We can build custom connectors for your specific ERP or internal tools. Contact our engineering team for details.
                </p>
                <button className="text-primary font-medium hover:underline">Contact Support &rarr;</button>
            </div>
        </div>
    );
};

export default Integrations;
