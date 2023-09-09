// Angular
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

// Ionic
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// App
import { environment } from './environments/environment';
import { AppRoutes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';

// Angular
if (environment.production) {
  enableProdMode();
}

// App
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(
      IonicModule.forRoot({
        mode: 'ios',
        swipeBackEnabled: false,
        innerHTMLTemplatesEnabled: true
      })
    ),
    provideHttpClient(),
    provideRouter(AppRoutes)
  ],
});