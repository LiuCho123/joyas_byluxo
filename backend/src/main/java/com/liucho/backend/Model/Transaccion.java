package com.liucho.backend.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Entity
@Table(name = "transacciones")
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fecha;
    private String tipo;
    private String categoria;
    private String detalle;

    private Integer entra;
    private Integer sale;

    private Integer comision;

    @OneToMany(mappedBy = "transaccion", cascade = CascadeType.ALL)
    private List<ItemVenta> items;
}
