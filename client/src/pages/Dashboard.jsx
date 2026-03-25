import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Building2, FileText, Star, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ universities: 0, sops: 0, critiques: 0 });

  useEffect(() => {
    apiClient.get('/api/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Universities', value: stats.universities, icon: Building2, color: 'blue', to: '/universities' },
    { label: 'SOPs Written', value: stats.sops, icon: FileText, color: 'violet', to: '/universities' },
    { label: 'Critiques Done', value: stats.critiques, icon: Star, color: 'green', to: '/universities' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your university applications and SOPs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{label}</p>
              <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                <Icon size={16} className={`text-${color}-500`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-heading font-semibold text-gray-900 mb-4">Getting Started</h2>
          <ol className="space-y-3">
            {[
              { label: 'Complete your academic profile', to: '/profile' },
              { label: 'Add your target universities', to: '/universities' },
              { label: 'Write your SOP and get AI critique', to: '/universities' },
            ].map(({ label, to }, i) => (
              <li key={i}>
                <Link to={to} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 group">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {label}
                  <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
          <h2 className="font-heading font-semibold text-blue-900 mb-2">Your Plan</h2>
          <p className="text-sm text-blue-700 mb-3 capitalize">{user?.plan} Plan</p>
          {user?.plan === 'free' && (
            <>
              <p className="text-xs text-blue-600 mb-3">Free plan: up to 3 universities, 1 critique each.</p>
              <div className="text-xs text-blue-500 font-medium">Upgrade for unlimited access →</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
