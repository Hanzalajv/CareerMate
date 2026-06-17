'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestDBPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();
        
        // Test: Try to fetch users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(5);
        
        if (usersError) throw usersError;
        
        setData(users);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Connecting to Supabase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-900/50 p-6 rounded-lg border border-red-500 max-w-lg">
          <h2 className="text-red-400 text-xl font-bold mb-2">Connection Failed</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-4">✅ Connected to Supabase!</h1>
        <p className="text-gray-400 mb-6">Found {data?.length || 0} users in the database.</p>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-gray-300 font-semibold mb-2">Users:</h2>
          {data && data.length > 0 ? (
            <pre className="text-sm text-gray-400 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No users found. (This is fine — you haven't added any yet!)</p>
          )}
        </div>
        
        <div className="mt-6 bg-green-900/30 p-4 rounded-lg border border-green-500">
          <p className="text-green-400">🎉 Your app is successfully connected to Supabase!</p>
          <p className="text-gray-400 text-sm mt-2">Try adding a user in Supabase and refresh this page.</p>
        </div>
      </div>
    </div>
  );
}