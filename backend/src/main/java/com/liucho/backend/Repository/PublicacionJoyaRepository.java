package com.liucho.backend.Repository;

import com.liucho.backend.Model.PublicacionJoya;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PublicacionJoyaRepository extends JpaRepository<PublicacionJoya, Long> {
}
