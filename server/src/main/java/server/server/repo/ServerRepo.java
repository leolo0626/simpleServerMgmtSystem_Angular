package server.server.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import server.server.model.Server;

public interface ServerRepo extends JpaRepository<Server, Long> {
    Server findByIpAddress(String ipAddress);

}
