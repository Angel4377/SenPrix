package sn.dci.marketwatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.AlertConfig;

public interface AlertConfigRepository extends JpaRepository<AlertConfig, Long> {
}
