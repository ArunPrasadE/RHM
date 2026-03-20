import { useNavigate } from 'react-router-dom';
import { useModule, MODULES, MODULE_INFO } from '../context/ModuleContext';

export default function ModuleSelectorPage() {
  const navigate = useNavigate();
  const { switchModule } = useModule();

  const handleModuleSelect = (module) => {
    switchModule(module);
    navigate(MODULE_INFO[module].path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Property Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Select a module to manage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rental Houses Module */}
          <ModuleCard
            module={MODULES.RENTAL}
            info={MODULE_INFO[MODULES.RENTAL]}
            icon={<HouseIcon />}
            onClick={() => handleModuleSelect(MODULES.RENTAL)}
          />

          {/* Paddy Fields Module */}
          <ModuleCard
            module={MODULES.PADDY}
            info={MODULE_INFO[MODULES.PADDY]}
            icon={<PaddyIcon />}
            onClick={() => handleModuleSelect(MODULES.PADDY)}
          />

          {/* Coconut Groves Module */}
          <ModuleCard
            module={MODULES.COCONUT}
            info={MODULE_INFO[MODULES.COCONUT]}
            icon={<CoconutIcon />}
            onClick={() => handleModuleSelect(MODULES.COCONUT)}
          />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, info, icon, onClick, disabled, comingSoon }) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/50',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-500 dark:hover:border-blue-400',
      iconBg: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/50',
      text: 'text-green-600 dark:text-green-400',
      border: 'hover:border-green-500 dark:hover:border-green-400',
      iconBg: 'bg-green-500'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/50',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500 dark:hover:border-amber-400',
      iconBg: 'bg-amber-500'
    }
  };

  const colors = colorClasses[info.color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-transparent
        transition-all duration-200 text-left w-full
        ${disabled
          ? 'opacity-60 cursor-not-allowed'
          : `${colors.border} hover:shadow-lg cursor-pointer`
        }
      `}
    >
      {comingSoon && (
        <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
          Coming Soon
        </span>
      )}

      <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
        <div className={colors.text}>
          {icon}
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {info.name}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        ({info.nameTamil})
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
        {info.description}
      </p>
    </button>
  );
}

// Icons
function HouseIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PaddyIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7a5 5 0 015 5c0 2.76-2.24 5-5 5s-5-2.24-5-5a5 5 0 015-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v6M9 15l3-3 3 3" />
    </svg>
  );
}

function CoconutIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="14" r="6" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V3M8 5l4 3M16 5l-4 3" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="13" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
