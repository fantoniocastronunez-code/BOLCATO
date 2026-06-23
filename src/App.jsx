import React, { useState, useRef, useEffect } from 'react';
import { 
  Truck, ClipboardCheck, Camera, User, Settings, CheckCircle2, 
  Clock, ChevronRight, Plus, X, Search, FileText, Image as ImageIcon,
  LogOut, Check, Eye, MapPin, PenTool, Users, ClipboardList,
  Trash2, Edit, ArrowRight, AlertTriangle, ChevronLeft, Mail,
  Share2, Download
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const INITIAL_CLIENTS = [];

const STATUS_STEPS = [
  'A espera de que llegue a taller',
  'Recepcionado',
  'En trabajo de carrocería',
  'En pintura',
  'Terminaciones',
  'Listo para entrega'
];

const INITIAL_TRUCKS = [];

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // login, admin, client
  const [trucks, setTrucks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showReceptionForm, setShowReceptionForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [viewingTruck, setViewingTruck] = useState(null);
  const [progressTruck, setProgressTruck] = useState(null);
  const [editingTruck, setEditingTruck] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [adminTab, setAdminTab] = useState('jobs'); // jobs, clients

  // --- FIREBASE: Sincronización en Tiempo Real ---
  useEffect(() => {
    const unsubTrucks = onSnapshot(collection(db, 'trucks'), (snapshot) => {
      setTrucks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubTrucks();
      unsubClients();
    };
  }, []);

  // --- FUNCIONES DE ACCIÓN (FIREBASE) ---
  const handleAdvanceStatus = async (truckId, currentStatus) => {
    const currentIndex = STATUS_STEPS.indexOf(currentStatus);
    if (currentIndex < STATUS_STEPS.length - 1) {
      const nextStatus = STATUS_STEPS[currentIndex + 1];
      await updateDoc(doc(db, 'trucks', truckId), { status: nextStatus });
    }
  };

  const handleDeleteConfirm = async () => {
    if (truckToDelete) {
      await deleteDoc(doc(db, 'trucks', truckToDelete));
      setTruckToDelete(null);
    }
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-full">
            <Truck className="text-white w-12 h-12" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Carrocerías App</h1>
        <p className="text-slate-500 mb-8">Gestión y Seguimiento de Fabricación</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => setCurrentView('admin')}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
          >
            <Settings className="w-5 h-5" />
            Entrar como Administrador
          </button>
          <button 
            onClick={() => setCurrentView('client')}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 p-4 rounded-xl font-medium transition-colors border border-blue-200"
          >
            <User className="w-5 h-5" />
            Entrar como Cliente
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-400" />
            <span className="font-bold text-lg">Panel de Control</span>
          </div>
          <button onClick={() => setCurrentView('login')} className="text-slate-400 hover:text-white flex items-center gap-2">
            <span className="hidden sm:inline text-sm">Cerrar Sesión</span>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 py-6">
        
        {/* Pestaña: Trabajos Activos */}
        {adminTab === 'jobs' && (
          <div className="animate-in fade-in">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Trabajos Activos</h2>
              <div className="relative w-full sm:w-64 shadow-sm">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar patente o cliente..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {trucks.map(truck => (
                <div key={truck.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 w-full">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600 hidden sm:block border border-blue-100">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-slate-800 text-lg">{truck.id}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-mono border border-slate-200 shadow-sm">
                          {truck.plate}
                        </span>
                        <StatusBadge status={truck.status} />
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        <span className="font-bold text-slate-800">{truck.clientName}</span> • {truck.make} {truck.model}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Ingreso: {truck.date}
                        </span>
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                          <FileText className="w-3.5 h-3.5" />
                          OT: {truck.ot || 'Sin OT'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0">
                    {/* Le agregamos flex-wrap para que los 5 botones no se aprieten en celulares */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setViewingTruck(truck)}
                        className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-colors shadow-sm"
                        title="Ver Detalles"
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>

                      {/* --- NUEVO: Botón Avances y Fotos --- */}
                      <button 
                        onClick={() => setProgressTruck(truck)}
                        className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-colors shadow-sm"
                        title="Avances y Fotos"
                      >
                        <Camera className="w-5 h-5 text-blue-600" />
                      </button>

                      {/* --- NUEVO: Botón WhatsApp --- */}
                      <button 
                        onClick={() => {
                          const urlActual = window.location.origin;
                          const mensaje = `¡Hola! Somos tu taller de carrocerías.\n\nPuedes ver las fotografías y el avance en tiempo real de tu OT: ${truck.ot || 'Sin OT'} ingresando a nuestro portal de clientes.\n\n👉 Ingresa aquí: ${urlActual}\n🔑 Tu código de proyecto es: ${truck.id}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl transition-colors shadow-sm"
                        title="Compartir por WhatsApp"
                      >
                        <Share2 className="w-5 h-5 text-green-600" />
                      </button>

                      <button 
                        onClick={() => setEditingTruck(truck)}
                        className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-colors shadow-sm"
                        title="Editar Trabajo"
                      >
                        <Edit className="w-5 h-5 text-amber-500" />
                      </button>
                      <button 
                        onClick={() => setTruckToDelete(truck.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-white hover:bg-red-50 border border-slate-200 text-slate-700 rounded-xl transition-colors shadow-sm"
                        title="Eliminar Trabajo"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>

                    {STATUS_STEPS.indexOf(truck.status) < STATUS_STEPS.length - 1 ? (
                      <button 
                        onClick={() => handleAdvanceStatus(truck.id, truck.status)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors shadow-sm text-sm font-semibold"
                      >
                        Avanzar <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl border border-green-200 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Entregado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pestaña: Base de Datos de Clientes */}
        {adminTab === 'clients' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Base de Datos de Clientes</h2>
              <button 
                onClick={() => { setEditingClient(null); setShowClientForm(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Nuevo Cliente
              </button>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {clients.map(client => {
                // Contador dinámico: Buscamos cuántos camiones coinciden con el RUT de este cliente
                const jobsCount = trucks.filter(t => t.rut === client.rut).length;
                
                return (
                <div key={client.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 relative group">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-full text-slate-500 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{client.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">RUT: {client.rut}</p>
                    </div>
                  </div>

                  {/* Datos de Contacto */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400 shrink-0" /> 
                      <span className="truncate">{client.contactName || 'Sin encargado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" /> 
                      <span className="truncate">{client.email || 'Sin correo'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    {/* Indicador de Carrocerías */}
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium text-slate-500">Carrocerías:</span>
                       <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-md text-sm">{jobsCount}</span>
                    </div>

                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => { setEditingClient(client); setShowClientForm(true); }}
                        className="p-2 text-amber-500 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-lg transition-colors" title="Editar Cliente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setClients(clients.filter(c => c.id !== client.id))}
                        className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors" title="Eliminar Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Estilo App) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          
          <button 
            onClick={() => setAdminTab('jobs')}
            className={`flex flex-col items-center gap-1 p-2 ${adminTab === 'jobs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Trabajos</span>
          </button>

          {/* Botón Flotante Central (FAB) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-8">
            <button 
              onClick={() => {
                setEditingTruck(null);
                setShowReceptionForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center justify-center border-4 border-slate-50"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          <button 
            onClick={() => setAdminTab('clients')}
            className={`flex flex-col items-center gap-1 p-2 ${adminTab === 'clients' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Clientes</span>
          </button>
          
        </div>
      </div>

      {/* MODALES */}
      {showClientForm && (
        <ClientFormModal 
          initialData={editingClient}
          onClose={() => {
            setShowClientForm(false);
            setEditingClient(null);
          }}
          onSave={async (clientData) => {
            const { id, ...dataToSave } = clientData;
            await setDoc(doc(db, 'clients', id), dataToSave);
            setShowClientForm(false);
            setEditingClient(null);
          }}
        />
      )}

      {(showReceptionForm || editingTruck) && (
        <ReceptionForm 
          clients={clients}
          initialData={editingTruck}
          onClose={() => {
            setShowReceptionForm(false);
            setEditingTruck(null);
          }} 
          onSave={async (truckData) => {
            const { id, ...dataToSave } = truckData;
            await setDoc(doc(db, 'trucks', id), dataToSave);
            setShowReceptionForm(false);
            setEditingTruck(null);
          }}
        />
      )}

      {viewingTruck && (
        <TruckDetailsModal truck={viewingTruck} onClose={() => setViewingTruck(null)} />
      )}

      {/* Modal de Avances y Fotos */}
      {progressTruck && (
        <ProgressModal 
          truck={progressTruck} 
          onClose={() => setProgressTruck(null)} 
          onUpdate={async (updatedTruck) => {
            const { id, ...dataToSave } = updatedTruck;
            await updateDoc(doc(db, 'trucks', id), dataToSave);
          }}
        />
      )}

      {/* Modal Confirmar Eliminación */}
      {truckToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Trabajo?</h3>
            <p className="text-slate-500 mb-6 text-sm">Esta acción no se puede deshacer. Se eliminarán los datos del vehículo de forma permanente.</p>
            <div className="flex gap-3">
              <button onClick={() => setTruckToDelete(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClientDashboard = () => {
    // Simulamos que el cliente inicia sesión y ve su primer camión
    const myTruck = trucks[0];

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="font-bold text-lg">Portal de Clientes</div>
            <button onClick={() => setCurrentView('login')} className="text-blue-200 hover:text-white flex items-center gap-1 text-sm">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Cabecera del Camión */}
            <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">Orden de Trabajo: {myTruck.ot}</h1>
                <p className="text-slate-400">{myTruck.make} {myTruck.model} • Patente: {myTruck.plate}</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                <span className="text-sm text-slate-300 block mb-1">Estado Actual</span>
                <span className="font-bold text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {myTruck.status}
                </span>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="p-6 sm:p-10 border-b border-slate-100 bg-white">
              <h3 className="text-lg font-bold text-slate-800 mb-8">Progreso de Fabricación</h3>
              <div className="relative">
                <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 sm:-translate-x-1/2"></div>
                <div className="space-y-8 relative">
                  {STATUS_STEPS.map((step, index) => {
                    const currentStepIndex = STATUS_STEPS.indexOf(myTruck.status);
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;

                    return (
                      <div key={step} className={`flex flex-col sm:flex-row items-start gap-4 sm:justify-center w-full relative ${isPending ? 'opacity-40' : ''}`}>
                        
                        <div className="flex items-center gap-4 sm:w-1/3 sm:justify-end">
                          {isCompleted && <span className="text-sm text-slate-500 hidden sm:block">Finalizado</span>}
                          {isCurrent && <span className="text-sm font-bold text-blue-600 hidden sm:block">En Proceso</span>}
                          
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-4 bg-white
                            ${isCompleted ? 'border-green-500 text-green-500' : 
                              isCurrent ? 'border-blue-600 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'border-slate-300 text-slate-300'}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-blue-600' : 'bg-slate-300'}`} />}
                          </div>
                        </div>

                        <div className="sm:w-2/3 sm:pl-4 flex flex-col justify-center pb-8 border-l-2 sm:border-l-0 ml-4 sm:ml-0 pl-6 sm:pl-0 border-slate-200">
                           <h4 className={`font-bold text-lg mb-2 ${isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>{step}</h4>
                           
                           {/* Renderizado de Fotos */}
                           {myTruck.stagePhotos && myTruck.stagePhotos[step] && myTruck.stagePhotos[step].length > 0 && (
                             <div className="flex gap-3 overflow-x-auto py-2">
                               {myTruck.stagePhotos[step].map((photo, idx) => (
                                 <img key={idx} src={photo} alt={`Avance ${step}`} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                               ))}
                             </div>
                           )}
                           
                           {isCurrent && (!myTruck.stagePhotos || !myTruck.stagePhotos[step] || myTruck.stagePhotos[step].length === 0) && (
                             <p className="text-sm text-slate-500 italic">El equipo está trabajando en esta etapa. Pronto se subirán fotos.</p>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detalles de Recepción - Cliente */}
            <div className="p-6 bg-slate-50">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <MapPin className="text-slate-400" /> Ubicación del Vehículo
               </h3>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 mb-6">
                 <div className="bg-blue-100 p-3 rounded-lg">
                    <MapPin className="text-blue-600 w-6 h-6" />
                 </div>
                 <div>
                    <span className="block font-bold text-slate-800">Planta Maipú</span>
                    <span className="text-sm text-slate-500">Región Metropolitana, Santiago</span>
                 </div>
               </div>

               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <ClipboardCheck className="text-slate-400" /> Datos de Recepción Original
               </h3>
               <div className="grid sm:grid-cols-2 gap-4 text-sm">
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-slate-500 mb-1">Fecha de Ingreso</span>
                    <span className="font-medium text-slate-800">{myTruck.date}</span>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-slate-500 mb-1">Entregado por</span>
                    <span className="font-medium text-slate-800">{myTruck.deliveryPerson} ({myTruck.dealership})</span>
                 </div>
               </div>
            </div>

          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="font-sans text-slate-900 bg-slate-100 min-h-screen">
      {currentView === 'login' && renderLogin()}
      {currentView === 'admin' && renderAdminDashboard()}
      {currentView === 'client' && renderClientDashboard()}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'A espera de que llegue a taller': 'bg-slate-100 text-slate-700 border-slate-200',
    'Recepcionado': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'En trabajo de carrocería': 'bg-orange-100 text-orange-700 border-orange-200',
    'En pintura': 'bg-blue-100 text-blue-700 border-blue-200',
    'Terminaciones': 'bg-purple-100 text-purple-700 border-purple-200',
    'Listo para entrega': 'bg-green-100 text-green-700 border-green-200',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors['A espera de que llegue a taller']}`}>
      {status}
    </span>
  );
}

function ReceptionForm({ onClose, onSave, initialData, clients }) {
  const [step, setStep] = useState(1);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState(initialData || {
    ot: '',
    rut: '',
    clientName: '',
    dealership: '',
    deliveryPerson: '',
    plate: '',
    make: '',
    model: '',
    vin: '',
    checklist: {
      // Exterior
      luces: false, espejos: false, neumaticos: false, parachoques: false,
      // Interior
      tapiz: false, tablero: false, radio: false,
      // Accesorios
      herramientas: false, gata: false, extintor: false, botiquin: false,
      // Documentos
      padron: false, permiso: false, revision: false, llaves: false
    },
    notes: ''
  });

  // Funciones para la firma digital
  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if(canvas) {
        canvas.getContext('2d').beginPath();
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Obtener coordenadas reales considerando el scroll y el tamaño del canvas
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if(!clientX || !clientY) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Autocompletado
    if (name === 'clientName') {
      const foundClient = clients.find(c => c.name.toLowerCase() === value.toLowerCase());
      setFormData({ 
        ...formData, 
        clientName: value,
        rut: foundClient ? foundClient.rut : formData.rut
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleChecklistChange = (item) => {
    setFormData({
      ...formData,
      checklist: { ...formData.checklist, [item]: !formData.checklist[item] }
    });
  };

  const preventSubmitOnEnter = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const canvas = canvasRef.current;
    let signatureUrl = initialData ? initialData.signature : null;
    
    if (canvas) {
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        if (canvas.toDataURL() !== blank.toDataURL()) {
            const base64Image = canvas.toDataURL('image/png');
            try {
              const signatureRef = ref(storage, `firmas/firma_${Date.now()}.png`);
              await uploadString(signatureRef, base64Image, 'data_url');
              signatureUrl = await getDownloadURL(signatureRef);
            } catch (error) {
              console.error("Error subiendo firma:", error);
            }
        }
    }

    const truckData = {
      ...formData,
      id: initialData ? initialData.id : `CAR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: initialData ? initialData.status : 'A espera de que llegue a taller',
      date: initialData ? initialData.date : new Date().toISOString().split('T')[0],
      signature: signatureUrl
    };
    
    await onSave(truckData);
    setIsSaving(false);
  };

  const renderChecklistCategory = (title, items) => (
    <div className="mb-4">
      <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wider">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item} 
               onClick={() => handleChecklistChange(item)}
               className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors shadow-sm
                ${formData.checklist[item] ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-300 bg-white'}`}>
            <span className="capitalize text-sm font-medium text-slate-700">{item}</span>
            <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.checklist[item] ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
              {formData.checklist[item] && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4 transition-opacity">
      <div className="bg-slate-50 w-full max-w-2xl sm:rounded-2xl h-[95vh] sm:h-auto max-h-[95vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 sm:p-6 bg-white border-b border-slate-200 sm:rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
               {initialData ? 'Editar Recepción' : 'Checklist de Recepción'}
            </h2>
            <p className="text-sm text-slate-500">{initialData ? formData.id : 'Ingreso de nuevo chasis a planta'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* Progress Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className={`flex-1 h-2 rounded-full min-w-[40px] transition-colors ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`} />
             ))}
          </div>

          <form id="reception-form" onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter}>
            
            {/* PASO 1: Datos Generales */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <User className="text-blue-500" /> Datos de Entrega
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
                    <input list="clientes-db" required name="clientName" value={formData.clientName} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej. Logistica TS" />
                    <datalist id="clientes-db">
                      {clients.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">RUT Empresa</label>
                    <input required name="rut" value={formData.rut} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50" placeholder="12.345.678-9" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Orden de Trabajo (OT)</label>
                    <input required name="ot" value={formData.ot} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50 border-blue-100 font-bold text-blue-900" placeholder="Ej. OT-5010" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Concesionario de Origen</label>
                    <input required name="dealership" value={formData.dealership} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej. Kaufmann, Salfa..." />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: Vehículo */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Truck className="text-blue-500" /> Datos del Vehículo
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patente</label>
                  <input required name="plate" value={formData.plate} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono text-lg" placeholder="ABCD12 o S/N" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                    <input required name="make" value={formData.make} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej. Mercedes-Benz" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                    <input required name="model" value={formData.model} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej. Actros 2545" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VIN (Número de Chasis)</label>
                  <input name="vin" value={formData.vin} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono" placeholder="17 caracteres" />
                </div>
              </div>
            )}

            {/* PASO 3: Checklist y Fotos */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <ClipboardCheck className="text-blue-500" /> Verificación Visual
                </h3>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  {renderChecklistCategory("Exterior", ['luces', 'espejos', 'neumaticos', 'parachoques'])}
                  {renderChecklistCategory("Interior", ['tapiz', 'tablero', 'radio'])}
                  {renderChecklistCategory("Accesorios", ['herramientas', 'gata', 'extintor', 'botiquin'])}
                  {renderChecklistCategory("Documentos", ['padron', 'permiso', 'revision', 'llaves'])}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                    <Camera className="text-blue-500" /> Registro Fotográfico
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                     <p className="text-sm text-blue-800 mb-2 font-medium">Sube fotos de los 4 costados y detalles.</p>
                     {/* Simulación de input de archivo que abrirá la cámara en móviles */}
                     <label className="w-full py-3 bg-white border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-50 transition-colors">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-sm font-medium">Tocar para abrir Cámara/Galería</span>
                        <input type="file" accept="image/*" multiple className="hidden" />
                     </label>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones Finales / Daños</label>
                   <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Detalles de rayas, abolladuras, piezas faltantes, etc." />
                </div>
              </div>
            )}

            {/* PASO 4: Conformidad y Firma */}
            {step === 4 && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <PenTool className="text-blue-500" /> Conformidad de Recepción
                </h3>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                    <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                    <p>Ubicación GPS fijada en: <strong className="text-slate-800">Planta Maipú, Santiago</strong></p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo de quien entrega (Chofer)</label>
                    <input required name="deliveryPerson" value={formData.deliveryPerson} onChange={handleInputChange} type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nombre completo" />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm font-medium text-slate-700">Firma del Conductor</label>
                      <button type="button" onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 font-medium">Borrar</button>
                    </div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative h-40">
                      <canvas 
                        ref={canvasRef}
                        width={600} 
                        height={160}
                        className="w-full h-full cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseUp={endDrawing}
                        onMouseMove={draw}
                        onMouseOut={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchEnd={endDrawing}
                        onTouchMove={draw}
                      />
                      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                        <span className="text-slate-300 text-xs font-medium uppercase tracking-widest">Firmar Aquí</span>
                      </div>
                    </div>
                  </div>
                </div>
               </div>
            )}
          </form>
        </div>

        {/* Footer Modal / Botones de Navegación */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200 sm:rounded-b-2xl flex justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          {step > 1 ? (
             <button type="button" onClick={() => setStep(step - 1)} className="px-5 py-3 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2">
               <ChevronLeft className="w-4 h-4" /> Atrás
             </button>
          ) : <div className="w-24"></div>}
          
          {step < 4 ? (
             <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
               Siguiente <ChevronRight className="w-4 h-4" />
             </button>
          ) : (
            <button type="submit" form="reception-form" disabled={isSaving} className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition-colors shadow-md flex items-center gap-2">
               <Check className="w-5 h-5" /> {isSaving ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Finalizar')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function TruckDetailsModal({ truck, onClose }) {
  
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    
    // Plantilla HTML profesional para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recepcion_${truck.ot}_${truck.plate}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; font-size: 14px; }
            .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0f172a; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
            .col { flex: 1; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 16px; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; }
            .item { margin-bottom: 8px; }
            .item strong { color: #475569; display: inline-block; width: 130px; }
            .checklist-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
            .checklist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .check-item { display: flex; align-items: center; }
            .box { width: 16px; height: 16px; border: 2px solid #94a3b8; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; font-size: 12px; border-radius: 4px; }
            .box.yes { background: #22c55e; color: white; border-color: #22c55e; }
            .box.no { background: #ef4444; color: white; border-color: #ef4444; }
            .notes { background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; margin-bottom: 40px; min-height: 60px; color: #92400e; }
            .signatures { display: flex; justify-content: space-around; margin-top: 60px; }
            .sign-box { width: 40%; text-align: center; }
            .sign-line { border-top: 1px solid #334155; padding-top: 10px; margin-top: 60px; font-weight: bold; }
            .sign-img { max-width: 100%; height: 90px; object-fit: contain; margin-bottom: -20px; }
            @media print {
              body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Acta de Recepción de Vehículo</h1>
            <p>Orden de Trabajo: <strong style="color:#1e3a8a; font-size: 16px;">${truck.ot || 'S/N'}</strong> | Fecha de Ingreso: ${truck.date}</p>
            <p>Código Interno: ${truck.id} | Planta Maipú, Santiago</p>
          </div>

          <div class="grid">
            <div class="col">
              <div class="section-title">Datos del Cliente</div>
              <div class="item"><strong>Empresa:</strong> ${truck.clientName}</div>
              <div class="item"><strong>RUT:</strong> ${truck.rut || 'No registrado'}</div>
              <div class="item"><strong>Entregado por:</strong> ${truck.deliveryPerson}</div>
              <div class="item"><strong>Concesionario:</strong> ${truck.dealership}</div>
            </div>
            <div class="col">
              <div class="section-title">Datos del Vehículo</div>
              <div class="item"><strong>Patente:</strong> <span style="font-family: monospace; font-size: 16px;">${truck.plate}</span></div>
              <div class="item"><strong>Marca / Modelo:</strong> ${truck.make} ${truck.model}</div>
              <div class="item"><strong>VIN (Chasis):</strong> <span style="font-family: monospace;">${truck.vin || 'No registrado'}</span></div>
            </div>
          </div>

          <div class="section-title">Checklist de Verificación Visual</div>
          <div class="checklist-container">
            <div class="checklist-grid">
              ${truck.checklist ? Object.keys(truck.checklist).map(item => `
                <div class="check-item">
                  <div class="box ${truck.checklist[item] ? 'yes' : 'no'}">${truck.checklist[item] ? '✓' : 'X'}</div>
                  <span style="text-transform: capitalize;">${item}</span>
                </div>
              `).join('') : '<p>Sin checklist registrado.</p>'}
            </div>
          </div>

          <div class="section-title">Observaciones y/o Daños Previos</div>
          <div class="notes">
            ${truck.notes ? truck.notes : 'El vehículo ingresa sin observaciones ni daños visibles reportados.'}
          </div>

          <div class="signatures">
            <div class="sign-box">
              ${truck.signature ? `<img src="${truck.signature}" class="sign-img" />` : '<div style="height: 90px;"></div>'}
              <div class="sign-line">Firma Quien Entrega<br/><span style="font-weight:normal;font-size:12px;color:#64748b;">${truck.deliveryPerson}</span></div>
            </div>
            <div class="sign-box">
              <div style="height: 90px;"></div>
              <div class="sign-line">Firma Recepcionista Taller<br/><span style="font-weight:normal;font-size:12px;color:#64748b;">Responsable Planta Maipú</span></div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Le damos medio segundo para que la imagen de la firma cargue antes de lanzar el menú de imprimir
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        
        {/* Header Modal Detalles */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-900 text-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Detalle de Recepción 
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm font-mono">{truck.id}</span>
            </h2>
            <p className="text-slate-300 text-sm mt-1">OT: <strong className="text-white">{truck.ot}</strong></p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintPDF} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-sm"
              title="Guardar como PDF o Imprimir"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
            <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-white" title="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido Scrollable Detalles */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50">
          
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div><span className="text-sm text-slate-500 block">Cliente</span><span className="font-bold text-slate-800">{truck.clientName}</span></div>
            <div><span className="text-sm text-slate-500 block">RUT</span><span className="font-medium text-slate-800">{truck.rut || 'No registrado'}</span></div>
            <div><span className="text-sm text-slate-500 block">Fecha Ingreso</span><span className="font-medium text-slate-800">{truck.date}</span></div>
            <div><span className="text-sm text-slate-500 block">Estado Actual</span><StatusBadge status={truck.status} /></div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-600"/> Datos del Vehículo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div><span className="text-slate-500 block mb-1">Patente</span><span className="font-mono bg-slate-100 px-2 py-1 rounded font-bold text-slate-800">{truck.plate}</span></div>
              <div className="col-span-2 sm:col-span-1"><span className="text-slate-500 block mb-1">VIN (Chasis)</span><span className="font-mono">{truck.vin || 'No registrado'}</span></div>
              <div><span className="text-slate-500 block mb-1">Marca</span><span className="font-medium">{truck.make}</span></div>
              <div><span className="text-slate-500 block mb-1">Modelo</span><span className="font-medium">{truck.model}</span></div>
              <div><span className="text-slate-500 block mb-1">Entregado por</span>{truck.deliveryPerson}</div>
              <div><span className="text-slate-500 block mb-1">Origen</span>{truck.dealership}</div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-blue-600"/> Estado al Recibir</h3>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-2">
                {truck.checklist && Object.keys(truck.checklist).map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    {truck.checklist[item] ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <X className="w-5 h-5 text-red-400 shrink-0" />}
                    <span className="capitalize text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {truck.notes && (
             <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
               <span className="text-sm font-bold text-yellow-800 flex items-center gap-1 mb-2">
                 <FileText className="w-4 h-4" /> Observaciones Finales
               </span>
               <p className="text-sm text-yellow-900 leading-relaxed">{truck.notes}</p>
             </div>
          )}

          {truck.signature && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-700 block mb-2">Firma del Conductor:</span>
              <img src={truck.signature} alt="Firma" className="max-w-full h-auto border-b border-slate-200 pb-2" />
              <p className="text-xs text-slate-500 mt-2 text-center">{truck.deliveryPerson}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ClientFormModal({ onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(initialData || { name: '', rut: '', contactName: '', email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: initialData ? initialData.id : `CLI-${Date.now()}`
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa / Cliente</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej. Transportes SPA" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
            <input required type="text" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="12.345.678-9" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Encargado</label>
            <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="correo@empresa.com" />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- NUEVO COMPONENTE: MODAL DE AVANCES Y FOTOS ---
function ProgressModal({ truck, onClose, onUpdate }) {
  const [currentStatus, setCurrentStatus] = useState(truck.status);
  const [photos, setPhotos] = useState(truck.stagePhotos || {});

  const [isUploading, setIsUploading] = useState(false);

  const handleAddPhoto = async (step, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    
    try {
      const photoRef = ref(storage, `avances/${truck.id}_${step}_${Date.now()}.png`);
      await uploadBytes(photoRef, file);
      const url = await getDownloadURL(photoRef);
      
      const updatedPhotos = {
        ...photos,
        [step]: [...(photos[step] || []), url]
      };
      setPhotos(updatedPhotos);
      onUpdate({ ...truck, status: currentStatus, stagePhotos: updatedPhotos });
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("Error al subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setCurrentStatus(newStatus);
    onUpdate({ ...truck, status: newStatus, stagePhotos: photos });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4 pb-16 sm:pb-4">
      <div className="bg-white w-full max-w-2xl sm:rounded-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 sm:rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Camera className="text-blue-600" /> Avances de Carrocería
            </h2>
            <p className="text-sm text-slate-500 mt-1">OT: <span className="font-bold text-blue-700">{truck.ot}</span> • {truck.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white hover:bg-slate-200 border border-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-100">
          {STATUS_STEPS.map((step, index) => {
            const stepPhotos = photos[step] || [];
            const isCurrent = currentStatus === step;
            
            return (
              <div key={step} className={`p-4 rounded-xl border-2 transition-all shadow-sm ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <h4 className={`font-bold text-lg ${isCurrent ? 'text-blue-800' : 'text-slate-700'}`}>{step}</h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {!isCurrent && (
                      <button 
                        onClick={() => handleStatusChange(step)}
                        className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-600 rounded-lg transition-colors"
                      >
                        Fijar como Actual
                      </button>
                    )}
                    <label className={`flex items-center gap-2 px-3 py-2 text-xs font-bold ${isUploading ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'} text-white rounded-lg transition-colors cursor-pointer`}>
                      <Camera className="w-4 h-4" /> {isUploading ? 'Subiendo...' : 'Subir Foto'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={isUploading}
                        onChange={(e) => handleAddPhoto(step, e)} 
                      />
                    </label>
                  </div>
                </div>

                {stepPhotos.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {stepPhotos.map((photoUrl, i) => (
                      <div key={i} className="relative group shrink-0">
                        <img src={photoUrl} className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-sm" alt="Avance" />
                        <button 
                          onClick={() => {
                            const newPhotos = { ...photos, [step]: stepPhotos.filter((_, idx) => idx !== i) };
                            setPhotos(newPhotos);
                            onUpdate({ ...truck, status: currentStatus, stagePhotos: newPhotos });
                          }}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic bg-white/50 p-3 rounded-lg border border-dashed border-slate-200">
                    Aún no hay fotografías en esta etapa.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}