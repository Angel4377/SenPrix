package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.Mission;
import java.util.List;

public interface MissionRepository extends JpaRepository<Mission, Long> {
    List<Mission> findByAgent_IdOrderByScheduledDateDesc(Long agentId);
}
