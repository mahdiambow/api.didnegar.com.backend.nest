import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AuthService } from './auth/auth.service.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'api.didnegar.com.backend.nest',
    }),
  ],
  controllers: [],
  providers: [AuthService],
})
export class AppModule {}
