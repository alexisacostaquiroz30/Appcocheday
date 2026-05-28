import { useState } from 'react';
import { isFirebaseConfigured } from '../firebase';
import { Database, Wifi, WifiOff, HelpCircle, CheckCircle, Info, X } from 'lucide-react';

export default function FirebaseStatusBanner() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="w-full">
      {isFirebaseConfigured ? (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="h-3.5 w-3.5" />
            <span>Sincronizado con Firebase Producción</span>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1 font-semibold underline decoration-dotted"
          >
            Ver Info
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2 font-medium">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <WifiOff className="h-3.5 w-3.5" />
            <span>Modo Local Activo (Sin Nube)</span>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold underline decoration-dotted"
          >
            Activar Nube
          </button>
        </div>
      )}

      {showDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-2xl ${isFirebaseConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Estado de la Base de Datos</h3>
                <p className="text-xs text-gray-500">¿Dónde se guardan tus datos?</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-gray-600">
              {isFirebaseConfigured ? (
                <>
                  <div className="flex items-start gap-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p>
                      <strong>¡Configuración Completada!</strong> Tus viajes, gastos y el estado de tu vehículo están almacenados de forma segura y en tiempo real en la nube con **Firebase Firestore & Authentication**.
                    </p>
                  </div>
                  <p className="text-gray-500">
                    Incluso si cierras sesión o entras desde otro móvil, tus datos siempre se mantendrán sincronizados.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>
                      Los datos se están guardando de manera temporal en el <strong>almacenamiento local de tu navegador (localStorage)</strong>.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                      ¿Cómo activar Firebase Real?
                    </h4>
                    <ol className="list-decimal pl-4 space-y-1 text-gray-500">
                      <li>Haz clic en el botón naranja o ve al panel de control de AI Studio.</li>
                      <li>Despliega el asistente de Configuración de Firebase en la interfaz de usuario de AI Studio (a la derecha).</li>
                      <li>Sigue los pasos para aprovisionar el proyecto.</li>
                      <li>La aplicación se recargará automáticamente y guardará tus datos de forma segura en la nube.</li>
                    </ol>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setShowDetails(false)}
              className="mt-6 w-full py-3 bg-gray-900 text-white font-bold rounded-2xl text-xs hover:bg-gray-800 transition-colors"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
