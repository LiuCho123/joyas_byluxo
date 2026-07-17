import { useState, useEffect } from 'react';
import logoByLuxo from '../assets/logo.jpeg';

const InventoryPanel = () => {
    const [inventory, setInventory] = useState([]);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroIgEstado, setFiltroIgEstado] = useState('');
    const [soloOfertas, setSoloOfertas] = useState(false);
    const [ocultarVendidos, setOcultarVendidos] = useState(true);

    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('fisica'); // 'fisica' | 'redes'

    const [formData, setFormData] = useState({
        id: null, nombre: '', stock: 1, precio: '', precioOferta: '', largo: '', peso: '', fotoUrl: '',
        categoria: '', fechaAdquisicion: '',
        estadoRedes: {
            igEstado: 'No subido', igUltimaFecha: '', igFormato: '',
            tkEstado: 'No subido', tkUltimaFecha: '', tkFormato: '',
            mkpEstado: 'No subido', mkpUltimaFecha: '', mkpConversacion: 'Nunca',
            wspCatalogo: 'No subido', wspUltimaFecha: ''
        }
    });

    useEffect(() => {
        cargarInventario();
    }, []);

    const cargarInventario = async () => {
        try {
            // Usa tu URL de Vercel/Render si estás en prod, o localhost si estás probando localmente
            const response = await fetch('https://joyas-byluxo1.onrender.com/api/joyas');
            if (response.ok) {
                const data = await response.json();
                setInventory(data);
            }
        } catch (error) {
            console.error("Error conectando con el servidor:", error);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('estadoRedes.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                estadoRedes: { ...prev.estadoRedes, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://joyas-byluxo1.onrender.com/api/joyas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    precio: Number(formData.precio),
                    precioOferta: formData.precioOferta ? Number(formData.precioOferta) : null,
                    largo: Number(formData.largo),
                    peso: Number(formData.peso),
                    stock: parseInt(formData.stock) || 0
                })
            });

            if (response.ok) {
                cerrarModal();
                cargarInventario();
            }
        } catch (error) {
            console.error("Error al guardar la joya:", error);
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar esta joya de forma permanente? Esta acción no se puede deshacer.")) {
            try {
                const response = await fetch(`https://joyas-byluxo1.onrender.com/api/joyas/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    cargarInventario();
                }
            } catch (error) {
                console.error("Error al eliminar la joya:", error);
            }
        }
    };

    // EL BOTÓN MÁGICO DE DESCARGA
    const descargarExcel = async () => {
        try {
            const res = await fetch('https://joyas-byluxo1.onrender.com/api/joyas/exportar/excel');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Joyas_ByLuxo.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Error al generar el Excel desde el servidor.');
            }
        } catch (error) {
            console.error('Error descargando el archivo:', error);
        }
    };

    const abrirParaEditar = (joya) => {
        setFormData({
            id: joya.id,
            nombre: joya.nombre || '',
            stock: joya.stock !== undefined ? joya.stock : 1,
            precio: joya.precio || '',
            precioOferta: joya.precioOferta || '',
            largo: joya.largo || '',
            peso: joya.peso || '',
            fotoUrl: joya.fotoUrl || '',
            categoria: joya.categoria || '',
            fechaAdquisicion: joya.fechaAdquisicion || '',
            estadoRedes: joya.estadoRedes || {
                igEstado: 'No subido', igUltimaFecha: '', igFormato: '',
                tkEstado: 'No subido', tkUltimaFecha: '', tkFormato: '',
                mkpEstado: 'No subido', mkpUltimaFecha: '', mkpConversacion: 'Nunca',
                wspCatalogo: 'No subido', wspUltimaFecha: ''
            }
        });
        setActiveTab('fisica');
        setIsModalOpen(true);
    };

    const cerrarModal = () => {
        setIsModalOpen(false);
        setFormData({
            id: null, nombre: '', stock: 1, precio: '', precioOferta: '', largo: '', peso: '', fotoUrl: '',
            categoria: '', fechaAdquisicion: '',
            estadoRedes: {
                igEstado: 'No subido', igUltimaFecha: '', igFormato: '',
                tkEstado: 'No subido', tkUltimaFecha: '', tkFormato: '',
                mkpEstado: 'No subido', mkpUltimaFecha: '', mkpConversacion: 'Nunca',
                wspCatalogo: 'No subido', wspUltimaFecha: ''
            }
        });
    };

    // Lógica de Filtros Múltiples
    const filteredInventory = inventory.filter(joya => {
        const matchesSearch = joya.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategoria = filtroCategoria === '' || joya.categoria === filtroCategoria;
        const matchesIg = filtroIgEstado === '' || (joya.estadoRedes && joya.estadoRedes.igEstado === filtroIgEstado);
        const matchesOferta = soloOfertas ? (joya.precioOferta > 0) : true;
        const matchesStock = ocultarVendidos ? (joya.stock > 0) : true;

        return matchesSearch && matchesCategoria && matchesIg && matchesOferta && matchesStock;
    });

    const getStatusColor = (estado) => {
        if (estado === 'Activo') return 'text-green-400 bg-green-400/10 border-green-500/30';
        if (estado === 'Archivado') return 'text-red-400 bg-red-400/10 border-red-500/30';
        if (estado === 'No subido') return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30';
        return 'text-zinc-500 bg-zinc-800/50 border-zinc-700';
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-xl shadow-2xl border border-zinc-800 font-sans mt-6 relative">

            {/* Header y Botones Maestros */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-zinc-800 gap-4">
                <div className="flex items-center gap-4">
                    <img src={logoByLuxo} alt="Joyas byLuxo" className="w-16 h-16 object-cover rounded-full border border-zinc-700 shadow-md" />
                    <div>
                        <h2 className="text-2xl font-light tracking-widest text-zinc-100 uppercase">Inventario Maestro</h2>
                        <p className="text-sm text-zinc-500">Logística de Plata 925 y Ecosistema de Redes</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={descargarExcel} className="flex-1 md:flex-none bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30 font-bold tracking-widest py-3 px-6 rounded transition-colors text-sm shadow-lg flex items-center justify-center gap-2">
                        📊 EXPORTAR EXCEL
                    </button>
                    <button onClick={() => { cerrarModal(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-white text-black hover:bg-zinc-200 font-bold tracking-widest py-3 px-6 rounded transition-colors shadow-lg text-sm">
                        + NUEVA JOYA
                    </button>
                </div>
            </div>

            {/* Panel de Filtros */}
            <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col md:col-span-2">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">🔍 Buscar Joya</label>
                    <input type="text" placeholder="Ej: Cadena Grumet..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2.5 bg-zinc-800/80 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400 transition-colors"/>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">📂 Categoría</label>
                    <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full p-2.5 bg-zinc-800/80 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400">
                        <option value="">Todas</option>
                        <option value="Cadena">Cadena</option>
                        <option value="Pulsera">Pulsera</option>
                        <option value="Aro">Aro</option>
                        <option value="Tobillera">Tobillera</option>
                        <option value="Colgante">Colgante</option>
                        <option value="Anillo">Anillo</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">📱 Estado IG</label>
                    <select value={filtroIgEstado} onChange={(e) => setFiltroIgEstado(e.target.value)} className="w-full p-2.5 bg-zinc-800/80 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400">
                        <option value="">Todos</option>
                        <option value="Activo">Activo</option>
                        <option value="Archivado">Archivado</option>
                        <option value="No subido">No subido</option>
                    </select>
                </div>

                {/* Checkboxes de Filtro Rápido */}
                <div className="md:col-span-4 flex flex-wrap gap-6 pt-2 border-t border-zinc-800/50">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300 hover:text-white transition-colors">
                        <input type="checkbox" checked={soloOfertas} onChange={(e) => setSoloOfertas(e.target.checked)} className="w-4 h-4 accent-white bg-zinc-800 border-zinc-700 rounded cursor-pointer" />
                        🔥 Ver solo joyas en Oferta
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300 hover:text-white transition-colors">
                        <input type="checkbox" checked={ocultarVendidos} onChange={(e) => setOcultarVendidos(e.target.checked)} className="w-4 h-4 accent-white bg-zinc-800 border-zinc-700 rounded cursor-pointer" />
                        👁️ Ocultar Agotados (Stock 0)
                    </label>
                </div>
            </div>

            {/* Tabla Principal */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800">
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Foto</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre y Detalles</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Stock</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Precio</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Instagram</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">TikTok</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Marketplace</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">WSP Catálogo</th>
                        <th className="p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                    {filteredInventory.map((joya) => {
                        const redes = joya.estadoRedes || {};
                        return (
                            <tr key={joya.id} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="p-3 text-center">
                                    {joya.fotoUrl ? (
                                        <img src={joya.fotoUrl} alt="joya" className="w-10 h-10 object-cover rounded border border-zinc-700 mx-auto" />
                                    ) : (
                                        <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500 mx-auto border border-zinc-700">Sin img</div>
                                    )}
                                </td>
                                <td className="p-3 text-sm font-medium text-zinc-200">
                                    {joya.nombre}
                                    <div className="text-[10px] text-zinc-500 mt-0.5">
                                        <span className="font-bold text-zinc-400">{joya.categoria || 'Sin Cat.'}</span> • {joya.largo}cm • {joya.peso}g
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-center">
                                    <span className={`font-bold ${joya.stock === 0 ? 'text-red-400' : 'text-zinc-300'}`}>{joya.stock}</span>
                                </td>
                                <td className="p-3 text-sm text-zinc-300">
                                    {joya.precioOferta > 0 ? (
                                        <div>
                                            <span className="text-red-400 font-bold line-through text-xs block">${joya.precio.toLocaleString('es-CL')}</span>
                                            <span className="text-green-400 font-bold text-base">${joya.precioOferta.toLocaleString('es-CL')}</span>
                                        </div>
                                    ) : (
                                        <span className="font-medium">${joya.precio.toLocaleString('es-CL')}</span>
                                    )}
                                </td>

                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-[10px] border rounded font-semibold tracking-wide ${getStatusColor(redes.igEstado)}`}>{redes.igEstado || 'N/A'}</span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-[10px] border rounded font-semibold tracking-wide ${getStatusColor(redes.tkEstado)}`}>{redes.tkEstado || 'N/A'}</span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-[10px] border rounded font-semibold tracking-wide ${getStatusColor(redes.mkpEstado)}`}>{redes.mkpEstado || 'N/A'}</span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-[10px] border rounded font-semibold tracking-wide ${getStatusColor(redes.wspCatalogo)}`}>{redes.wspCatalogo || 'N/A'}</span>
                                </td>

                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-3 items-center">
                                        <button onClick={() => abrirParaEditar(joya)} className="text-zinc-400 hover:text-white transition-colors text-sm underline decoration-zinc-600 underline-offset-4">Editar</button>
                                        <button onClick={() => handleEliminar(joya.id)} className="text-red-500 hover:text-red-400 transition-colors text-sm font-semibold">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                {filteredInventory.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                        No se encontraron joyas que coincidan con los filtros.
                    </div>
                )}
            </div>

            {/* MODAL DE EDICIÓN / CREACIÓN */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-light tracking-widest text-zinc-100 uppercase">
                                {formData.id ? '✏️ Editar Joya' : '✨ Añadir Joya'}
                            </h3>
                            <button onClick={cerrarModal} className="text-zinc-500 hover:text-white text-xl">&times;</button>
                        </div>

                        {/* Pestañas del Modal */}
                        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-2">
                            <button
                                onClick={(e) => { e.preventDefault(); setActiveTab('fisica'); }}
                                className={`px-4 py-2 text-sm font-bold tracking-wide rounded ${activeTab === 'fisica' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                📦 INFO FÍSICA Y COMERCIAL
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); setActiveTab('redes'); }}
                                className={`px-4 py-2 text-sm font-bold tracking-wide rounded ${activeTab === 'redes' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                📱 ECOSISTEMA RRSS
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="flex flex-col gap-5">

                            {/* TAB: INFO FÍSICA Y COMERCIAL */}
                            {activeTab === 'fisica' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col md:col-span-2">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Nombre</label>
                                        <input type="text" name="nombre" required value={formData.nombre} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Categoría</label>
                                        <select name="categoria" value={formData.categoria} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400">
                                            <option value="">-- Seleccionar --</option>
                                            <option value="Cadena">Cadena</option>
                                            <option value="Pulsera">Pulsera</option>
                                            <option value="Aro">Aro</option>
                                            <option value="Tobillera">Tobillera</option>
                                            <option value="Colgante">Colgante</option>
                                            <option value="Anillo">Anillo</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Fecha de Adquisición (Stock)</label>
                                        <input type="date" name="fechaAdquisicion" value={formData.fechaAdquisicion} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>

                                    <div className="md:col-span-2 border-t border-zinc-800 my-2 pt-2"></div>

                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Precio Base ($)</label>
                                        <input type="number" name="precio" required value={formData.precio} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-green-400 uppercase tracking-wider mb-1 pl-1 font-bold">Precio Oferta ($) <span className="text-zinc-500 font-normal lowercase">- Opcional</span></label>
                                        <input type="number" name="precioOferta" placeholder="Si hay oferta..." value={formData.precioOferta} onChange={handleFormChange} className="p-2.5 bg-zinc-900/50 border border-green-800/50 rounded text-green-400 text-sm focus:outline-none focus:border-green-500 placeholder:text-zinc-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Stock</label>
                                        <input type="number" name="stock" required value={formData.stock} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" min="0" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Link Foto (URL)</label>
                                        <input type="text" name="fotoUrl" value={formData.fotoUrl} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-400 text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Largo (cm)</label>
                                        <input type="number" step="0.1" name="largo" value={formData.largo} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">Peso (g)</label>
                                        <input type="number" step="0.1" name="peso" value={formData.peso} onChange={handleFormChange} className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400" />
                                    </div>
                                </div>
                            )}

                            {/* TAB: ECOSISTEMA RRSS */}
                            {activeTab === 'redes' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* IG */}
                                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-700 pb-1">Instagram</h4>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Estado</label>
                                            <select name="estadoRedes.igEstado" value={formData.estadoRedes.igEstado} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs">
                                                <option value="Activo">Activo</option><option value="Archivado">Archivado</option><option value="No subido">No subido</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Última Fecha</label>
                                            <input type="date" name="estadoRedes.igUltimaFecha" value={formData.estadoRedes.igUltimaFecha} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Formato</label>
                                            <input type="text" name="estadoRedes.igFormato" placeholder="Ej: Reel / Carrusel" value={formData.estadoRedes.igFormato} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                    </div>

                                    {/* TikTok */}
                                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-700 pb-1">TikTok</h4>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Estado</label>
                                            <select name="estadoRedes.tkEstado" value={formData.estadoRedes.tkEstado} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs">
                                                <option value="Activo">Activo</option><option value="Archivado">Archivado</option><option value="No subido">No subido</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Última Fecha</label>
                                            <input type="date" name="estadoRedes.tkUltimaFecha" value={formData.estadoRedes.tkUltimaFecha} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Formato</label>
                                            <input type="text" name="estadoRedes.tkFormato" placeholder="Ej: Video" value={formData.estadoRedes.tkFormato} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                    </div>

                                    {/* Marketplace */}
                                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-700 pb-1">Marketplace</h4>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Estado</label>
                                            <select name="estadoRedes.mkpEstado" value={formData.estadoRedes.mkpEstado} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs">
                                                <option value="Activo">Activo</option><option value="Archivado">Archivado</option><option value="No subido">No subido</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Última Fecha Subida</label>
                                            <input type="date" name="estadoRedes.mkpUltimaFecha" value={formData.estadoRedes.mkpUltimaFecha} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Última Conversación</label>
                                            <input type="date" name="estadoRedes.mkpConversacion" value={formData.estadoRedes.mkpConversacion} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                    </div>

                                    {/* WhatsApp */}
                                    <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-700 pb-1">WhatsApp Business</h4>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Catálogo Fijo</label>
                                            <select name="estadoRedes.wspCatalogo" value={formData.estadoRedes.wspCatalogo} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs">
                                                <option value="Activo">Activo</option><option value="Archivado">Archivado</option><option value="No subido">No subido</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Última vez en Estados (Vlogs/Gancho)</label>
                                            <input type="date" name="estadoRedes.wspUltimaFecha" value={formData.estadoRedes.wspUltimaFecha} onChange={handleFormChange} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
                                <button type="button" onClick={cerrarModal} className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold py-3 rounded transition-colors text-sm">
                                    CANCELAR
                                </button>
                                <button type="submit" className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded transition-colors shadow-lg text-sm">
                                    GUARDAR JOYA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPanel;