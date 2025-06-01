import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.orgId,
    this.avatarUrl,
  });

  final String id;
  final String email;
  final String name;
  final String orgId;
  final String? avatarUrl;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final org = (json['orgs'] as List<dynamic>?)?.firstOrNull;
    return AuthUser(
      id:        json['id'] as String,
      email:     json['email'] as String,
      name:      json['name'] as String? ?? json['email'] as String,
      orgId:     org != null ? (org as Map<String, dynamic>)['orgId'] as String : '',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

sealed class AuthState {
  const AuthState();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final AuthUser user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated([this.error]);
  final String? error;
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class AuthNotifier extends AsyncNotifier<AuthState> {
  static const _storage = FlutterSecureStorage();

  @override
  Future<AuthState> build() async {
    return _checkSession();
  }

  Future<AuthState> _checkSession() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) return const AuthUnauthenticated();

    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/auth/me');
      final user = AuthUser.fromJson(res.data as Map<String, dynamic>);
      await _storage.write(key: 'org_id', value: user.orgId);
      return AuthAuthenticated(user);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await _storage.deleteAll();
        return const AuthUnauthenticated();
      }
      // Network error — keep state as unauthenticated but don't clear tokens
      return const AuthUnauthenticated();
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncData(AuthLoading());
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final body = res.data as Map<String, dynamic>;
      // Support both { accessToken, user } and { data: { accessToken, user } }
      final data = body['data'] as Map<String, dynamic>? ?? body;

      final accessToken  = data['accessToken']  as String;
      final refreshToken = data['refreshToken'] as String;
      final userJson     = data['user']         as Map<String, dynamic>;

      await _storage.write(key: 'access_token',  value: accessToken);
      await _storage.write(key: 'refresh_token', value: refreshToken);

      final user = AuthUser.fromJson(userJson);
      await _storage.write(key: 'org_id', value: user.orgId);

      state = AsyncData(AuthAuthenticated(user));
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Invalid email or password';
      state = AsyncData(AuthUnauthenticated(msg));
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        final dio = ref.read(dioProvider);
        await dio.post('/auth/logout', data: {'refreshToken': refreshToken});
      }
    } catch (_) {
      // Best-effort logout — always clear local state
    } finally {
      await _storage.deleteAll();
      state = const AsyncData(AuthUnauthenticated());
    }
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

// Convenience selectors
final isAuthenticatedProvider = Provider<bool>((ref) {
  final auth = ref.watch(authProvider).valueOrNull;
  return auth is AuthAuthenticated;
});

final currentUserProvider = Provider<AuthUser?>((ref) {
  final auth = ref.watch(authProvider).valueOrNull;
  return auth is AuthAuthenticated ? auth.user : null;
});

final currentOrgIdProvider = Provider<String?>((ref) {
  return ref.watch(currentUserProvider)?.orgId;
});
