import { useState, useEffect } from 'react';
import StatsGenerator from './components/StatsGenerator';
import InventoryPanel from './components/InventoryPanel';
import FinancialPanel from './components/FinancialPanel';

// TRUCO MAESTRO: Interceptar todas las llamadas al backend e inyectar la clave
const originalFetch = window.fetch;
window.fetch = async (resource, config = {}) => {
    const token = localStorage.getItem('admin_token');
    if (token && typeof resource === 'string' && resource.startsWith('http')) {
        config.headers = {
            ...config.headers,
            'Authorization': `Basic ${token}`
        };
    }
    return originalFetch(resource, config);
};

function App() {
    const [currentView, setCurrentView] = useState('inventory');

    // Estados de Seguridad
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorLogin, setErrorLogin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) setIsAuthenticated(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        // Encripta las credenciales en formato Base64 estándar de internet
        const token = btoa(`${username}:${password}`);

        try {
            // Tocamos la puerta del backend para ver si abre
            const res = await fetch('http://localhost:8080/api/joyas', {
                headers: { 'Authorization': `Basic ${token}` }
            });

            if (res.ok) {
                localStorage.setItem('admin_token', token);
                setIsAuthenticated(true);
                setErrorLogin(false);
            } else {
                setErrorLogin(true);
            }
        } catch (error) {
            console.error("Servidor desconectado", error);
            setErrorLogin(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
    };

    // PANTALLA DE BLOQUEO
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-xl shadow-2xl max-w-sm w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-light tracking-widest text-zinc-100 uppercase">ByLuxo Core</h2>
                        <p className="text-xs text-zinc-500 mt-2">Acceso Administrativo Restringido</p>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-3 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="p-3 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-500"
                            required
                        />
                        {errorLogin && <p className="text-red-500 text-xs text-center font-bold">Credenciales incorrectas.</p>}
                        <button type="submit" className="mt-2 bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded transition-colors shadow-lg tracking-widest text-sm">
                            DESBLOQUEAR SISTEMA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-10">
            <nav className="bg-zinc-950 border-b border-zinc-800 p-4 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-wrap gap-2 md:gap-4 justify-center items-center relative">
                    <button onClick={() => setCurrentView('inventory')} className={`px-4 md:px-6 py-2 rounded font-bold tracking-widest text-xs md:text-sm transition-colors ${currentView === 'inventory' ? 'bg-white text-black shadow-md' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>INVENTARIO</button>
                    <button onClick={() => setCurrentView('financial')} className={`px-4 md:px-6 py-2 rounded font-bold tracking-widest text-xs md:text-sm transition-colors ${currentView === 'financial' ? 'bg-white text-black shadow-md' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>CONTABILIDAD</button>
                    <button onClick={() => setCurrentView('stats')} className={`px-4 md:px-6 py-2 rounded font-bold tracking-widest text-xs md:text-sm transition-colors ${currentView === 'stats' ? 'bg-white text-black shadow-md' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>STATS RRSS</button>

                    <button onClick={handleLogout} className="absolute right-0 text-zinc-600 hover:text-red-500 transition-colors text-xs font-bold uppercase hidden md:block">
                        Cerrar Sesión
                    </button>
                </div>
                <div className="text-center mt-3 md:hidden">
                    <button onClick={handleLogout} className="text-zinc-600 hover:text-red-500 transition-colors text-xs font-bold uppercase underline">
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            <div className="animate-fade-in">
                {currentView === 'inventory' && <InventoryPanel />}
                {currentView === 'financial' && <FinancialPanel />}
                {currentView === 'stats' && <StatsGenerator />}
            </div>
        </div>
    );
}

export default App;