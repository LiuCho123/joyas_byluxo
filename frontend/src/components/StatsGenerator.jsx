import { useState, useEffect } from 'react';
import { Camera, Video, Search } from 'lucide-react';
import logoByLuxo from '../assets/logo.jpeg';

const initialMetrics = {
    // Interacciones IG/FB separadas
    meGustaIG: '', meGustaFB: '', comentariosIG: '', comentariosFB: '',
    compartidos: '', reposts: '', guardados: '',
    // Reproducciones unificadas
    reproducciones: '', cuentasAlcanzadas: '', personasVieron: '',
    tiempoMedio: '', duracionOriginal: '', porcentajeOmision: '', distribucionLikesFotos: '', visitasPerfil: '', nuevosSeguidores: '',
    vistasSeguidores: '', vistasNoSeguidores: '', intSeguidores: '', intNoSeguidores: '', respuestas: '', avances: '', abandonos: '', siguienteHistoria: '', retrocesos: '',
    tiempoTotal: '', videoCompleto: '', fotosVisualizadas: ''
};

const InputBox = ({ label, name, type = "text", placeholder, value, onChange, borderClass = "" }) => (
    <div className="flex flex-col">
        <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 pl-1 font-bold">{label}</label>
        <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} className={`w-full p-2 bg-zinc-800/80 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-zinc-400 transition-colors ${borderClass}`} />
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
            reproducciones: pub.reproducciones || ''
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
            compartidos: Number(formData.compartidos) || 0
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
                reporte += `- Visualizaciones Totales: ${repros}\n`;
                reporte += `- Cuentas Alcanzadas: ${formData.cuentasAlcanzadas || 0}\n\n`;
                reporte += `[Interacciones y Perfil]\n`;
                const intTot = totalLikes + (Number(formData.respuestas) || 0) + (Number(formData.compartidos) || 0);
                reporte += `- Interacciones Totales: ${intTot} (Likes: ${totalLikes || 0} | Respuestas: ${formData.respuestas || 0} | Compartidos: ${formData.compartidos || 0})\n`;
                reporte += `- Visitas al Perfil: ${formData.visitasPerfil || 0} | Nuevos Seguidores: ${formData.nuevosSeguidores || 0}\n\n`;
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
        <div className="max-w-7xl mx-auto p-6 bg-zinc-950 text-gray-200 rounded-xl shadow-2xl border border-zinc-800 font-sans mt-6">
            <div className="flex flex-col items-center mb-6 border-b border-zinc-800 pb-6">
                <img src={logoByLuxo} alt="Joyas byLuxo" className="w-20 h-20 object-cover rounded-full mb-3 border border-zinc-700 shadow-md" />
                <h2 className="text-xl font-light tracking-widest text-zinc-100 uppercase">Actualización de Métricas & Excel</h2>
                <p className="text-sm text-zinc-500 mt-1">Busca el video visualmente y desglosa sus datos</p>
            </div>

            {!publicacionSeleccionada ? (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex gap-2">
                            <button onClick={() => setActiveTab('Instagram')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 text-xs ${activeTab === 'Instagram' ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'}`}><Camera className="w-4 h-4" /> IG</button>
                            <button onClick={() => setActiveTab('TikTok')} className={`px-6 py-2.5 font-bold tracking-widest rounded-lg flex items-center gap-2 text-xs ${activeTab === 'TikTok' ? 'bg-black text-white border border-zinc-700' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'}`}><Video className="w-4 h-4" /> TK</button>
                        </div>
                        <div className="flex flex-1 items-center bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                            <Search className="w-4 h-4 text-zinc-500 mr-2" />
                            <input type="text" placeholder="Buscar por título de video..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
                        {videosFiltrados.map(pub => (
                            <div key={pub.id} onClick={() => handleSeleccionar(pub)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-colors">
                                <span className="text-[10px] text-zinc-500 block mb-1">{pub.fechaPublicacion} • {pub.formato}</span>
                                <h4 className="text-sm font-bold text-zinc-200 line-clamp-2">{pub.titulo}</h4>
                                <button className="mt-3 text-[10px] bg-zinc-800 text-white px-3 py-1 rounded w-full border border-zinc-700 font-bold uppercase tracking-wider">Anotar Stats</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg border border-zinc-700 mb-6">
                        <div>
                            <span className="text-xs text-zinc-400">{formData.plataforma} • {formData.formato}</span>
                            <h3 className="text-lg font-bold text-white">{formData.tituloVideo}</h3>
                        </div>
                        <button onClick={() => setPublicacionSeleccionada(null)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded border border-zinc-600 transition-colors font-bold uppercase">Volver al Buscador</button>
                    </div>

                    {/* SECCIÓN IG REEL */}
                    {formData.plataforma === 'Instagram' && formData.formato.includes('Reel') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">💬 Interacción</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Reposts" name="reposts" value={formData.reposts} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} /></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">📈 Alcance y Vistas</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2"><InputBox type="number" label="Visualizaciones / Repro Totales" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} /></div>
                                    <div className="col-span-2"><InputBox type="number" label="Cuentas Alcanzadas" name="cuentasAlcanzadas" value={formData.cuentasAlcanzadas} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="% Omisión" name="porcentajeOmision" value={formData.porcentajeOmision} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Tiempo Medio (s)" name="tiempoMedio" value={formData.tiempoMedio} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Duración Reel (s)" name="duracionOriginal" value={formData.duracionOriginal} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">👥 Totales y Perfil</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Me Gusta IG" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Me Gusta FB" name="meGustaFB" value={formData.meGustaFB} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Coments IG" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Coments FB" name="comentariosFB" value={formData.comentariosFB} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Visitas Perfil" name="visitasPerfil" value={formData.visitasPerfil} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Nuevos Segs" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">🎯 Audiencia</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InputBox type="number" label="% Vistas Seguidores" name="vistasSeguidores" value={formData.vistasSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Vistas NO Segs" name="vistasNoSeguidores" value={formData.vistasNoSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN IG CARRUSEL */}
                    {formData.plataforma === 'Instagram' && formData.formato.includes('Carrusel') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">💬 Interacción</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Me Gusta IG" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Me Gusta FB" name="meGustaFB" value={formData.meGustaFB} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Coments IG" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Coments FB" name="comentariosFB" value={formData.comentariosFB} onChange={handleChangeForm} borderClass="border-blue-500/50" />
                                    <InputBox type="number" label="Reposts" name="reposts" value={formData.reposts} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} /></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 md:col-span-2">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">📸 Retención y Perfil</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Visualizaciones Totales" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Cuentas Alcanzadas" name="cuentasAlcanzadas" value={formData.cuentasAlcanzadas} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Visitas Perfil" name="visitasPerfil" value={formData.visitasPerfil} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Nuevos Segs" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                    <div className="col-span-2">
                                        <InputBox type="text" label="Distribución Likes (Ej: Foto 1: 15, Foto 2: 5)" name="distribucionLikesFotos" value={formData.distribucionLikesFotos} onChange={handleChangeForm} borderClass="border-pink-500/50 bg-pink-900/10" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">🎯 Audiencia</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InputBox type="number" label="% Vistas Seguidores" name="vistasSeguidores" value={formData.vistasSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Vistas NO Segs" name="vistasNoSeguidores" value={formData.vistasNoSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN IG HISTORIA */}
                    {formData.plataforma === 'Instagram' && formData.formato.includes('Historia') && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-pink-900/50 pb-2 text-pink-400">⏱️ Alcance Historia</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InputBox type="number" label="Personas Vieron" name="personasVieron" value={formData.personasVieron} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Visualizaciones Totales" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Cuentas Alcanzadas" name="cuentasAlcanzadas" value={formData.cuentasAlcanzadas} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-pink-900/50 pb-2 text-pink-400">💬 Interacción y Perfil</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Likes" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Respuestas" name="respuestas" value={formData.respuestas} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="Visitas Perfil" name="visitasPerfil" value={formData.visitasPerfil} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Nuevos Segs" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-pink-900/50 pb-2 text-pink-400">➡️ Navegación</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Avances" name="avances" value={formData.avances} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Abandonos" name="abandonos" value={formData.abandonos} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Sgte. Histo" name="siguienteHistoria" value={formData.siguienteHistoria} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Retrocesos" name="retrocesos" value={formData.retrocesos} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-pink-900/50 pb-2 text-pink-400">🎯 Desglose Audiencia</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="% Vistas (Segs)" name="vistasSeguidores" value={formData.vistasSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Vistas (No Segs)" name="vistasNoSeguidores" value={formData.vistasNoSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Interac. (Segs)" name="intSeguidores" value={formData.intSeguidores} onChange={handleChangeForm} />
                                    <InputBox type="number" label="% Interac. (No Segs)" name="intNoSeguidores" value={formData.intNoSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN TIKTOK VIDEO */}
                    {formData.plataforma === 'TikTok' && formData.formato === 'Video' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">💬 Interacción TK</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2"><InputBox type="number" label="Reproducciones" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="Likes" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Comentarios" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">📈 Retención y Vistas</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputBox type="number" label="Visualizaciones" name="visualizaciones" value={formData.visualizaciones} onChange={handleChangeForm} />
                                    <InputBox type="text" label="Tiempo Total" name="tiempoTotal" placeholder="Ej: 2h 45m" value={formData.tiempoTotal} onChange={handleChangeForm} />
                                    <InputBox type="number" label="T. Promedio (s)" name="tiempoMedio" value={formData.tiempoMedio} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Duración Orig (s)" name="duracionOriginal" value={formData.duracionOriginal} onChange={handleChangeForm} />
                                    <div className="col-span-2"><InputBox type="number" label="% Vio Completo" name="videoCompleto" value={formData.videoCompleto} onChange={handleChangeForm} /></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">👥 Perfil</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InputBox type="number" label="Nuevos Seguidores" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN TIKTOK CARRUSEL */}
                    {formData.plataforma === 'TikTok' && formData.formato === 'Carrusel' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">💬 Interacción TK</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2"><InputBox type="number" label="Reproducciones" name="reproducciones" value={formData.reproducciones} onChange={handleChangeForm} /></div>
                                    <InputBox type="number" label="Likes" name="meGustaIG" value={formData.meGustaIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Comentarios" name="comentariosIG" value={formData.comentariosIG} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Compartidos" name="compartidos" value={formData.compartidos} onChange={handleChangeForm} />
                                    <InputBox type="number" label="Guardados" name="guardados" value={formData.guardados} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">📸 Retención Visual</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InputBox type="text" label="Fotos Visualizadas (Ej: 1.4 / 4)" name="fotosVisualizadas" value={formData.fotosVisualizadas} onChange={handleChangeForm} borderClass="border-blue-500/50 bg-blue-900/10" />
                                    <InputBox type="text" label="Tiempo Total" name="tiempoTotal" placeholder="Ej: 2h 45m" value={formData.tiempoTotal} onChange={handleChangeForm} />
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <h3 className="text-xs font-bold mb-3 text-zinc-100 uppercase border-b border-zinc-700 pb-2">👥 Perfil</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InputBox type="number" label="Nuevos Seguidores" name="nuevosSeguidores" value={formData.nuevosSeguidores} onChange={handleChangeForm} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button onClick={generarReporteYActualizarBD} className="bg-white text-black hover:bg-zinc-200 font-bold tracking-widest py-3 px-8 rounded transition-colors shadow-lg text-sm w-full md:w-auto">
                            ✨ GENERAR REPORTE ORDENADO
                        </button>
                    </div>

                    {reporteGenerado && (
                        <div className="mt-6 animate-fade-in">
                            <textarea readOnly value={reporteGenerado} className="w-full h-80 p-4 bg-zinc-900 text-zinc-300 font-mono text-xs rounded-lg border border-zinc-700 focus:outline-none mb-3 resize-none leading-relaxed shadow-inner"></textarea>
                            <button onClick={copiarAlPortapapeles} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded transition-colors border border-zinc-600 shadow-lg text-sm">
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