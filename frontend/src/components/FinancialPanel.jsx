import { useState, useEffect } from 'react';
import { Trash2, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const FinancialPanel = () => {
    const [transacciones, setTransacciones] = useState([]);
    const [inventario, setInventario] = useState([]);

    const hoy = new Date().toISOString().split('T')[0];

    const [nuevaTransaccion, setNuevaTransaccion] = useState({
        categoria: 'Venta de Joya',
        entra: '',
        sale: '',
        fecha: hoy,
        descripcion: '',
        items: []
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resTransacciones, resJoyas] = await Promise.all([
                fetch('https://joyas-byluxo1.onrender.com/api/transacciones'),
                fetch('https://joyas-byluxo1.onrender.com/api/joyas')
            ]);
            if (resTransacciones.ok) setTransacciones(await resTransacciones.json());
            if (resJoyas.ok) setInventario(await resJoyas.json());
        } catch (error) {
            console.error("Error cargando contabilidad:", error);
        }
    };

    const handleJoyaSelect = (id) => {
        const joya = inventario.find(j => j.id === Number(id));
        if (!joya) return;

        const yaSeleccionada = nuevaTransaccion.items.find(i => i.joya.id === joya.id);
        let nuevosItems;

        if (yaSeleccionada) {
            nuevosItems = nuevaTransaccion.items.filter(i => i.joya.id !== joya.id);
        } else {
            nuevosItems = [...nuevaTransaccion.items, { joya: { id: joya.id }, cantidad: 1 }];
        }

        // Calcula precio sugerido para ayudar visualmente, pero se guarda en "entra" editable
        const precioSugerido = nuevosItems.reduce((sum, item) => {
            const j = inventario.find(inv => inv.id === item.joya.id);
            return sum + (j ? j.precio : 0);
        }, 0);

        setNuevaTransaccion(prev => ({
            ...prev,
            items: nuevosItems,
            entra: nuevosItems.length > 0 ? precioSugerido : ''
        }));
    };

    const handleGuardarTransaccion = async (e) => {
        e.preventDefault();

        // Preparar payload dependiendo de la categoría
        const payload = {
            fecha: nuevaTransaccion.fecha,
            categoria: nuevaTransaccion.categoria,
            // Guardamos la nota extra en un campo que soporte tu backend, asumiremos que usas la categoría para notas si no hay descripcion, o ajusta según tu DB.
        };

        if (nuevaTransaccion.categoria === 'Venta de Joya') {
            payload.entra = Number(nuevaTransaccion.entra) || 0;
            payload.sale = 0;
            payload.items = nuevaTransaccion.items;
        } else if (nuevaTransaccion.categoria === 'Retiro de Comisión') {
            payload.tipo = 'Egreso';
            payload.entra = 0;
            payload.sale = Number(nuevaTransaccion.sale) || 0;
        } else {
            payload.tipo = 'Egreso';
            payload.entra = 0;
            payload.sale = Number(nuevaTransaccion.sale) || 0;
        }

        try {
            const res = await fetch('https://joyas-byluxo1.onrender.com/api/transacciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setNuevaTransaccion({ categoria: 'Venta de Joya', entra: '', sale: '', fecha: hoy, descripcion: '', items: [] });
                cargarDatos();
            }
        } catch (error) {
            console.error("Error guardando transacción:", error);
        }
    };

    const handleEliminarTransaccion = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este registro? Esto restaurará el stock de las joyas involucradas (si aplica).")) return;
        try {
            const res = await fetch(`https://joyas-byluxo1.onrender.com/api/transacciones/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) cargarDatos();
        } catch (error) {
            console.error("Error eliminando:", error);
        }
    };

    // --- CÁLCULOS BLINDADOS ---
    const totalIngresos = transacciones.reduce((sum, t) => sum + (t.entra || 0), 0);
    const totalEgresos = transacciones.reduce((sum, t) => sum + (t.sale || 0), 0);

    // Comisión total generada históricamente
    const totalComisionGenerada = transacciones.reduce((sum, t) => sum + (t.comision || 0), 0);

    // Cuánta comisión ya sacaste de la caja
    const totalComisionRetirada = transacciones
        .filter(t => t.categoria === 'Retiro de Comisión')
        .reduce((sum, t) => sum + (t.sale || 0), 0);

    // Lo que te falta por cobrarte a ti mismo
    const comisionPendientePorCobrar = totalComisionGenerada - totalComisionRetirada;

    // El saldo físico que debería haber en tu caja real
    const saldoCaja = totalIngresos - totalEgresos;

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 mt-6">
            <h2 className="text-2xl font-light tracking-widest text-zinc-100 uppercase mb-6">Contabilidad & Flujo</h2>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-500" /> Caja FíSica Total</p>
                    <p className="text-3xl font-light mt-2">${saldoCaja.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Ingresos Ventas</p>
                    <p className="text-xl font-light mt-2">${totalIngresos.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg border-l-4 border-l-pink-500">
                    <p className="text-xs text-pink-500 uppercase font-bold tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4" /> Comisión por Cobrar</p>
                    <p className="text-xl font-light mt-2 text-pink-400">${comisionPendientePorCobrar.toLocaleString('es-CL')}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Generado: ${totalComisionGenerada.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /> Otros Egresos</p>
                    <p className="text-xl font-light mt-2">${totalEgresos.toLocaleString('es-CL')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg h-fit">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Nueva Transacción</h3>
                    <form onSubmit={handleGuardarTransaccion} className="flex flex-col gap-4">
                        <select value={nuevaTransaccion.categoria} onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, categoria: e.target.value})} className="p-3 bg-zinc-950 border border-zinc-700 rounded text-sm text-white">
                            <option value="Venta de Joya">💍 Venta de Joya (Ingreso)</option>
                            <option value="Insumos o Pauta">📉 Insumos / Pauta (Egreso)</option>
                            <option value="Retiro de Comisión">💸 Retirar mi Comisión (Egreso)</option>
                        </select>

                        <div className="flex flex-col">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold pl-1 mb-1">Fecha</label>
                            <input type="date" value={nuevaTransaccion.fecha} onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, fecha: e.target.value})} className="p-3 bg-zinc-950 border border-zinc-700 rounded text-sm text-white [color-scheme:dark]" required />
                        </div>

                        {nuevaTransaccion.categoria === 'Venta de Joya' ? (
                            <>
                                <div className="border border-zinc-800 p-3 rounded-lg bg-black/30">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Seleccionar Joyas</p>
                                    <div className="max-h-40 overflow-y-auto grid grid-cols-1 gap-1 pr-2">
                                        {inventario.filter(j => j.stock > 0).map(j => (
                                            <button type="button" key={j.id} onClick={() => handleJoyaSelect(j.id)} className={`text-left text-xs p-2 rounded border ${nuevaTransaccion.items.find(i => i.joya.id === j.id) ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                                                {j.nombre} - ${j.precio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold pl-1 mb-1">Monto Cobrado ($) - Editable</label>
                                    <input type="number" value={nuevaTransaccion.entra} onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, entra: e.target.value})} placeholder="Total a cobrar..." className="p-3 bg-zinc-950 border border-zinc-700 rounded text-sm text-white" required />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold pl-1 mb-1">Monto Retirado / Gastado ($)</label>
                                <input type="number" value={nuevaTransaccion.sale} onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, sale: e.target.value})} placeholder="Monto..." className="p-3 bg-zinc-950 border border-zinc-700 rounded text-sm text-white" required />
                            </div>
                        )}

                        <button type="submit" className="mt-2 bg-white text-black font-bold py-3 rounded shadow-lg text-sm tracking-widest">GUARDAR MOVIMIENTO</button>
                    </form>
                </div>

                {/* Tabla */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden h-fit">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="text-xs uppercase bg-black/40 text-zinc-500 border-b border-zinc-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3 text-right">Entra</th>
                                <th className="px-4 py-3 text-right">Sale</th>
                                <th className="px-4 py-3 text-right">Comisión</th>
                                <th className="px-4 py-3 text-center">X</th>
                            </tr>
                            </thead>
                            <tbody>
                            {[...transacciones].reverse().map(t => (
                                <tr key={t.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    <td className="px-4 py-3 whitespace-nowrap">{t.fecha}</td>
                                    <td className="px-4 py-3 font-bold text-zinc-300">{t.categoria}</td>
                                    <td className="px-4 py-3 text-right text-green-500 font-mono">{t.entra > 0 ? `$${t.entra.toLocaleString('es-CL')}` : '-'}</td>
                                    <td className="px-4 py-3 text-right text-red-500 font-mono">{t.sale > 0 ? `$${t.sale.toLocaleString('es-CL')}` : '-'}</td>
                                    <td className="px-4 py-3 text-right text-pink-500 font-mono">{t.comision > 0 ? `+$${t.comision.toLocaleString('es-CL')}` : '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleEliminarTransaccion(t.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialPanel;