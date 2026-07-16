import { useState, useEffect } from 'react';

const FinancialPanel = () => {
    const [transacciones, setTransacciones] = useState([]);
    const [joyasDisponibles, setJoyasDisponibles] = useState([]);

    // Estados del Modal de Registro
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('Ingreso'); // 'Ingreso' | 'Gasto'
    const [categoria, setCategoria] = useState('Venta de Joya');
    const [detalle, setDetalle] = useState('');
    const [montoSencillo, setMontoSencillo] = useState(''); // Para gastos/otros ingresos

    // Estado del Carrito (Solo para Venta de Joya)
    const [carrito, setCarrito] = useState([]); // [{ joyaId: X, cantidad: Y, nombre: Z, precio: W }]

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Cargar transacciones
            const resTrans = await fetch('https://joyas-byluxo.onrender.com/api/transacciones');
            if (resTrans.ok) {
                const data = await resTrans.json();
                // Ordenar por ID o fecha para el cálculo del saldo acumulado
                setTransacciones(data.sort((a, b) => a.id - b.id));
            }

            // Cargar joyas activas para el buscador del carrito
            const resJoyas = await fetch('https://joyas-byluxo.onrender.com/api/joyas');
            if (resJoyas.ok) {
                const data = await resJoyas.json();
                setJoyasDisponibles(data.filter(j => j.stock > 0));
            }
        } catch (error) {
            console.error("Error cargando datos financieros:", error);
        }
    };

    // Funciones del Carrito de Ventas
    const agregarAlCarrito = (joyaId) => {
        const joya = joyasDisponibles.find(j => j.id === Number(joyaId));
        if (!joya) return;

        setCarrito(prev => {
            const existe = prev.find(item => item.joyaId === joya.id);
            if (existe) {
                if (existe.cantidad >= joya.stock) {
                    alert(`Solo quedan ${joya.stock} unidades en stock.`);
                    return prev;
                }
                return prev.map(item => item.joyaId === joya.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { joyaId: joya.id, nombre: joya.nombre, precio: joya.precio, cantidad: 1, stockMax: joya.stock }];
        });
    };

    const actualizarCantidadCarrito = (joyaId, nuevaCant) => {
        const cant = parseInt(nuevaCant) || 1;
        setCarrito(prev => prev.map(item => {
            if (item.joyaId === joyaId) {
                if (cant > item.stockMax) {
                    alert(`Stock máximo disponible: ${item.stockMax}`);
                    return { ...item, cantidad: item.stockMax };
                }
                return { ...item, cantidad: Math.max(1, cant) };
            }
            return item;
        }));
    };

    const eliminarDelCarrito = (joyaId) => {
        setCarrito(prev => prev.filter(item => item.joyaId !== joyaId));
    };

    const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Guardar Movimiento en la Base de Datos
    const handleGuardar = async (e) => {
        e.preventDefault();

        let payload = {};

        if (categoria === 'Venta de Joya') {
            if (carrito.length === 0) {
                alert("Debes agregar al menos una joya al carrito.");
                return;
            }
            const descripciones = carrito.map(item => `${item.cantidad}x ${item.nombre}`).join(', ');
            payload = {
                categoria: 'Venta de Joya',
                detalle: `Venta: ${descripciones}`,
                items: carrito.map(item => ({
                    cantidad: item.cantidad,
                    joya: { id: item.joyaId }
                }))
            };
        } else {
            // Movimientos simples (Meta Ads, Insumos, Saldo inicial, etc.)
            const valor = Number(montoSencillo);
            payload = {
                tipo: tipoMovimiento,
                categoria: categoria,
                detalle: detalle,
                entra: tipoMovimiento === 'Ingreso' ? valor : 0,
                sale: tipoMovimiento === 'Gasto' ? valor : 0
            };
        }

        try {
            const res = await fetch('https://joyas-byluxo.onrender.com/api/transacciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setCarrito([]);
                setDetalle('');
                setMontoSencillo('');
                cargarDatos();
            } else {
                const err = await res.text();
                alert("Error: " + err);
            }
        } catch (error) {
            console.error("Error al registrar movimiento:", error);
        }
    };

    // Cálculos de Totales y Saldo Real Acumulado
    let saldoAcumulado = 0;
    const transaccionesConSaldo = transacciones.map(t => {
        saldoAcumulado = saldoAcumulado + (t.entra || 0) - (t.sale || 0);
        return { ...t, saldoReal: saldoAcumulado };
    });

    const ingresosTotales = transacciones.reduce((sum, t) => sum + (t.entra || 0), 0);
    const gastosTotales = transacciones.reduce((sum, t) => sum + (t.sale || 0), 0);
    const comisionAcumulada = transacciones.reduce((sum, t) => sum + (t.comision || 0), 0);
    const balanceCaja = ingresosTotales - gastosTotales;

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-xl shadow-2xl border border-zinc-800 font-sans mt-6">

            {/* Resumen de Caja */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Saldo de Caja</h4>
                    <p className="text-2xl font-semibold mt-1 text-zinc-100">${balanceCaja.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg border-l-4 border-l-green-500">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Comisión Acumulada (10%)</h4>
                    <p className="text-2xl font-bold mt-1 text-green-400">${comisionAcumulada.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Ingresos</h4>
                    <p className="text-xl font-semibold mt-1 text-zinc-300">${ingresosTotales.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Gastos</h4>
                    <p className="text-xl font-semibold mt-1 text-red-400">${gastosTotales.toLocaleString('es-CL')}</p>
                </div>
            </div>

            {/* Header del Panel */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-900">
                <div>
                    <h2 className="text-xl font-light tracking-widest uppercase text-zinc-100">Flujo de Caja y Contabilidad</h2>
                    <p className="text-xs text-zinc-500">Monitoreo de ingresos, gastos y comisiones operativas</p>
                </div>
                <button
                    onClick={() => { setIsModalOpen(true); setCategoria('Venta de Joya'); setTipoMovimiento('Ingreso'); }}
                    className="bg-white text-black hover:bg-zinc-200 font-bold tracking-widest py-2.5 px-5 rounded text-xs transition-colors shadow-lg"
                >
                    + NUEVO MOVIMIENTO
                </button>
            </div>

            {/* Tabla Contable */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800">
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Fecha</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Categoría</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Detalle</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right text-green-400">Entra</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right text-red-400">Sale</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Saldo real</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right text-green-300">Comisión (10%)</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                    {[...transaccionesConSaldo].reverse().map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-3 text-sm text-zinc-500">{t.fecha}</td>
                            <td className="p-3 text-sm font-semibold text-zinc-300">{t.categoria}</td>
                            <td className="p-3 text-sm text-zinc-400 max-w-xs truncate">{t.detalle}</td>
                            <td className="p-3 text-sm text-right text-green-400/80">{t.entra > 0 ? `+$${t.entra.toLocaleString('es-CL')}` : '-'}</td>
                            <td className="p-3 text-sm text-right text-red-400/80">{t.sale > 0 ? `-$${t.sale.toLocaleString('es-CL')}` : '-'}</td>
                            <td className="p-3 text-sm text-right font-medium text-zinc-100">${t.saldoReal.toLocaleString('es-CL')}</td>
                            <td className="p-3 text-sm text-right font-bold text-green-400/90">{t.comision > 0 ? `+$${t.comision.toLocaleString('es-CL')}` : '-'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE NUEVO MOVIMIENTO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-light tracking-widest text-zinc-100 uppercase">📝 Registrar Movimiento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
                        </div>

                        <form onSubmit={handleGuardar} className="flex flex-col gap-4">

                            {/* Categoría Selector */}
                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Categoría</label>
                                <select
                                    value={categoria}
                                    onChange={(e) => {
                                        const cat = e.target.value;
                                        setCategoria(cat);
                                        if (cat === 'Venta de Joya') {
                                            setTipoMovimiento('Ingreso');
                                        } else if (cat === 'Meta Ads' || cat === 'Insumos' || cat === 'Comprar Joyas') {
                                            setTipoMovimiento('Gasto');
                                        } else {
                                            setTipoMovimiento('Ingreso');
                                        }
                                    }}
                                    className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm"
                                >
                                    <option value="Venta de Joya">🛒 Venta de Joya</option>
                                    <option value="Saldo inicial">💰 Saldo Inicial</option>
                                    <option value="Meta Ads">📢 Meta Ads (Gastos Publicidad)</option>
                                    <option value="Insumos">📦 Insumos (Cajas, Bolsas, etc.)</option>
                                    <option value="Comprar Joyas">💍 Adquisición de Joyería (Reposición)</option>
                                </select>
                            </div>

                            {/* SECCIÓN DINÁMICA: CARRITO DE VENTAS */}
                            {categoria === 'Venta de Joya' ? (
                                <div className="border border-zinc-800 p-4 rounded bg-zinc-900/30 flex flex-col gap-3">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Buscador e Items de Venta</h4>

                                    {/* Selector de Joyas */}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                agregarAlCarrito(e.target.value);
                                                e.target.value = ''; // Reset selector
                                            }
                                        }}
                                        className="p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs"
                                    >
                                        <option value="">-- Buscar y Añadir Joya al Carrito --</option>
                                        {joyasDisponibles.map(joya => (
                                            <option key={joya.id} value={joya.id}>
                                                {joya.nombre} - ${joya.precio.toLocaleString('es-CL')} (Stock: {joya.stock})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Tabla del Carrito */}
                                    <div className="mt-2 divide-y divide-zinc-800 max-h-48 overflow-y-auto">
                                        {carrito.map(item => (
                                            <div key={item.joyaId} className="flex justify-between items-center py-2 text-sm">
                                                <div className="flex-1">
                                                    <span className="font-semibold text-zinc-200">{item.nombre}</span>
                                                    <span className="text-xs text-zinc-500 block">${item.precio.toLocaleString('es-CL')} c/u</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.cantidad}
                                                        onChange={(e) => actualizarCantidadCarrito(item.joyaId, e.target.value)}
                                                        className="w-12 p-1 bg-zinc-800 border border-zinc-700 rounded text-white text-center text-xs"
                                                    />
                                                    <span className="font-semibold text-zinc-300 w-20 text-right">${(item.precio * item.cantidad).toLocaleString('es-CL')}</span>
                                                    <button type="button" onClick={() => eliminarDelCarrito(item.joyaId)} className="text-red-500 hover:text-red-400 ml-2">&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                        {carrito.length === 0 && (
                                            <div className="text-center py-4 text-xs text-zinc-500">El carrito está vacío. Agrega una joya de la lista.</div>
                                        )}
                                    </div>

                                    {/* Total Acumulado */}
                                    <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-sm">
                                        <span className="text-zinc-400 font-bold">Ingreso Bruto Total:</span>
                                        <span className="text-green-400 font-bold text-base">${totalCarrito.toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-green-500/80">
                                        <span>Tu Comisión (10%):</span>
                                        <span className="font-bold">+${(totalCarrito * 0.1).toLocaleString('es-CL')}</span>
                                    </div>
                                </div>
                            ) : (
                                /* SECCIÓN DINÁMICA: MOVIMIENTO CONTABLE SIMPLE */
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Tipo</label>
                                            <input type="text" readOnly value={tipoMovimiento} className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded text-zinc-400 text-sm font-bold" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Monto ($)</label>
                                            <input type="number" required placeholder="0" value={montoSencillo} onChange={(e) => setMontoSencillo(e.target.value)} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Detalle / Concepto</label>
                                        <input type="text" required placeholder="Ej: Compra de 50 cajas negras de empaque" value={detalle} onChange={(e) => setDetalle(e.target.value)} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold py-3 rounded transition-colors text-sm">
                                    CANCELAR
                                </button>
                                <button type="submit" className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded transition-colors shadow-lg text-sm">
                                    REGISTRAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialPanel;