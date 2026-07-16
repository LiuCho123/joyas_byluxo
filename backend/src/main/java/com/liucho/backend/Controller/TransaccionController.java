package com.liucho.backend.Controller;

import com.liucho.backend.Model.Transaccion;
import com.liucho.backend.Repository.TransaccionRepository;
import com.liucho.backend.Service.TransaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
@CrossOrigin(origins = "*")
public class TransaccionController {

    @Autowired
    private TransaccionService transaccionService;

    @Autowired
    private TransaccionRepository transaccionRepository;

    @GetMapping
    public List<Transaccion> obtenerTodas(){
        return transaccionRepository.findAll();
    }

    @PostMapping
    public Transaccion crearTransaccion(@RequestBody Transaccion transaccion){
        if ("Venta de Joya".equalsIgnoreCase(transaccion.getCategoria())){
            return transaccionService.registrarVenta(transaccion);
        } else {
            return transaccionService.registrarMovimientoSimple(transaccion);
        }
    }
}
