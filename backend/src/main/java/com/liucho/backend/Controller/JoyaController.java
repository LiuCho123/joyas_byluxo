package com.liucho.backend.Controller;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Repository.JoyaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/joyas")
@CrossOrigin(origins = "*")
public class JoyaController {

    @Autowired
    private JoyaRepository joyaRepository;

    @GetMapping
    public List<Joya> obtenerTodas(){
        return joyaRepository.findAll();
    }

    @PostMapping
    public Joya crearJoya(@RequestBody Joya joya){
        if (joya.getEstadoRedes() != null){
            joya.getEstadoRedes().setJoya(joya);
        } else{
            EstadoRedes redesVacias = new EstadoRedes();
            redesVacias.setJoya(joya);
            joya.setEstadoRedes(redesVacias);
        }
        return joyaRepository.save(joya);
    }

    @DeleteMapping("/{id}")
    public void eliminarJoya(@PathVariable Long id){
        joyaRepository.deleteById(id);
    }

}
