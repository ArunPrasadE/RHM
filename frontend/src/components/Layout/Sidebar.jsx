import { NavLink, useNavigate } from 'react-router-dom';

const rentalNavigation = [
  { name: 'Dashboard', nameTamil: 'டாஷ்போர்டு', href: '/rental', icon: DashboardIcon },
  { name: 'Houses', nameTamil: 'வீடுகள்', href: '/rental/houses', icon: HouseIcon },
  { name: 'Tenants', nameTamil: 'வாடகைதாரர்கள்', href: '/rental/tenants', icon: UsersIcon },
  { name: 'Payments', nameTamil: 'பணம்', href: '/rental/payments', icon: PaymentIcon },
  { name: 'Expenses', nameTamil: 'செலவுகள்', href: '/rental/expenses', icon: ExpenseIcon },
  { name: 'Reports', nameTamil: 'அறிக்கைகள்', href: '/rental/reports', icon: ReportIcon },
  { name: 'Settings', nameTamil: 'அமைப்புகள்', href: '/rental/settings', icon: SettingsIcon },
];

const paddyNavigation = [
  { name: 'Dashboard', nameTamil: 'டாஷ்போர்டு', href: '/paddy', icon: DashboardIcon },
  { name: 'Fields', nameTamil: 'வயல்கள்', href: '/paddy/fields', icon: FieldIcon },
  { name: 'Workers', nameTamil: 'வேலையாட்கள்', href: '/paddy/workers', icon: UsersIcon },
  { name: 'Expenses', nameTamil: 'செலவுகள்', href: '/paddy/expenses', icon: ExpenseIcon },
  { name: 'Income', nameTamil: 'வருமானம்', href: '/paddy/income', icon: IncomeIcon },
  { name: 'Reports', nameTamil: 'அறிக்கைகள்', href: '/paddy/reports', icon: ReportIcon },
];

const coconutNavigation = [
  { name: 'Dashboard', nameTamil: 'டாஷ்போர்டு', href: '/coconut', icon: DashboardIcon },
  { name: 'Groves', nameTamil: 'தோப்புகள்', href: '/coconut/groves', icon: GroveIcon },
  { name: 'Workers', nameTamil: 'வேலையாட்கள்', href: '/coconut/workers', icon: UsersIcon },
  { name: 'Expenses', nameTamil: 'செலவுகள்', href: '/coconut/expenses', icon: ExpenseIcon },
  { name: 'Income', nameTamil: 'வருமானம்', href: '/coconut/income', icon: IncomeIcon },
  { name: 'Reports', nameTamil: 'அறிக்கைகள்', href: '/coconut/reports', icon: ReportIcon },
];

const unifiedNavigation = [
  { name: 'Business Overview', nameTamil: 'வணிக மேலோட்டம்', href: '/dashboard', icon: DashboardIcon },
];

const moduleColors = {
  rental: 'primary',
  paddy: 'green',
  coconut: 'amber',
  unified: 'purple'
};

const moduleLabels = {
  rental: { name: 'Rental Houses', nameTamil: 'வாடகை வீடுகள்' },
  paddy: { name: 'Paddy Fields', nameTamil: 'நெல் வயல்கள்' },
  coconut: { name: 'Coconut Groves', nameTamil: 'தென்னந்தோப்புகள்' },
  unified: { name: 'Business Overview', nameTamil: 'வணிக மேலோட்டம்' }
};

export default function Sidebar({ open, onClose, module = 'rental' }) {
  const navigate = useNavigate();
  const navigation = module === 'unified'
    ? unifiedNavigation
    : module === 'paddy'
      ? paddyNavigation
      : module === 'coconut'
        ? coconutNavigation
        : rentalNavigation;
  const color = moduleColors[module] || 'primary';
  const label = moduleLabels[module] || moduleLabels.rental;

  const activeClassesMap = {
    green: 'bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
  };
  const activeClasses = activeClassesMap[color] || activeClassesMap.primary;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Module indicator */}
        <div className="p-4 border-b dark:border-gray-700">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : color === 'purple' ? 'bg-purple-500' : 'bg-primary-500'
            }`}>
              {module === 'unified' ? (
                <DashboardIcon className="w-4 h-4 text-white" />
              ) : module === 'paddy' ? (
                <PaddyIcon className="w-4 h-4 text-white" />
              ) : module === 'coconut' ? (
                <CoconutIcon className="w-4 h-4 text-white" />
              ) : (
                <HouseIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch Module</p>
            </div>
            <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/rental' || item.href === '/paddy' || item.href === '/coconut'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? activeClasses
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

// Icons
function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function HouseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function FieldIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function PaymentIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ExpenseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  );
}

function IncomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ReportIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PaddyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
    </svg>
  );
}

function CoconutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="14" r="6" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V3M8 5l4 3M16 5l-4 3" />
    </svg>
  );
}

function GroveIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
