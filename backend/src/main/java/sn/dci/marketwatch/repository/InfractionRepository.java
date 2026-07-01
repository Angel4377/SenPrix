package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.Infraction;
import java.util.List;

public interface InfractionRepository extends JpaRepository<Infraction, Long> {
    List<Infraction> findByAgent_IdOrderByCreatedAtDesc(Long agentId);
    List<Infraction> findAllByOrderByCreatedAtDesc();
}
