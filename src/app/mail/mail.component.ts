import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
// Store
import { Store } from '@ngrx/store';
// Actions
import {
  AccountDetailsGet,
  BlackListGet,
  GetDomains,
  GetDomainsSuccess,
  GetFilters,
  GetInvoices,
  GetMailboxes,
  SaveAutoResponder,
  WhiteListGet
} from '../store/actions';
import { TimezoneGet } from '../store/actions/timezone.action';
import { AppState, AutoResponder, UserState } from '../store/datatypes';
import { getMailComponentShortcuts, SharedService } from '../store/services';
import { ComposeMailService } from '../store/services/compose-mail.service';
import { GetOrganizationUsers } from '../store/organization.store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { KeyboardShortcutsComponent, ShortcutInput } from 'ng-keyboard-shortcuts';

@Component({
  selector: 'app-mail',
  templateUrl: './mail.component.html',
  styleUrls: ['./mail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MailComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild('input', { static: false }) input: ElementRef;
  // TODO : disable shortcuts until the bugs are fixed
   @ViewChild(KeyboardShortcutsComponent, { static: false }) private keyboard: KeyboardShortcutsComponent;
  @ViewChild('composeMailContainer', { static: false, read: ViewContainerRef }) composeMailContainer: ViewContainerRef;
  private isLoadedData: boolean;
  autoresponder: AutoResponder = {};
  autoresponder_status = false;
  currentDate: string;
  shortcuts: ShortcutInput[] = [];
  constructor(private store: Store<AppState>,
              private sharedService: SharedService,
              private composeMailService: ComposeMailService,
              private router: Router,
              private cdr: ChangeDetectorRef) {
    this.currentDate = formatDate(new Date(), 'yyyy-MM-dd', 'en');
  }

  ngOnInit() {
    this.store.dispatch(new AccountDetailsGet());

    this.store.select(state => state.user).pipe(untilDestroyed(this))
      .subscribe((userState: UserState) => {
        if (userState.isLoaded && !this.isLoadedData) {
          this.isLoadedData = true;
          this.store.dispatch(new GetMailboxes());
          this.store.dispatch(new TimezoneGet());

          setTimeout(() => {
            this.store.dispatch(new GetFilters());
            this.store.dispatch(new WhiteListGet());
            this.store.dispatch(new BlackListGet());
            this.store.dispatch(new GetInvoices());
          }, 500);

          if (userState.isPrime) {
            setTimeout(() => {
              this.store.dispatch(new GetDomains());
              this.store.dispatch(new GetOrganizationUsers());
            }, 1000);
          } else {
            this.store.dispatch(new GetDomainsSuccess([]));
          }
        }
        if (userState.autoresponder) {
          this.autoresponder = userState.autoresponder;
          if (this.autoresponder.autoresponder_active ||
            (this.autoresponder.vacationautoresponder_active && this.autoresponder.vacationautoresponder_message &&
              this.autoresponder.start_date && this.autoresponder.end_date && this.currentDate >= this.autoresponder.start_date)) {
            this.autoresponder_status = true;
          } else {
            this.autoresponder_status = false;
          }
        }
      });

    this.sharedService.hideFooter.emit(true);
    this.sharedService.hideHeader.emit(true);
    this.sharedService.hideEntireFooter.emit(true);
    this.sharedService.isMail.emit(true);
  }


  endAutoResponder() {
    this.autoresponder.autoresponder_active = false;
    this.autoresponder.vacationautoresponder_active = false;
    this.store.dispatch(new SaveAutoResponder(this.autoresponder));
    this.autoresponder_status = false;
  }

  ngAfterViewInit() {
    this.composeMailService.initComposeMailContainer(this.composeMailContainer);
    // TODO : disable shortcuts until the bugs are fixed
     this.shortcuts = getMailComponentShortcuts(this);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.sharedService.hideFooter.emit(false);
    this.sharedService.hideHeader.emit(false);
    this.sharedService.hideEntireFooter.emit(false);
    this.sharedService.isMail.emit(false);
    this.composeMailService.destroyAllComposeMailDialogs();
  }

  navigateToPage(path: string) {
    this.router.navigateByUrl(path);
  }
}
