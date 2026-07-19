package com.liucho.backend.Controller;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Publicacion;
import com.liucho.backend.Model.PublicacionJoya;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Repository.PublicacionRepository;
import com.liucho.backend.Service.PublicacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/publicaciones")
@CrossOrigin(origins = "*")
public class PublicacionController {

    @Autowired
    private PublicacionRepository publicacionRepository;

    @Autowired
    private JoyaRepository joyaRepository;

    @Autowired
    private PublicacionService publicacionService;

    // --- MOTOR MAESTRO DE RECÁLCULO ---
    // Analiza la joya y le asigna el estado exacto (Activo, Archivado, No subido o Falta actualizar)
    private void recalcularEstadoRedes(Joya joya) {
        List<Publicacion> todas = publicacionRepository.findAll();
        boolean enIg = false, enTk = false, enMkp = false, enWsp = false;
        boolean igDesc = false, tkDesc = false, mkpDesc = false, wspDesc = false;

        for (Publicacion p : todas) {
            if (p.getRelaciones() != null) {
                for (PublicacionJoya r : p.getRelaciones()) {
                    if (r.getJoya().getId().equals(joya.getId())) {
                        String plat = p.getPlataforma() != null ? p.getPlataforma() : "";
                        boolean descuadrado = !r.getStockAlSubir().equals(joya.getStock());

                        if (plat.equalsIgnoreCase("Instagram")) { enIg = true; if(descuadrado) igDesc = true; }
                        if (plat.equalsIgnoreCase("TikTok")) { enTk = true; if(descuadrado) tkDesc = true; }
                        if (plat.equalsIgnoreCase("Marketplace")) { enMkp = true; if(descuadrado) mkpDesc = true; }
                        if (plat.equalsIgnoreCase("WhatsApp") && "Catálogo".equalsIgnoreCase(p.getFormato())) {
                            enWsp = true; if(descuadrado) wspDesc = true;
                        }
                    }
                }
            }
        }

        EstadoRedes redes = joya.getEstadoRedes();
        if (redes == null) {
            redes = new EstadoRedes();
            joya.setEstadoRedes(redes);
        }

        // Regla estricta: Stock cero = Archivado inmediato
        if (joya.getStock() == null || joya.getStock() == 0) {
            redes.setIgEstado("Archivado");
            redes.setTkEstado("Archivado");
            redes.setMkpEstado("Archivado");
            redes.setWspCatalogo("Archivado");
        } else {
            redes.setIgEstado(enIg ? (igDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setTkEstado(enTk ? (tkDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setMkpEstado(enMkp ? (mkpDesc ? "Falta actualizar" : "Activo") : "No subido");
            redes.setWspCatalogo(enWsp ? (wspDesc ? "Falta actualizar" : "Activo") : "No subido");
        }
        joyaRepository.save(joya);
    }

    @GetMapping
    public List<Publicacion> obtenerTodas(){
        List<Publicacion> todas = publicacionRepository.findAll();
        LocalDate hace5Dias = LocalDate.now().minusDays(5);
        boolean huboBorrados = false;

        // Limpieza automática de Historias
        for (Publicacion pub : todas) {
            if ("Historia".equalsIgnoreCase(pub.getFormato()) &&
                    pub.getFechaPublicacion() != null &&
                    pub.getFechaPublicacion().isBefore(hace5Dias)) {

                Set<Joya> joyasAfectadas = new HashSet<>();
                if(pub.getRelaciones() != null) {
                    pub.getRelaciones().forEach(r -> joyasAfectadas.add(r.getJoya()));
                }

                publicacionRepository.delete(pub);
                publicacionRepository.flush(); // Fuerza borrado inmediato

                for(Joya j : joyasAfectadas) recalcularEstadoRedes(j);

                huboBorrados = true;
            }
        }
        if (huboBorrados) return publicacionRepository.findAll();
        return todas;
    }

    @PostMapping
    public Publicacion registrarVideoNuevo(@RequestBody Publicacion publicacion){
        Publicacion pubGuardada = publicacionService.registrarPublicacion(publicacion);

        // Forzar recálculo tras crear para asegurar los estados
        if(pubGuardada.getRelaciones() != null) {
            for(PublicacionJoya pj : pubGuardada.getRelaciones()) {
                recalcularEstadoRedes(pj.getJoya());
            }
        }
        return pubGuardada;
    }

    @PutMapping("/{id}")
    public Publicacion editarVideo(@PathVariable Long id, @RequestBody Publicacion datosActualizados){
        return publicacionRepository.findById(id).map(pub -> {

            // 1. Respaldar IDs de joyas antiguas para recalcularlas si las quitas
            Set<Long> idsParaRecalcular = new HashSet<>();
            if (pub.getRelaciones() != null) {
                pub.getRelaciones().forEach(r -> idsParaRecalcular.add(r.getJoya().getId()));
            }

            // 2. Actualizar datos base del video
            pub.setTitulo(datosActualizados.getTitulo());
            pub.setPlataforma(datosActualizados.getPlataforma());
            pub.setFormato(datosActualizados.getFormato());
            pub.setFechaPublicacion(datosActualizados.getFechaPublicacion());
            pub.setCantidadFotos(datosActualizados.getCantidadFotos());

            // 3. Recrear relaciones
            pub.getRelaciones().clear();
            if(datosActualizados.getJoyas() != null) {
                for(Joya joyaRef : datosActualizados.getJoyas()) {
                    Joya joyaReal = joyaRepository.findById(joyaRef.getId()).orElse(null);
                    if(joyaReal != null) {
                        PublicacionJoya relacion = new PublicacionJoya();
                        relacion.setPublicacion(pub);
                        relacion.setJoya(joyaReal);
                        relacion.setStockAlSubir(joyaReal.getStock());
                        pub.getRelaciones().add(relacion);

                        idsParaRecalcular.add(joyaReal.getId());
                    }
                }
            }

            Publicacion pubGuardada = publicacionRepository.saveAndFlush(pub);

            // 4. Recalcular TODO (las que sacaste del video y las nuevas que pusiste)
            for(Long joyaId : idsParaRecalcular) {
                joyaRepository.findById(joyaId).ifPresent(this::recalcularEstadoRedes);
            }

            return pubGuardada;
        }).orElseThrow(() -> new RuntimeException("Publicación no encontrada"));
    }

    @PutMapping("/{id}/metricas")
    public Publicacion actualizarMetricas(@PathVariable Long id, @RequestBody Publicacion metricas){
        return publicacionService.actualizarMetricas(id,metricas);
    }

    @DeleteMapping("/{id}")
    public void eliminarPublicacion(@PathVariable Long id){
        Publicacion pub = publicacionRepository.findById(id).orElse(null);
        if(pub != null) {
            Set<Joya> joyasAfectadas = new HashSet<>();
            if(pub.getRelaciones() != null) {
                pub.getRelaciones().forEach(r -> joyasAfectadas.add(r.getJoya()));
            }

            publicacionRepository.delete(pub);
            publicacionRepository.flush(); // Obligar a la BD a olvidar este video altiro

            // Recalcular las joyas huérfanas
            for(Joya j : joyasAfectadas) {
                recalcularEstadoRedes(j);
            }
        }
    }
}