import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">Track your university applications and SOPs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Universities', value: '0', color: 'blue' },
          { label: 'SOPs Written', value: '0', color: 'violet' },
          { label: 'Critiques Done', value: '0', color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold text-${color}-500 mt-1`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-heading font-semibold text-gray-900 mb-4">Getting Started</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Complete your academic profile
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Add your target universities
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Write your SOP and get AI critique
          </li>
        </ol>
      </div>
    </div>
  );
}
