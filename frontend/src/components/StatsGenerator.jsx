import { useState, useEffect } from 'react';
import { Camera, Video, Search, BarChart3, TrendingUp } from 'lucide-react';
import logoByLuxo from '../assets/logo.jpeg';

const initialMetrics = {
    // Interacciones IG/FB separadas
    meGustaIG: '', meGustaFB: '', comentariosIG: '', comentariosFB: '',
    compartidos: '', reposts: '', guardados: '',
    // Reproducciones unificadas
    reproducciones: '', cuentasAlcanzadas: '', personasVieron: '',
    tiempoMedio: '', duracionOriginal: '', porcentajeOmision: '', distribucionLikesFotos: '', visitasPerfil: '', nuevosSeguidores: '',
    vistasSeguidores: '', vistasNoSeguidores: '', intSeguidores: '', intNoSeguidores: '',
    // NUEVAS EXCLUSIVAS PARA HISTORIA
    reproduccionesHistoria: '', cuentasAlcanzadasHistoria: '', likesHistoria: '', compartidosHistoria: '',
    visitasPerfilHistoria: '', nuevosSeguidoresHistoria: '', respuestasHistoria: '',
    avances: '', abandonos: '', siguienteHistoria: '', retrocesos: '',
    tiempoTotal: '', videoCompleto: '', fotosVisualizadas: ''
};

const InputBox = ({ label, name, type = "text", placeholder, value, onChange, borderClass = "border-zinc-700/50" }) => (
    <div className="flex flex-col">
        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 pl-1 font-bold">{label}</label>
        <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} className={`w-full p-3 bg-zinc-900/80 border rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors ${borderClass}`} />
    </div>
);

const StatsGenerator = () => {
    const [publicaciones, setPublicaciones] = useState([]);
    const [reporteGenerado, setReporteGenerado] = useState('');
    const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);

    const [activeTab, setActiveTab] = useState('Instagram');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({ tituloVideo: '', plataforma: 'Instagram', formato: 'Reel', cantidadFotos: '', ...initialMetrics });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resPubs = await fetch('https://joyas-byluxo1.onrender.com/api/publicaciones');
            if (resPubs.ok) {
                const pubs = await resPubs.json();
                pubs.sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
                setPublicaciones(pubs);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    const handleSeleccionar = (pub) => {
        setPublicacionSeleccionada(pub.id);
        setFormData({
            ...initialMetrics,
            tituloVideo: pub.titulo,
            plataforma: pub.plataforma,
            formato: pub.formato,
            cantidadFotos: pub.cantidadFotos || '',
            meGustaIG: pub.likes || '',
            comentariosIG: pub.comentarios || '',
            guardados: pub.guardados || '',
            compartidos: pub.compartidos || '',
            reproducciones: pub.reproducciones || '',
            reproduccionesHistoria: pub.reproduccionesHistoria || '',
            likesHistoria: pub.likesHistoria || '',
            respuestasHistoria: pub.respuestasHistoria || ''
        });
        setReporteGenerado('');
    };

    const handleChangeForm = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generarReporteYActualizarBD = async () => {
        const repros = Number(formData.reproducciones) || 0;
        const totalLikes = (Number(formData.meGustaIG) || 0) + (Number(formData.meGustaFB) || 0);
        const totalComents = (Number(formData.comentariosIG) || 0) + (Number(formData.comentariosFB) || 0);

        const metricasBD = {
            reproducciones: repros,
            likes: totalLikes,
            comentarios: totalComents,
            guardados: Number(formData.guardados) || 0,
            compartidos: Number(formData.compartidos) || 0,
            reproduccionesHistoria: Number(formData.reproduccionesHistoria) || 0,
            likesHistoria: Number(formData.likesHistoria) || 0,
            respuestasHistoria: Number(formData.respuestasHistoria) || 0
        };

        try {
            await fetch(`https://joyas-byluxo1.onrender.com/api/publicaciones/${publicacionSeleccionada}/metricas`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metricasBD)
            });
            cargarDatos();
        } catch (error) {
            console.error("Error al actualizar métricas en BD:", error);
        }

        let reporte = `📊 REPORTE DE ESTADÍSTICAS - ${formData.plataforma.toUpperCase()} (${formData.formato.toUpperCase()})\n`;
        reporte += `📌 Joya/Título: ${formData.tituloVideo}\n\n`;

        if (formData.plataforma === 'Instagram') {
            if (formData.formato.includes('Reel')) {
                reporte += `[Métricas de Interacción Principal]\n`;
                reporte += `- Likes: ${totalLikes || 0} | Comentarios: ${totalComents || 0}\n`;
                reporte += `- Reposts: ${formData.reposts || 0} | Compartidos: ${formData.compartidos || 0} | Guardados: ${formData.guardados || 0}\n\n`;
                reporte += `[Alcance y Retención]\n`;
                reporte += `- Visualizaciones Totales: ${repros}\n`;
                reporte += `- Cuentas Alcanzadas: ${formData.cuentasAlcanzadas || 0}\n`;
                reporte += `- Tiempo Promedio / Duración: ${formData.tiempoMedio || '0'}s / ${formData.duracionOriginal || '0'}s\n`;
                reporte += `- Porcentaje de Omisión: ${formData.porcentajeOmision || 0}%\n\n`;
                reporte += `[Detalle de Interacción y Perfil]\n`;
                reporte += `- Me gusta (Totales): ${totalLikes} (IG: ${formData.meGustaIG || 0} | FB: ${formData.meGustaFB || 0})\n`;
                reporte += `- Comentarios (Totales): ${totalComents} (IG: ${formData.comentariosIG || 0} | FB: ${formData.comentariosFB || 0})\n`;
                reporte += `- Visitas al Perfil: ${formData.visitasPerfil || 0} | Nuevos Seguidores: ${formData.nuevosSeguidores || 0}\n\n`;
                reporte += `[Audiencia (Quién vio tu reel)]\n`;
                reporte += `- Seguidores: ${formData.vistasSeguidores || 0}% | No Seguidores: ${formData.vistasNoSeguidores || 0}%\n`;
            }

            if (formData.formato.includes('Carrusel')) {
                reporte += `[Métricas de Interacción Principal]\n`;
                reporte += `- Likes: ${totalLikes || 0} | Comentarios: ${totalComents || 0}\n`;
                reporte += `- Reposts: ${formData.reposts || 0} | Compartidos: ${formData.compartidos || 0} | Guardados: ${formData.guardados || 0}\n\n`;
                reporte += `[Alcance y Conversión]\n`;
                reporte += `- Visualizaciones Totales: ${repros}\n`;
                reporte += `- Cuentas Alcanzadas: ${formData.cuentasAlcanzadas || 0}\n`;
                reporte += `- Visitas al Perfil: ${formData.visitasPerfil || 0} | Nuevos Seguidores: ${formData.nuevosSeguidores || 0}\n\n`;
                reporte += `[Retención por Foto]\n`;
                reporte += `- Cantidad Total de Fotos: ${formData.cantidadFotos || 'No esp.'}\n`;
                reporte += `- Distribución de Likes: ${formData.distribucionLikesFotos || 'N/A'}\n\n`;
                reporte += `[Audiencia]\n`;
                reporte += `- Seguidores: ${formData.vistasSeguidores || 0}% | No Seguidores: ${formData.vistasNoSeguidores || 0}%\n`;
            }

            if (formData.formato.includes('Historia')) {
                reporte += `\n--- DETALLE DE HISTORIA ---\n`;
                reporte += `[Métricas de Alcance]\n`;
                reporte += `- Personas que la vieron: ${formData.personasVieron || 0}\n`;
                reporte += `- Visualizaciones Totales: ${formData.reproduccionesHistoria || 0}\n`;
                reporte += `- Cuentas Alcanzadas: ${formData.cuentasAlcanzadasHistoria || 0}\n\n`;
                reporte += `[Interacciones y Perfil]\n`;
                const intTotH = (Number(formData.likesHistoria) || 0) + (Number(formData.respuestasHistoria) || 0) + (Number(formData.compartidosHistoria) || 0);
                reporte += `- Interacciones Totales: ${intTotH} (Likes: ${formData.likesHistoria || 0} | Respuestas: ${formData.respuestasHistoria || 0} | Compartidos: ${formData.compartidosHistoria || 0})\n`;
                reporte += `- Visitas al Perfil: ${formData.visitasPerfilHistoria || 0} | Nuevos Seguidores: ${formData.nuevosSeguidoresHistoria || 0}\n\n`;
                reporte += `[Navegación]\n`;
                const navTot = (Number(formData.avances) || 0) + (Number(formData.abandonos) || 0) + (Number(formData.siguienteHistoria) || 0) + (Number(formData.retrocesos) || 0);
                reporte += `- Total Navegación: ${navTot}\n`;
                reporte += `  - Avances: ${formData.avances || 0}\n`;
                reporte += `  - Abandonos: ${formData.abandonos || 0}\n`;
                reporte += `  - Siguiente Historia: ${formData.siguienteHistoria || 0}\n`;
                reporte += `  - Retrocesos: ${formData.retrocesos || 0}\n\n`;
                reporte += `[Desglose de Audiencia]\n`;
                reporte += `- Visualizaciones: Seguidores ${formData.vistasSeguidores || 0}% | No Seguidores ${formData.vistasNoSeguidores || 0}%\n`;
                reporte += `- Interacciones: Seguidores ${formData.intSeguidores || 0}% | No Seguidores ${formData.intNoSeguidores || 0}%\n`;
            }
        }

        if (formData.plataforma === 'TikTok') {
            if (formData.formato === 'Video') {
                reporte += `[Métricas de Interacción Principal]\n`;
                reporte += `- Reproducciones: ${repros}\n`;
                reporte += `- Likes: ${totalLikes || 0} | Comentarios: ${totalComents || 0}\n`;
                reporte += `- Compartidos: ${formData.compartidos || 0} | Guardados: ${formData.guardados || 0}\n\n`;
                reporte += `[Retención y Conversión]\n`;
                reporte += `- Visualizaciones: ${formData.visualizaciones || 0}\n`;
                reporte += `- Tiempo Total Visualizado: ${formData.tiempoTotal || '0h 0m'}\n`;
                reporte += `- Tiempo Promedio / Duración: ${formData.tiempoMedio || '0'}s / ${formData.duracionOriginal || '0'}s\n`;
                reporte += `- % Vio el video completo: ${formData.videoCompleto || 0}%\n`;
                reporte += `- Nuevos Seguidores: ${formData.nuevosSeguidores || 0}\n`;
            }

            if (formData.formato === 'Carrusel') {
                reporte += `[Métricas de Interacción Principal]\n`;
                reporte += `- Reproducciones: ${repros}\n`;
                reporte += `- Likes: ${totalLikes || 0} | Comentarios: ${totalComents || 0}\n`;
                reporte += `- Compartidos: ${formData.compartidos || 0} | Guardados: ${formData.guardados || 0}\n\n`;
                reporte += `[Retención Visual y Conversión]\n`;
                reporte += `- Fotos Visualizadas (Promedio/Total): ${formData.fotosVisualizadas || '0'}\n`;
                reporte += `- Tiempo Total Visualizado: ${formData.tiempoTotal || '0h 0m'}\n`;
                reporte += `- Nuevos Seguidores: ${formData.nuevosSeguidores || 0}\n`;
            }
        }

        setReporteGenerado(reporte);
    };

    const copiarAlPortapapeles = () => {
        navigator.clipboard.writeText(reporteGenerado);
        alert('¡Reporte copiado con éxito y listo para el Estratega!');
    };

    const videosFiltrados = publicaciones.filter(p => p.plataforma === activeTab && (p.titulo.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-2xl shadow-2xl border border-zinc-800/50 font-sans mt-6">
            <div className="flex flex-col items-center mb-8 pb-6 border-b border-zinc-800/50 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none rounded-t-2xl"></div>
                <img src={logoByLuxo} alt="Joyas byLuxo" className="w-20 h-20 object-cover rounded-full mb-4 border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.1)] relative z-10" />
                <h2 className="text-2xl font-light tracking-widest text-zinc-100 uppercase relative z-10 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-indigo-400"/> Analítica de Crecimiento</h2>
                <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">Busca el video visualmente y desglosa sus datos para el Estratega</p>
            </div>

            {!publicacionSeleccionada ? (
                <div className="animate-fade-in">
                    <div className="flex flex-col xl:flex-row gap-4 mb-8">
                        <div className="flex gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/50">
                            <button onClick={() => setActiveTab('Instagram')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 text-xs transition-all ${activeTab === 'Instagram' ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}><Camera className="w-4 h-4" /> IG</button>
                            <button onClick={() => setActiveTab('TikTok')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 text-xs transition-all ${activeTab === 'TikTok' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}><Video className="w-4 h-4" /> TK</button>
                        </div>
                        <div className="flex flex-1 items-center bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 transition-colors focus-within:border-zinc-500">
                            <Search className="w-4 h-4 text-zinc-500 mr-3" />
                            <input type="text" placeholder="Buscar por título de video..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600 w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {videosFiltrados.map(pub => (
                            <div key={pub.id} onClick={() => handleSeleccionar(pub)} className="group bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all flex flex-col justify-between h-full">
                                <div>
                                    <span className="text-[10px] text-zinc-500 font-medium block mb-2 bg-zinc-950 px-2 py-1 rounded inline-block w-fit">{pub.fechaPublicacion} • {pub.formato}</span>
                                    <h4 className="text-sm font-bold text-zinc-200 line-clamp-3 leading-snug">{pub.titulo}</h4>
                                </div>
                                <button className="mt-4 text-[10px] bg-indigo-600/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white px-3 py-2 rounded-lg w-full border border-indigo-500/30 transition-colors font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5" /> Anotar Stats
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/80 p-5 rounded-2xl border border-zinc-700/50 shadow-inner">
                        <div className="mb-4 md:mb-0">
                            <span className="text-xs text-zinc-400 font-bold tracking-widest uppercase bg-zinc-950 px-2 py-1 rounded-md">{formData.plataforma} • {formData.formato}</span>
                            <h3 className="text-xl font-light tracking-wide text-white mt-2">{formData.tituloVideo}</h3>
                        </div>
                        <button onClick={() => setPublicacionSeleccionada(null)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl border border-zinc-600 transition-colors font-bold uppercase tracking-wider w-full md:w-auto">Volver al Buscador</button>
                    </div>

                    {/* SECCIÓN IG REEL */}
                    {formData.plataforma === 'Instagram' && formData.formato.includes('Reel') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">💬 Interacción</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Reposts" name="reposts" value={formData.reposts} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} /></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">📈 Alcance y Vistas</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2"><InputBox type="number" label="Visualizaciones / Repro Totales" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} /></div>
                                    <div className="col-span-2"><InputBox type="number" label="Cuentas Alcanzadas" name="cuentasAlcanzadas" value={formData.cuentasAlcanzadas} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="% Omisión" name="porcentajeOmision" value={formData.porcentajeOmision} onChange={handleChangeForm} />
                                    <InputBox type="number" label="T. Medio (s)" name="tiempoMedio" value={formData.tiempoMedio} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Duración (s)" name="duracionOriginal" value={formData.duracionOriginal} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">👥 Totales y Perfil</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Me Gusta IG" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Me Gusta FB" name="meGustaFB" value={formData.meGustaFB} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Coments IG" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Coments FB" name="comentariosFB" value={formData.comentariosFB} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Visitas Perfil" name="visitasPerfil" value={formData.visitasPerfil} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Nuevos Segs" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">🎯 Audiencia</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <InputBox type="number" label="% Vistas Seguidores" name="vistasSeguidores" value={formData.vistasSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Vistas NO Segs" name="vistasNoSeguidores" value={formData.vistasNoSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN IG CARRUSEL */}
                    {formData.plataforma === 'Instagram' && formData.formato.includes('Carrusel') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">💬 Interacción</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Me Gusta IG" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Me Gusta FB" name="meGustaFB" value={formData.meGustaFB} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Coments IG" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Coments FB" name="comentariosFB" value={formData.comentariosFB} onChange={handleChangeForm} borderClass="border-indigo-500/30" />
                                    <InputBox type="number" label="Reposts" name="reposts" value={formData.reposts} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} /></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm md:col-span-2">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">📸 Retención y Perfil</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Visualizaciones Totales" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Cuentas Alcanzadas" name="cuentasAlcanzadas" value={formData.cuentasAlcanzadas} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Visitas Perfil" name="visitasPerfil" value={formData.visitasPerfil} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Nuevos Segs" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                    <div className="col-span-2">
                                        <InputBox type="text" label="Distribución Likes (Ej: Foto 1: 15, Foto 2: 5)" name="distribucionLikesFotos" value={formData.distribucionLikesFotos} onChange={handleChangeForm} borderClass="border-pink-500/30 bg-pink-900/5" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">🎯 Audiencia</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <InputBox type="number" label="% Vistas Seguidores" name="vistasSeguidores" value={formData.vistasSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Vistas NO Segs" name="vistasNoSeguidores" value={formData.vistasNoSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN IG HISTORIA - VARIABLE SEPARADA */}
                    {formData.plataforma === 'Instagram' && formData.formato.includes('Historia') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="bg-pink-900/10 p-5 rounded-2xl border border-pink-900/30 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 uppercase border-b border-pink-900/50 pb-2 text-pink-400">⏱️ Alcance Historia</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <InputBox type="number" label="Personas Vieron" name="personasVieron" value={formData.personasVieron} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Visualizaciones Totales" name="reproduccionesHistoria" value={formData.reproduccionesHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Cuentas Alcanzadas" name="cuentasAlcanzadasHistoria" value={formData.cuentasAlcanzadasHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                </div>
                            </div>
                            <div className="bg-pink-900/10 p-5 rounded-2xl border border-pink-900/30 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 uppercase border-b border-pink-900/50 pb-2 text-pink-400">💬 Interacción y Perfil</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Likes" name="likesHistoria" value={formData.likesHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Respuestas" name="respuestasHistoria" value={formData.respuestasHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <div className="col-span-2"><InputBox type="number" label="Compartidos" name="compartidosHistoria" value={formData.compartidosHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" /></div>
                                    <InputBox type="number" label="Visitas Perfil" name="visitasPerfilHistoria" value={formData.visitasPerfilHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Nuevos Segs" name="nuevosSeguidoresHistoria" value={formData.nuevosSeguidoresHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                </div>
                            </div>
                            <div className="bg-pink-900/10 p-5 rounded-2xl border border-pink-900/30 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 uppercase border-b border-pink-900/50 pb-2 text-pink-400">➡️ Navegación</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Avances" name="avances" value={formData.avances} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Abandonos" name="abandonos" value={formData.abandonos} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Sgte. Histo" name="siguienteHistoria" value={formData.siguienteHistoria} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="Retrocesos" name="retrocesos" value={formData.retrocesos} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                </div>
                            </div>
                            <div className="bg-pink-900/10 p-5 rounded-2xl border border-pink-900/30 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 uppercase border-b border-pink-900/50 pb-2 text-pink-400">🎯 Desglose Audiencia</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="% Vistas (Segs)" name="vistasSeguidores" value={formData.vistasSeguidores} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="% Vistas (No Segs)" name="vistasNoSeguidores" value={formData.vistasNoSeguidores} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="% Int. (Segs)" name="intSeguidores" value={formData.intSeguidores} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                    <InputBox type="number" label="% Int. (No Segs)" name="intNoSeguidores" value={formData.intNoSeguidores} onChange={handleChangeForm} borderClass="border-pink-800/50 focus:border-pink-400" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN TIKTOK VIDEO */}
                    {formData.plataforma === 'TikTok' && formData.formato === 'Video' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">💬 Interacción TK</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2"><InputBox type="number" label="Reproducciones" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="Likes" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Comentarios" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">📈 Retención y Vistas</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputBox type="number" label="Visualizaciones" name="visualizaciones" value={formData.visualizaciones} onChange={handleChangeForm} />
                                    <InputBox type="text" label="Tiempo Total" name="tiempoTotal" placeholder="Ej: 2h 45m" value={formData.tiempoTotal} onChange={handleChangeForm} />
                                    <InputBox type="number" label="T. Promedio (s)" name="tiempoMedio" value={formData.tiempoMedio} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Duración Orig (s)" name="duracionOriginal" value={formData.duracionOriginal} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="% Vio Completo" name="videoCompleto" value={formData.videoCompleto} onChange={handleChangeForm} /></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">👥 Perfil</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <InputBox type="number" label="Nuevos Seguidores" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN TIKTOK CARRUSEL */}
                    {formData.plataforma === 'TikTok' && formData.formato === 'Carrusel' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">💬 Interacción TK</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2"><InputBox type="number" label="Reproducciones" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="Likes" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Comentarios" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">📸 Retención Visual</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <InputBox type="text" label="Fotos Visualizadas (Ej: 1.4 / 4)" name="fotosVisualizadas" value={formData.fotosVisualizadas} onChange={handleChangeForm} borderClass="border-blue-500/30 bg-blue-900/5 focus:border-blue-400" />
                                    <InputBox type="text" label="Tiempo Total" name="tiempoTotal" placeholder="Ej: 2h 45m" value={formData.tiempoTotal} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
                                <h3 className="text-xs font-bold mb-4 text-zinc-300 uppercase border-b border-zinc-700/50 pb-2">👥 Perfil</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <InputBox type="number" label="Nuevos Seguidores" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-zinc-800/50 flex flex-col md:flex-row gap-4">
                        <button onClick={generarReporteYActualizarBD} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-widest py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all text-sm">
                            ✨ GENERAR REPORTE ORDENADO
                        </button>
                    </div>

                    {reporteGenerado && (
                        <div className="mt-6 animate-fade-in relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-xl z-10"></div>
                            <textarea readOnly value={reporteGenerado} className="w-full h-96 p-5 pt-8 bg-zinc-950 text-zinc-300 font-mono text-xs rounded-xl border border-zinc-700 focus:outline-none mb-3 resize-none leading-relaxed shadow-inner custom-scrollbar relative z-0"></textarea>
                            <button onClick={copiarAlPortapapeles} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3.5 px-6 rounded-xl transition-colors border border-zinc-600 shadow-lg text-sm uppercase tracking-wider">
                                📋 COPIAR TEXTO AL PORTAPAPELES
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatsGenerator;