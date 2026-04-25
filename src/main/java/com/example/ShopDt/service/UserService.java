package com.example.ShopDt.service;

import com.example.ShopDt.dto.request.RegisterRequest;
import com.example.ShopDt.dto.request.UpdateRequest;
import com.example.ShopDt.dto.response.LoginResponse;
import com.example.ShopDt.dto.response.UserResponse;
import com.example.ShopDt.entity.Role;
import com.example.ShopDt.entity.User;
import com.example.ShopDt.mapper.user.UserMapper;
import com.example.ShopDt.repository.RoleRepository;
import com.example.ShopDt.repository.UserRepository;
import com.example.ShopDt.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private  final CurrentUserService currentUserService;

    public UserResponse createUser(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Email '{}' đã tồn tại", request.getEmail());
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            log.warn("Mật khẩu là bắt buộc");
            throw new IllegalArgumentException("Mật khẩu là bắt buộc");
        }

        User user = userMapper.toUser(request);
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        Role role = roleRepository.findById(2L)
                .orElseThrow(() -> new IllegalArgumentException("Role không tồn tại"));
        user.setRole(role);

        User savedUser = userRepository.save(user);

        return userMapper.toUserResponse(savedUser);
    }

    //  Login bằng username và password
    public LoginResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy username: " + username));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Sai mật khẩu!");
        }

        String token = jwtService.generateToken(username, Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole().getName()
        ));

        log.info("User '{}' đã đăng nhập thành công", username);

        return new LoginResponse(user.getId(),token, user.getUsername(), user.getRole().getName());
    }
    //lấy profile
    public UserResponse getProfile(String token) {
        String username = jwtService.extractUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user: " + username));

        return userMapper.toUserResponse(user);
    }

    // Update user đang login
    public UserResponse updateUser(UpdateRequest request) {

        User user = currentUserService.getCurrentUser();


        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());

        return userMapper.toUserResponse(userRepository.save(user));
    }

@PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

}