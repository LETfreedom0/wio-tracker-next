'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function UserGrowthPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          fetchData(session);
      } else {
          setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchData(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchData(currentSession) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/growth', {
            headers: {
                Authorization: `Bearer ${currentSession.access_token}`
            }
        });
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch data');
        }
        
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
  }

  // Calculate max value for chart normalization
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalUsers = data.reduce((acc, curr) => acc + curr.count, 0);

  // Helper for country colors
  const getCountryColor = (country) => {
    const palette = {
        'CN': '#ef4444', // red-500
        'US': '#3b82f6', // blue-500
        'GB': '#6366f1', // indigo-500
        'DE': '#eab308', // yellow-500
        'FR': '#a855f7', // purple-500
        'JP': '#ec4899', // pink-500
        'UNKNOWN': '#9ca3af' // gray-400
    };
    if (palette[country]) return palette[country];
    const colors = ['#10b981', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
    const hash = country.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <main className="flex-grow max-w-7xl w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Growth Dashboard</h1>
        
        {!session ? (
             <div className="text-center py-12">
                <h2 className="text-xl font-medium text-gray-900">Access Denied</h2>
                <p className="mt-2 text-gray-500">Please login to view this page.</p>
                <div className="mt-6">
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                        Go to Login &rarr;
                    </Link>
                </div>
            </div>
        ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700 font-bold">
                            Error: {error}
                        </p>
                        {error.includes('Configuration Error') ? (
                            <p className="text-sm text-red-600 mt-2">
                                <strong>Tip:</strong> Environment variables (like .env.local) are loaded when the server starts.
                                <br/>
                                <span className="block mt-1 bg-yellow-100 p-1 rounded border border-yellow-200 text-yellow-800">
                                    Please <strong>restart your development server</strong> (Ctrl+C and npm run dev) to apply the changes.
                                </span>
                            </p>
                        ) : error.includes('Forbidden') ? (
                            <p className="text-sm text-red-600 mt-2">
                                Your email ({session.user.email}) is not authorized to view this page. 
                                <br/>Please ensure it is added to <code className="bg-red-100 px-1 py-0.5 rounded text-red-800">ADMIN_EMAILS</code> in your environment variables and restart the server.
                            </p>
                        ) : error.includes('Service Role Key') ? (
                            <div className="mt-2">
                                <p className="text-sm text-red-600">
                                Please verify that your <code className="bg-red-100 px-1 py-0.5 rounded text-red-800">.env.local</code> file contains the <code className="bg-red-100 px-1 py-0.5 rounded text-red-800">SUPABASE_SERVICE_ROLE_KEY</code> variable.
                                </p>
                                <p className="text-xs text-red-500 mt-1">
                                This key is required to bypass Row Level Security and fetch all user data.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        ) : loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        ) : (
            <>
                {/* Stats Overview */}
                <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate uppercase tracking-wider">Total Users</dt>
                        <dd className="mt-1 text-4xl font-semibold text-gray-900">{totalUsers}</dd>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Daily New Users</h3>
                        <div className="flex gap-2 text-xs flex-wrap">
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1" style={{backgroundColor: '#ef4444'}}></span>CN</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1" style={{backgroundColor: '#3b82f6'}}></span>US</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1" style={{backgroundColor: '#6366f1'}}></span>GB</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1" style={{backgroundColor: '#eab308'}}></span>DE</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-1" style={{backgroundColor: '#9ca3af'}}></span>Other</div>
                        </div>
                    </div>
                    
                    {data.length > 0 ? (
                        <div className="h-64 flex items-end space-x-2 overflow-x-auto pb-4 pt-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative">
                            {data.map((item) => (
                                <div key={item.date} className="flex flex-col items-center group min-w-[40px] flex-shrink-0 h-full justify-end cursor-pointer">
                                    <div 
                                        className="w-8 rounded-t overflow-hidden relative flex flex-col-reverse"
                                        style={{ height: `${Math.max((item.count / maxCount) * 80, 4)}%` }} // Leave space for date labels
                                    >
                                        {/* Segments */}
                                        {item.countries && Object.entries(item.countries).map(([country, count]) => (
                                            <div 
                                                key={country}
                                                style={{ height: `${(count / item.count) * 100}%`, backgroundColor: getCountryColor(country) }}
                                                className="w-full transition-all hover:brightness-110"
                                            />
                                        ))}
                                        {!item.countries && <div className="w-full h-full bg-indigo-500"></div>}

                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-2 px-3 z-50 whitespace-nowrap shadow-lg transition-opacity duration-200 pointer-events-none min-w-[120px]">
                                            <div className="font-bold text-center border-b border-gray-700 pb-1 mb-1">{item.date}</div>
                                            <div className="font-semibold text-center mb-1">{item.count} Total Users</div>
                                            {item.countries && (
                                                <div className="space-y-1">
                                                    {Object.entries(item.countries)
                                                        .sort(([,a], [,b]) => b - a) // Sort by count desc
                                                        .map(([code, c]) => (
                                                        <div key={code} className="flex justify-between items-center text-[10px] gap-3">
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: getCountryColor(code)}}></span>
                                                                <span>{code}</span>
                                                            </div>
                                                            <span>{c}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 rotate-45 origin-top-left w-16 truncate">
                                        {item.date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                            <p className="text-gray-500">No growth data available yet.</p>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Detailed Data</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Breakdown of user registrations by date.</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                            {data.length > 0 ? (
                                data.slice().reverse().map((item) => (
                                    <li key={item.date} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium text-indigo-600">
                                                {item.date}
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    +{item.count} New Users
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-8 text-center text-sm text-gray-500">
                                    No records found.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}
