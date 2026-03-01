import { useEffect } from 'react';

export default function MapPopup({ field, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Generate embed URL from coordinates or parse from Google Maps URL
  const getEmbedUrl = () => {
    // If we have GPS coordinates, use them
    if (field.gps_latitude && field.gps_longitude) {
      return `https://maps.google.com/maps?q=${field.gps_latitude},${field.gps_longitude}&z=16&output=embed`;
    }

    // Try to extract coordinates from Google Maps URL
    if (field.google_maps_url) {
      const url = field.google_maps_url;

      // Try to match @lat,lng pattern (e.g., @10.7905,79.1378)
      const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (atMatch) {
        return `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&z=16&output=embed`;
      }

      // Try to match q=lat,lng pattern
      const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (qMatch) {
        return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&z=16&output=embed`;
      }

      // Try place coordinates pattern /place/name/@lat,lng
      const placeMatch = url.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (placeMatch) {
        return `https://maps.google.com/maps?q=${placeMatch[1]},${placeMatch[2]}&z=16&output=embed`;
      }
    }

    return null;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {field.name}
            </h2>
            {field.gps_latitude && field.gps_longitude && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {field.gps_latitude}, {field.gps_longitude}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {field.google_maps_url && (
              <a
                href={field.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-sm"
              >
                Open in Google Maps
              </a>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Map Content */}
        <div className="h-[500px] bg-gray-100 dark:bg-gray-700">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${field.name}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-center">
                Unable to display map preview.<br />
                Please add GPS coordinates or a valid Google Maps URL.
              </p>
              {field.google_maps_url && (
                <a
                  href={field.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-4"
                >
                  Open Link in New Tab
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
