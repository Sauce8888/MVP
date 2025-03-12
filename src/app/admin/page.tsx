'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Host = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  stripe_account_id: string | null;
  google_calendar_connected: boolean;
  properties: {
    id: string;
    name: string;
    base_rate: number;
    created_at: string;
  }[];
};

export default function AdminDashboard() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Simple admin authentication (for demo purposes)
  const [password, setPassword] = useState('');
  
  // In a real app, you'd use proper authentication
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  
  useEffect(() => {
    // Check if admin is authenticated from localStorage
    const adminAuth = localStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      fetchHosts();
    } else {
      setLoading(false);
    }
    
    async function fetchHosts() {
      try {
        // Fetch hosts with their properties
        const { data, error: hostsError } = await supabase
          .from('hosts')
          .select(`
            *,
            properties:properties(id, name, base_rate, created_at)
          `)
          .order('created_at', { ascending: false });
          
        if (hostsError) throw hostsError;
        
        setHosts(data || []);
      } catch (err: any) {
        console.error('Error fetching hosts:', err);
        setError('Failed to load hosts data');
      } finally {
        setLoading(false);
      }
    }
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      fetchHosts();
    } else {
      setError('Invalid password');
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
  };
  
  async function fetchHosts() {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch hosts with their properties
      const { data, error: hostsError } = await supabase
        .from('hosts')
        .select(`
          *,
          properties:properties(id, name, base_rate, created_at)
        `)
        .order('created_at', { ascending: false });
        
      if (hostsError) throw hostsError;
      
      setHosts(data || []);
    } catch (err: any) {
      console.error('Error fetching hosts:', err);
      setError('Failed to load hosts data');
    } finally {
      setLoading(false);
    }
  }
  
  // Admin login form
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Hosts Overview</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-lg font-medium text-blue-700">Total Hosts</p>
                <p className="text-3xl font-bold">{hosts.length}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-lg font-medium text-green-700">Total Properties</p>
                <p className="text-3xl font-bold">
                  {hosts.reduce((total, host) => total + host.properties.length, 0)}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-lg font-medium text-purple-700">Connected to Stripe</p>
                <p className="text-3xl font-bold">
                  {hosts.filter(host => host.stripe_account_id).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Host Details</h2>
          </div>
          
          {hosts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hosts found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {hosts.map(host => (
                <div key={host.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{host.name}</h3>
                      <p className="text-gray-600">{host.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(host.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        host.stripe_account_id 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {host.stripe_account_id ? 'Stripe Connected' : 'No Stripe'}
                      </span>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        host.google_calendar_connected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {host.google_calendar_connected ? 'Calendar Connected' : 'No Calendar'}
                      </span>
                    </div>
                  </div>
                  
                  {host.properties.length === 0 ? (
                    <p className="text-gray-500">No properties</p>
                  ) : (
                    <>
                      <h4 className="font-medium mb-2">Properties ({host.properties.length})</h4>
                      <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
                        {host.properties.map(property => (
                          <div key={property.id} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{property.name}</p>
                              <p className="text-sm text-gray-600">${property.base_rate}/night</p>
                            </div>
                            <Link 
                              href={`/widget/${property.id}`} 
                              target="_blank"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Booking Widget
                            </Link>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 