'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Property, Booking } from '@/lib/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('host_id', user.id);

        if (propertiesError) throw propertiesError;
        setProperties(propertiesData || []);

        // If there are properties, fetch recent bookings
        if (propertiesData && propertiesData.length > 0) {
          const propertyIds = propertiesData.map(p => p.id);
          
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false })
            .limit(5);

          if (bookingsError) throw bookingsError;
          setRecentBookings(bookingsData || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user?.user_metadata?.name || 'Host'}!
        </p>
      </header>

      {properties.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <p className="mb-4">You haven't added any properties yet. Create your first property to start accepting bookings.</p>
          <Link
            href="/dashboard/properties/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Add Your First Property
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Total Properties</h2>
              <p className="text-3xl font-bold">{properties.length}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Recent Bookings</h2>
              <p className="text-3xl font-bold">{recentBookings.length}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Upcoming Check-ins</h2>
              <p className="text-3xl font-bold">
                {recentBookings.filter(b => 
                  new Date(b.check_in) >= new Date() && 
                  b.status === 'confirmed'
                ).length}
              </p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Recent Bookings</h2>
            </div>
            {recentBookings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{booking.guest_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.check_in).toLocaleDateString()} to {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
                        </p>
                      </div>
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No bookings yet
              </div>
            )}
            <div className="bg-gray-50 px-6 py-3">
              <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:text-blue-800">
                View all bookings →
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Your Properties</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {properties.map((property) => (
                <div key={property.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{property.name}</p>
                      <p className="text-sm text-gray-600">{property.address}</p>
                    </div>
                    <Link 
                      href={`/dashboard/properties/${property.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <Link href="/dashboard/properties" className="text-sm text-blue-600 hover:text-blue-800">
                View all properties →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 