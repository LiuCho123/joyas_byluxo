package com.liucho.backend.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Entity
@Table(name = "publicaciones")
public class Publicacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String plataforma;
    private String formato;

    private LocalDate fechaPublicacion;
    private String estado;

    private Integer reproducciones = 0;
    private Integer likes = 0;
    private Integer comentarios = 0;
    private Integer guardados = 0;
    private Integer compartidos = 0;

    @ManyToMany
    @JoinTable(
            name = "publicacion_joya",
            joinColumns = @JoinColumn(name = "publicacion_id"),
            inverseJoinColumns = @JoinColumn(name = "joya_id")
    )
    private List<Joya> joyas;
}
