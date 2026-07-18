package com.liucho.backend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.ArrayList;
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
    private Integer cantidadFotos;

    private Integer reproducciones = 0;
    private Integer likes = 0;
    private Integer comentarios = 0;
    private Integer guardados = 0;
    private Integer compartidos = 0;

    @OneToMany(mappedBy = "publicacion", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("publicacion")
    private List<PublicacionJoya> relaciones = new ArrayList<>();

    @Transient
    private List<Joya> joyas; // Solo se usa para recibir los datos desde React
}