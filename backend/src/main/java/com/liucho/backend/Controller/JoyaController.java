package com.liucho.backend.Controller;

import com.liucho.backend.Model.EstadoRedes;
import com.liucho.backend.Model.Joya;
import com.liucho.backend.Repository.JoyaRepository;
import com.liucho.backend.Service.ExcelExportService;
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

    @Autowired
    private JoyaRepository joyaRepository;

    @Autowired
    private ExcelExportService excelExportService;

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

    @GetMapping("/exportar/excel")
    public ResponseEntity<InputStreamResource> exportarExcel() throws IOException {
        ByteArrayInputStream in = excelExportService.exportarJoyas();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=Joyas_ByLuxo.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
}
