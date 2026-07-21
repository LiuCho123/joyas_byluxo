package com.liucho.backend.Controller;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Service.ExcelExportService;
import com.liucho.backend.Service.PublicacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/joyas")
@CrossOrigin(origins = "*")
public class JoyaController {

    @Autowired private JoyaRepository joyaRepository;
    @Autowired private PublicacionService publicacionService;
    @Autowired private ExcelExportService excelExportService;

    @GetMapping
    public List<Joya> obtenerTodas(){
        return joyaRepository.findAll();
    }

    @PostMapping
    public Joya guardarJoya(@RequestBody Joya joya){
        if (joya.getEstadoRedes() != null){
            joya.getEstadoRedes().setJoya(joya);
        } else{
            EstadoRedes redesVacias = new EstadoRedes();
            redesVacias.setJoya(joya);
            joya.setEstadoRedes(redesVacias);
        }
        Joya guardada = joyaRepository.save(joya);

        publicacionService.recalcularEstadoJoya(guardada.getId());
        return joyaRepository.findById(guardada.getId()).orElse(guardada);
    }

    @PutMapping("/{id}")
    public Joya editarJoya(@PathVariable Long id, @RequestBody Joya datosActualizados) {
        return joyaRepository.findById(id).map(joya -> {
            joya.setNombre(datosActualizados.getNombre());
            joya.setCategoria(datosActualizados.getCategoria());
            joya.setFechaAdquisicion(datosActualizados.getFechaAdquisicion());
            joya.setFechaLimiteOferta(datosActualizados.getFechaLimiteOferta()); // NUEVO
            joya.setPrecio(datosActualizados.getPrecio());
            joya.setPrecioOferta(datosActualizados.getPrecioOferta());
            joya.setStock(datosActualizados.getStock());
            joya.setLargo(datosActualizados.getLargo());
            joya.setPeso(datosActualizados.getPeso());
            joya.setFotoUrl(datosActualizados.getFotoUrl());

            if (datosActualizados.getEstadoRedes() != null) {
                EstadoRedes redesNuevas = datosActualizados.getEstadoRedes();
                EstadoRedes redesViejas = joya.getEstadoRedes();

                if (redesViejas == null) {
                    redesNuevas.setJoya(joya);
                    joya.setEstadoRedes(redesNuevas);
                } else {
                    redesViejas.setIgEstado(redesNuevas.getIgEstado());
                    redesViejas.setIgUltimaFecha(redesNuevas.getIgUltimaFecha());
                    redesViejas.setIgFormato(redesNuevas.getIgFormato());

                    redesViejas.setTkEstado(redesNuevas.getTkEstado());
                    redesViejas.setTkUltimaFecha(redesNuevas.getTkUltimaFecha());
                    redesViejas.setTkFormato(redesNuevas.getTkFormato());

                    redesViejas.setMkpEstado(redesNuevas.getMkpEstado());
                    redesViejas.setMkpUltimaFecha(redesNuevas.getMkpUltimaFecha());
                    redesViejas.setMkpConversacion(redesNuevas.getMkpConversacion());

                    redesViejas.setWspCatalogo(redesNuevas.getWspCatalogo());
                    redesViejas.setWspUltimaFecha(redesNuevas.getWspUltimaFecha());
                }
            }

            Joya editada = joyaRepository.save(joya);
            publicacionService.recalcularEstadoJoya(editada.getId());
            return editada;
        }).orElseThrow(() -> new RuntimeException("Joya no encontrada"));
    }

    @DeleteMapping("/{id}")
    public void eliminarJoya(@PathVariable Long id){
        joyaRepository.deleteById(id);
    }

    @GetMapping("/exportar/excel")
    public ResponseEntity<InputStreamResource> exportarExcel() throws IOException {
        ByteArrayInputStream in = excelExportService.exportarExcelCompleto();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=Joyas_ByLuxo.xlsx");
        return ResponseEntity.ok().headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
}