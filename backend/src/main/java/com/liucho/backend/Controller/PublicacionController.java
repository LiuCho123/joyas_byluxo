package com.liucho.backend.Controller;

import com.liucho.backend.Model.Publicacion;
import com.liucho.backend.Repository.PublicacionRepository;
import com.liucho.backend.Service.PublicacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publicaciones")
@CrossOrigin(origins = "*")
public class PublicacionController {

    @Autowired private PublicacionRepository publicacionRepository;
    @Autowired private PublicacionService publicacionService;

    @GetMapping
    public List<Publicacion> obtenerTodas(){
        publicacionService.limpiarHistoriasViejas();
        return publicacionRepository.findAll();
    }

    @PostMapping
    public Publicacion registrarVideoNuevo(@RequestBody Publicacion publicacion){
        return publicacionService.registrarPublicacion(publicacion);
    }

    @PutMapping("/{id}")
    public Publicacion editarVideo(@PathVariable Long id, @RequestBody Publicacion datosActualizados){
        return publicacionService.editarPublicacion(id, datosActualizados);
    }

    @PutMapping("/{id}/metricas")
    public Publicacion actualizarMetricas(@PathVariable Long id, @RequestBody Publicacion metricas){
        return publicacionService.actualizarMetricas(id, metricas);
    }

    @DeleteMapping("/{id}")
    public void eliminarPublicacion(@PathVariable Long id){
        publicacionService.eliminarPublicacion(id);
    }
}