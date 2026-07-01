package sn.dci.marketwatch.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import sn.dci.marketwatch.entity.Utilisateur;

import java.util.Collection;
import java.util.List;

@Getter
public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String name;
    private final String username;   // email
    private final String password;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Utilisateur user) {
        this.id = user.getId();
        this.name = user.getName();
        this.username = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole().name();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return true; }
}
