import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();

const String _baseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:4000/api/v1',
);

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  // Auth interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try refresh
          try {
            final refreshToken = await _storage.read(key: 'refresh_token');
            if (refreshToken == null) {
              handler.next(error);
              return;
            }
            final response = await Dio().post(
              '$_baseUrl/auth/refresh',
              data: {'refreshToken': refreshToken},
            );
            final newToken = response.data['data']['accessToken'] as String;
            await _storage.write(key: 'access_token', value: newToken);
            // Retry
            error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
            final retryResponse = await dio.fetch(error.requestOptions);
            handler.resolve(retryResponse);
          } catch (_) {
            await _storage.deleteAll();
            handler.next(error);
          }
        } else {
          handler.next(error);
        }
      },
    ),
  );

  // Logging in debug mode
  assert(() {
    dio.interceptors.add(LogInterceptor(responseBody: true));
    return true;
  }());

  return dio;
});
