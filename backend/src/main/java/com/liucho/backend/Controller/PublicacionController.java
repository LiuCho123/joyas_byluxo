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
import java.util.List;

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

                publicacionRepository.delete(pub);
                huboBorrados = true;
            }
        }
        if (huboBorrados) return publicacionRepository.findAll();
        return todas;
    }

    @PostMapping
    public Publicacion registrarVideoNuevo(@RequestBody Publicacion publicacion){
        return publicacionService.registrarPublicacion(publicacion);
    }

    @PutMapping("/{id}")
    public Publicacion editarVideo(@PathVariable Long id, @RequestBody Publicacion datosActualizados){
        return publicacionRepository.findById(id).map(pub -> {
            pub.setTitulo(datosActualizados.getTitulo());
            pub.setPlataforma(datosActualizados.getPlataforma());
            pub.setFormato(datosActualizados.getFormato());
            pub.setFechaPublicacion(datosActualizados.getFechaPublicacion());
            pub.setCantidadFotos(datosActualizados.getCantidadFotos());

            // Actualizar joyas, re-congelar stock y ACTUALIZAR ESTADO DE REDES
            if(datosActualizados.getJoyas() != null) {
                pub.getRelaciones().clear();
                for(Joya joyaRef : datosActualizados.getJoyas()) {
                    Joya joyaReal = joyaRepository.findById(joyaRef.getId()).orElse(null);
                    if(joyaReal != null) {
                        // 1. Actualizar Estados de Redes
                        EstadoRedes redes = joyaReal.getEstadoRedes();
                        String fechaHoy = LocalDate.now().toString();
                        String plat = pub.getPlataforma();
                        String form = pub.getFormato();

                        if ("Instagram".equalsIgnoreCase(plat)){
                            redes.setIgEstado("Activo");
                            redes.setIgUltimaFecha(fechaHoy);
                            redes.setIgFormato(form);
                        } else if ("TikTok".equalsIgnoreCase(plat)){
                            redes.setTkEstado("Activo");
                            redes.setTkUltimaFecha(fechaHoy);
                            redes.setTkFormato(form);
                        } else if ("Marketplace".equalsIgnoreCase(plat)){
                            redes.setMkpEstado("Activo");
                            redes.setMkpUltimaFecha(fechaHoy);
                        } else if ("WhatsApp".equalsIgnoreCase(plat)){
                            if ("Catálogo".equalsIgnoreCase(form)) {
                                redes.setWspCatalogo("Activo");
                            } else if ("Estado".equalsIgnoreCase(form)) {
                                redes.setWspUltimaFecha(fechaHoy);
                            }
                        }
                        joyaRepository.save(joyaReal);

                        // 2. Congelar Stock
                        PublicacionJoya relacion = new PublicacionJoya();
                        relacion.setPublicacion(pub);
                        relacion.setJoya(joyaReal);
                        relacion.setStockAlSubir(joyaReal.getStock());
                        pub.getRelaciones().add(relacion);
                    }
                }
            }
            return publicacionRepository.save(pub);
        }).orElseThrow(() -> new RuntimeException("Publicación no encontrada"));
    }

    @PutMapping("/{id}/metricas")
    public Publicacion actualizarMetricas(@PathVariable Long id, @RequestBody Publicacion metricas){
        return publicacionService.actualizarMetricas(id,metricas);
    }

    @DeleteMapping("/{id}")
    public void eliminarPublicacion(@PathVariable Long id){
        publicacionRepository.deleteById(id);
    }
}