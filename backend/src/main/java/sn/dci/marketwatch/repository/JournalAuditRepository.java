package sn.dci.marketwatch.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import sn.dci.marketwatch.entity.JournalAudit;

import java.time.LocalDateTime;
import java.util.List;

public interface JournalAuditRepository extends JpaRepository<JournalAudit, Long> {

    Page<JournalAudit> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<JournalAudit> findByActionOrderByCreatedAtDesc(JournalAudit.Action action, Pageable pageable);

    List<JournalAudit> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since);
}
