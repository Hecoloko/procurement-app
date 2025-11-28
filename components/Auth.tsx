
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { DEMO_USERS } from '../constants';
import { ProcureProLogoIcon, XMarkIcon } from './Icons';
import { Select } from './ui/Select';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailConfirmationError, setEmailConfirmationError] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [demoSelection, setDemoSelection] = useState('');

    const executeLogin = async (loginEmail: string, loginPass: string) => {
        setLoading(true);
        setLoginError(null);
        setEmailConfirmationError(false);

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timed out")), 15000);
            });

            const cleanEmail = loginEmail.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
            const trimmedPass = loginPass.trim();

            // Race the login against the timeout
            const loginPromise = async () => {
                // 1. Try to Sign In
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: trimmedPass });

                if (signInError) {
                    // Handle Email Not Confirmed specifically
                    if (signInError.message.includes("Email not confirmed")) {
                        throw new Error("Email not confirmed");
                    }

                    // 2. If Sign In fails, check if this is one of our DEMO users.
                    const isDemoUser = DEMO_USERS.some(u => u.email.toLowerCase() === cleanEmail);

                    if (isDemoUser) {
                        // Try to Sign Up (Fallback for new demo instances)
                        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                            email: cleanEmail,
                            password: trimmedPass,
                            options: {
                                data: {
                                    full_name: DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail)?.name.split(' (')[0]
                                }
                            }
                        });

                        if (signUpError) {
                            const msg = (signUpError.message || "").toLowerCase();
                            if (msg.includes("email not confirmed") || msg.includes("rate limit")) {
                                throw new Error("Email not confirmed");
                            } else if (msg.includes("user already registered")) {
                                throw new Error(`Demo Access Error: Account exists but password mismatch.`);
                            } else if (msg.includes("database error") || msg.includes("saving new user")) {
                                throw new Error("System Error: Database trigger failed. Check ON UPDATE CASCADE.");
                            } else {
                                throw new Error(`Login failed: ${signInError.message}`);
                            }
                        } else if (!signUpData.session) {
                            throw new Error("Email not confirmed");
                        }
                    } else {
                        // Not a demo user, just show the sign in error
                        throw signInError;
                    }
                }
                return { success: true };
            };

            await Promise.race([loginPromise(), timeoutPromise]);

            // Success handled by App.tsx onAuthStateChange

        } catch (error: any) {
            console.error("Login execution error:", error);
            let errorMessage = error.message || "An unexpected error occurred.";

            if (errorMessage.includes("Email not confirmed")) {
                setEmailConfirmationError(true);
            } else if (errorMessage.includes("Invalid Refresh Token")) {
                errorMessage = "Session expired. Please try again.";
                await supabase.auth.signOut();
            } else if (errorMessage.includes("timed out")) {
                errorMessage = "Connection timed out. Please check your internet.";
            }

            setLoginError(errorMessage);
            setLoading(false);
        } finally {
            // Ensure loading state is reset if no session is established
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                setDemoSelection('');
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        executeLogin(email, password);
    };

    const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedEmail = e.target.value;
        setDemoSelection(selectedEmail);

        if (selectedEmail) {
            const trimmed = selectedEmail.trim();
            setEmail(trimmed);
            const defaultPass = 'Xoxoxo123';
            setPassword(defaultPass);
            executeLogin(trimmed, defaultPass);
        }
    };

    if (emailConfirmationError) {
        return (
            <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gradient-to-br from-gray-900 to-black font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-lg bg-black/80 backdrop-blur-xl p-8 rounded-2xl border border-red-500 shadow-2xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Action Required: Disable Email Confirmation</h2>
                    <div className="text-left bg-white/10 p-6 rounded-xl text-gray-300 text-sm space-y-4 mb-6">
                        <p>Supabase is blocking the demo login because it's trying to send a confirmation email to a fake address.</p>
                        <p className="font-bold text-white">To fix this immediately:</p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-green-400 underline hover:text-green-300">Supabase Dashboard</a>.</li>
                            <li>Click <strong>Authentication</strong> (left sidebar) → <strong>Providers</strong>.</li>
                            <li>Click <strong>Email</strong> to expand.</li>
                            <li>Turn <strong>OFF</strong> "Confirm email".</li>
                            <li>Click <strong>Save</strong>.</li>
                        </ol>
                        <p className="text-xs text-gray-400 pt-2">After saving, click "Try Again" below. The login will work instantly.</p>
                    </div>
                    <button
                        onClick={() => { setEmailConfirmationError(false); executeLogin(email, password); }}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gradient-to-br from-gray-900 to-black font-sans">

            <div className="sm:mx-auto sm:w-full sm:max-w-md bg-black/20 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-white/10 p-3 rounded-xl mb-4 shadow-inner">
                        <ProcureProLogoIcon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white">Sign in to ProcurePro</h2>
                    <p className="text-center text-sm text-gray-300 mt-2">Procurement management for modern teams</p>
                </div>

                <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">

                    {/* Demo User Selector */}
                    <div className="mb-6">
                        <label htmlFor="demo-user" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Quick Demo Login</label>
                        <div className="relative">
                            <Select
                                id="demo-user"
                                className="bg-white/10 text-white border-white/10 focus:ring-green-500"
                                onChange={handleDemoSelect}
                                value={demoSelection}
                                disabled={loading}
                            >
                                <option value="" className="bg-gray-900 text-gray-400">Select a user to auto-login...</option>
                                <optgroup label="Company 1 (Alpha Corp)" className="bg-gray-900 text-white">
                                    {DEMO_USERS.filter(u => u.company === 'Company 1').map(u => (
                                        <option key={u.email} value={u.email} className="bg-gray-900 text-white">
                                            {u.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Company 2 (Beta Industries)" className="bg-gray-900 text-white">
                                    {DEMO_USERS.filter(u => u.company === 'Company 2').map(u => (
                                        <option key={u.email} value={u.email} className="bg-gray-900 text-white">
                                            {u.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </Select>
                        </div>
                    </div>

                    {loginError && (
                        <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 animate-pulse">
                            <XMarkIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-200 leading-relaxed font-medium">{loginError}</p>
                                {loginError.includes("Foreign Keys") && (
                                    <p className="text-xs text-red-300 mt-2 italic">Tip: Open your SQL Editor in Supabase and verify that `carts.created_by` and `orders.submitted_by` have `ON UPDATE CASCADE`.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider">
                            <span className="bg-black/50 backdrop-blur-sm px-2 text-gray-400 rounded">Or enter manually</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-200">Email address</label>
                            <div className="mt-2">
                                <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-lg border-0 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 px-3 bg-white/5" placeholder="you@example.com" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-200">Password</label>
                            </div>
                            <div className="mt-2">
                                <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border-0 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 px-3 bg-white/5" placeholder="••••••••" />
                            </div>
                        </div>

                        <div>
                            <button type="submit" disabled={loading} className="flex w-full justify-center rounded-lg bg-green-500 px-3 py-2.5 text-sm font-bold leading-6 text-white shadow-lg hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all duration-200 transform active:scale-95">
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
