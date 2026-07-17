package com.liucho.backend.Controller;

import com.liucho.backend.Model.Publicacion;
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
    private PublicacionService publicacionService;

    @GetMapping
    public List<Publicacion> obtenerTodas(){
        List<Publicacion> todas = publicacionRepository.findAll();
        LocalDate hace5Dias = LocalDate.now().minusDays(5);
        boolean huboBorrados = false;

        for (Publicacion pub : todas) {
            // Borra SOLAMENTE si el formato es exactamente "Historia" y ya pasaron 5 días
            if ("Historia".equalsIgnoreCase(pub.getFormato()) &&
                    pub.getFechaPublicacion() != null &&
                    pub.getFechaPublicacion().isBefore(hace5Dias)) {

                publicacionRepository.delete(pub);
                huboBorrados = true;
            }
        }

        if (huboBorrados) {
            return publicacionRepository.findAll();
        }
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

            pub.setJoyas(datosActualizados.getJoyas());

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