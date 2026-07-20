package com.liucho.backend.Controller;

import com.liucho.backend.Model.Joya;
import com.liucho.backend.Model.Publicacion;
import com.liucho.backend.Model.PublicacionJoya;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Repository.PublicacionRepository;
import com.liucho.backend.Service.PublicacionService;
import com.liucho.backend.Service.RecalculoService;
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

    @Autowired
    private RecalculoService recalculoService;

    @GetMapping
    public List<Publicacion> obtenerTodas(){
        List<Publicacion> todas = publicacionRepository.findAll();
        LocalDate hace5Dias = LocalDate.now().minusDays(5);
        boolean huboBorrados = false;

        for (Publicacion pub : todas) {
            if ("Historia".equalsIgnoreCase(pub.getFormato()) &&
                    pub.getFechaPublicacion() != null &&
                    pub.getFechaPublicacion().isBefore(hace5Dias)) {

                Set<Long> idsAfectados = new HashSet<>();
                if(pub.getRelaciones() != null) {
                    pub.getRelaciones().forEach(r -> idsAfectados.add(r.getJoya().getId()));
                }

                publicacionRepository.delete(pub);
                publicacionRepository.flush(); // Obliga el borrado inmediato

                for(Long jId : idsAfectados) recalculoService.recalcularEstadoJoya(jId);

                huboBorrados = true;
            }
        }
        if (huboBorrados) return publicacionRepository.findAll();
        return todas;
    }

    @PostMapping
    public Publicacion registrarVideoNuevo(@RequestBody Publicacion publicacion){
        Publicacion pubGuardada = publicacionService.registrarPublicacion(publicacion);

        if(pubGuardada.getRelaciones() != null) {
            for(PublicacionJoya pj : pubGuardada.getRelaciones()) {
                recalculoService.recalcularEstadoJoya(pj.getJoya().getId());
            }
        }
        return pubGuardada;
    }

    @PutMapping("/{id}")
    public Publicacion editarVideo(@PathVariable Long id, @RequestBody Publicacion datosActualizados){
        return publicacionRepository.findById(id).map(pub -> {

            Set<Long> idsParaRecalcular = new HashSet<>();
            if (pub.getRelaciones() != null) {
                pub.getRelaciones().forEach(r -> idsParaRecalcular.add(r.getJoya().getId()));
            }

            pub.setTitulo(datosActualizados.getTitulo());
            pub.setPlataforma(datosActualizados.getPlataforma());
            pub.setFormato(datosActualizados.getFormato());
            pub.setFechaPublicacion(datosActualizados.getFechaPublicacion());
            pub.setCantidadFotos(datosActualizados.getCantidadFotos());

            pub.getRelaciones().clear();
            publicacionRepository.flush(); // Limpia la tabla intermedia vieja rápido

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

            for(Long joyaId : idsParaRecalcular) {
                recalculoService.recalcularEstadoJoya(joyaId);
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
            Set<Long> idsAfectados = new HashSet<>();
            if(pub.getRelaciones() != null) {
                pub.getRelaciones().forEach(r -> idsAfectados.add(r.getJoya().getId()));
            }

            publicacionRepository.delete(pub);
            publicacionRepository.flush(); // BD limpia de inmediato

            for(Long jId : idsAfectados) {
                recalculoService.recalcularEstadoJoya(jId);
            }
        }
    }
}