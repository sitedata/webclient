// Angular
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
// Bootstrap
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// Modules
import { PagesRoutingModule } from './pages-routing.module';
import { SharedModule } from '../shared/shared.module';
// Components
import { PagesAboutComponent } from './pages-about/pages-about.component';
import { PagesDonateComponent } from './pages-donate/pages-donate.component';
import { PagesMediaKitComponent } from './pages-media-kit/pages-media-kit.component';
import { PagesPrivacyComponent } from './pages-privacy/pages-privacy.component';
import { PagesSecurityComponent } from './pages-security/pages-security.component';
import { PagesTermsComponent } from './pages-terms/pages-terms.component';
import { PagesTorOnionComponent } from './pages-tor-onion/pages-tor-onion.component';
import { PaymentOptionsComponent } from './pages-donate/payment-options/payment-options.component';

@NgModule({
  imports: [
    CommonModule,
    NgbModule,
    PagesRoutingModule,
    SharedModule
  ],
  declarations: [
    PagesAboutComponent,
    PagesSecurityComponent,
    PagesDonateComponent,
    PagesMediaKitComponent,
    PagesTorOnionComponent,
    PagesPrivacyComponent,
    PagesTermsComponent,
    PaymentOptionsComponent
  ]
})
export class PagesModule { }
