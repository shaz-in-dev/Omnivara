import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SamlStrategy } from './strategies/saml.strategy';
import { SsoController } from './sso.controller';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
// EmailModule is @Global() so EmailService is available without explicit import

// Only register SamlStrategy if a real IdP cert is configured
const samlProviders = process.env.SAML_CERT && process.env.SAML_CERT.length > 100
  ? [SamlStrategy]
  : [];

@Module({
  imports: [
    UsersModule,
    StorageModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.accessExpiry', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, SsoController],
  providers: [AuthService, JwtStrategy, LocalStrategy, ...samlProviders],
  exports: [AuthService],
})
export class AuthModule {}
