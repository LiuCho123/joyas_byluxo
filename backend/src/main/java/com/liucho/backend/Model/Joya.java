package com.liucho.backend.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(name = "joyas")
public class Joya {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String nombre;
    private Integer stock;
    private Integer precio;
    private Double largo;
    private Double peso;

    @Column(columnDefinition = "TEXT")
    private String fotoUrl;

    @OneToOne(mappedBy = "joya", cascade = CascadeType.ALL)
    @JsonManagedReference
    private EstadoRedes estadoRedes;

    @ManyToMany
    @JsonIgnore
    private List<Publicacion> publicaciones;
}
